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

export type Env = {
  Bindings: {
    DB: D1Database;
  };
};

const app = new Hono<Env>();

// Enterprise Security Headers
app.use('*', secureHeaders({
  xXssProtection: '1; mode=block',
  xFrameOptions: 'DENY',
  strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
}));

// Strict CORS Policy for API Routes
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

// SEO: Edge-Cached Crawl Directive
app.get('/robots.txt', cache({ cacheName: 'seo-cache', cacheControl: 'max-age=86400' }), (c) => {
  return c.text(
    "User-agent: *\n" +
    "Allow: /\n" +
    "Disallow: /api/\n" +
    "Disallow: /*?token=*\n" +
    "Sitemap: https://visatk.us/sitemap.xml"
  );
});

// SEO: Dynamic Edge Sitemap Generation
app.get('/sitemap.xml', async (c) => {
  const db = drizzle(c.env.DB);
  
  // Fetch latest 1000 threads for SEO indexing
  const recentThreads = await db.select({ id: threads.id, updatedAt: threads.updatedAt })
    .from(threads)
    .orderBy(desc(threads.updatedAt))
    .limit(1000);

  const staticRoutes = ['', '/tools/bin-checker', '/tools/card-checker', '/tools/fake-address', '/forum', '/vip'];
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  // Map static routes
  staticRoutes.forEach(route => {
    xml += `  <url>\n    <loc>https://visatk.us${route}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${route === '' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
  });

  // Map dynamic forum threads
  recentThreads.forEach(thread => {
    const date = thread.updatedAt ? new Date(thread.updatedAt).toISOString() : new Date().toISOString();
    xml += `  <url>\n    <loc>https://visatk.us/forum/thread/${thread.id}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  });

  xml += `</urlset>`;
  
  c.header('Content-Type', 'application/xml');
  c.header('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // CDN Cache for 1 hour
  return c.body(xml);
});

export default { fetch: app.fetch };
