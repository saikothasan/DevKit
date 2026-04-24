import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { cors } from 'hono/cors';
import { cache } from 'hono/cache';
import { drizzle } from 'drizzle-orm/d1';
import { desc } from 'drizzle-orm';

import { threads } from './db/schema';
import { authRouter } from './routes/auth';
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
};

const app = new Hono<AppEnv>();

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
app.route('/api/forum', forumRouter);
app.route('/api/tools', toolsRouter);
app.route('/api/chat', chatRouter);
app.route('/api/upload', uploadRouter);
app.route('/api/vip', vipRouter);

app.get('/robots.txt', cache({ cacheName: 'seo-cache', cacheControl: 'max-age=86400' }), (c) => {
  return c.text(
    'User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /*?token=*\nSitemap: https://visatk.us/sitemap.xml'
  );
});

app.get('/sitemap.xml', async (c) => {
  const db = drizzle(c.env.DB);
  const recentThreads = await db
    .select({ id: threads.id, updatedAt: threads.updatedAt })
    .from(threads)
    .orderBy(desc(threads.updatedAt))
    .limit(1000);

  const staticRoutes = ['', '/bin-checker', '/card-checker', '/fake-address', '/', '/vip'];
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  staticRoutes.forEach((route) => {
    xml += `  <url>\n    <loc>https://visatk.us${route}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${route === '' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
  });
  recentThreads.forEach((thread) => {
    const date = thread.updatedAt ? new Date(thread.updatedAt).toISOString() : new Date().toISOString();
    xml += `  <url>\n    <loc>https://visatk.us/forum/thread/${thread.id}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  });
  xml += '</urlset>';
  c.header('Content-Type', 'application/xml');
  c.header('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  return c.body(xml);
});

export default { fetch: app.fetch };
