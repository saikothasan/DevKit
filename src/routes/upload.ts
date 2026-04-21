import { Hono } from 'hono';
import { requireAuth } from './auth';
import { drizzle } from 'drizzle-orm/d1';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export const uploadRouter = new Hono<{ Bindings: { BUCKET: R2Bucket, DB: D1Database }, Variables: { user: any } }>();

const CUSTOM_DOMAIN = 'https://agent-files.visatk.us';

uploadRouter.post('/avatar', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.parseBody();
  const file = body['file'];
  
  if (!(file instanceof File)) return c.json({ error: 'No file provided' }, 400);
  
  // 2MB strict boundary for profile components
  if (file.size > 2 * 1024 * 1024) return c.json({ error: 'File exceeds 2MB limit' }, 400);
  if (!file.type.startsWith('image/')) return c.json({ error: 'Only images are allowed' }, 400);

  const extension = file.name.split('.').pop();
  const fileName = `avatars/${user.id}-${Date.now()}.${extension}`;
  
  await c.env.BUCKET.put(fileName, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type }
  });

  const avatarUrl = `${CUSTOM_DOMAIN}/${fileName}`;
  
  const db = drizzle(c.env.DB);
  await db.update(users).set({ avatarUrl }).where(eq(users.id, user.id));

  return c.json({ success: true, avatarUrl });
});

uploadRouter.post('/chat', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.parseBody();
  const file = body['file'];
  
  if (!(file instanceof File)) return c.json({ error: 'No file provided' }, 400);
  
  // 5MB explicit limit for real-time messaging
  if (file.size > 5 * 1024 * 1024) return c.json({ error: 'File exceeds 5MB limit' }, 400);

  const extension = file.name.split('.').pop() || 'bin';
  const fileName = `chat/${user.id}-${Date.now()}.${extension}`;
  
  await c.env.BUCKET.put(fileName, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type }
  });

  const fileUrl = `${CUSTOM_DOMAIN}/${fileName}`;
  return c.json({ success: true, fileUrl, fileName: file.name, fileType: file.type });
});
