import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { cors } from 'hono/cors';
import { cache } from 'hono/cache';
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import { desc } from 'drizzle-orm';

import { threads } from './db/schema';
import { authRouter } from './routes/auth';
import { binExtractor } from './routes/bin-extractor';
import { forumRouter } from './routes/forum';
import { toolsRouter } from './routes/tools';
import { chatRouter } from './routes/chat';
import { uploadRouter } from './routes/upload';
import { vipRouter } from './routes/vip';

export type AppEnv = {
  Bindings: {
    DB: D1Database;
    BUCKET: R2Bucket;
    JWT_SECRET: string;
    TURNSTILE_SECRET_KEY: string;
    RESEND_API_KEY: string;
    RESEND_FROM_EMAIL: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
    APIRONE_ACCOUNT: string;
    BASE_URL: string;
  };
  Variables: {
    db: DrizzleD1Database;
    reqId: string;
    user?: { id: number; username: string; role: string; exp: number; };
  };
};

const app = new Hono<AppEnv>();

// Edge Observability & Resource Lifecycle Middleware
app.use('*', async (c, next) => {
  c.set('reqId', crypto.randomUUID());
  c.set('db', drizzle(c.env.DB)); // Single instantiation per request vector
  await next();
});

app.use('*', secureHeaders({
  xXssProtection: '1; mode=block',
  xFrameOptions: 'DENY',
  strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
}));

app.use('/api/*', cors({
  origin: ['https://visatk.us', 'http://localhost:5173'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
  credentials: true,
}));

app.route('/api/auth', authRouter);
app.route('/api/bin-extractor', binExtractor);
app.route('/api/forum', forumRouter);
app.route('/api/tools', toolsRouter);
app.route('/api/chat', chatRouter);
app.route('/api/upload', uploadRouter);
app.route('/api/vip', vipRouter);

// Global Error boundaries
app.onError((err, c) => {
  console.error(`[${c.var.reqId}] Execution Fault:`, err);
  return c.json({ error: 'Internal Edge Execution Failure.', reqId: c.var.reqId }, 500);
});

app.notFound((c) => {
  return c.json({ error: 'Endpoint untraceable.', reqId: c.var.reqId }, 404);
});

app.get('/robots.txt', cache({ cacheName: 'seo-cache', cacheControl: 'max-age=86400' }), (c) => {
  return c.text('User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /*?token=*\nSitemap: https://visatk.us/sitemap.xml');
});

const escapeXml = (unsafe: string) => unsafe.replace(/[<>&'"]/g, (char) => {
  switch (char) {
    case '<': return '&lt;';
    case '>': return '&gt;';
    case '&': return '&amp;';
    case '\'': return '&apos;';
    case '"': return '&quot;';
    default: return char;
  }
});

app.get('/sitemap.xml', async (c) => {
  const db = c.var.db;
  const recentThreads = await db
    .select({ id: threads.id, updatedAt: threads.updatedAt })
    .from(threads)
    .orderBy(desc(threads.updatedAt))
    .limit(1000);

  const staticRoutes = ['', '/bin-checker', '/card-checker', '/fake-address', '/vip'];
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  staticRoutes.forEach((route) => {
    xml += `  <url>\n    <loc>https://visatk.us${escapeXml(route)}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${route === '' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
  });
  
  recentThreads.forEach((thread) => {
    const date = thread.updatedAt ? new Date(thread.updatedAt).toISOString() : new Date().toISOString();
    xml += `  <url>\n    <loc>https://visatk.us/forum/thread/${thread.id}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  });
  xml += '</urlset>';
  
  c.header('Content-Type', 'application/xml');
  c.header('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
  return c.body(xml);
});

export default { fetch: app.fetch };
