import { Hono } from 'hono';
import { requireAuth } from './auth';
import { drizzle } from 'drizzle-orm/d1';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const uploadRouter = new Hono<{ Bindings: { BUCKET: R2Bucket, DB: D1Database }, Variables: { user: any } }>();

const CUSTOM_DOMAIN = 'https://agent-files.visatk.us';
const CACHE_CONTROL_IMMUTABLE = 'public, max-age=31536000, immutable';

uploadRouter.post('/avatar', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.parseBody();
  const file = body['file'];
  
  if (!(file instanceof File)) return c.json({ error: 'Payload missing file entity' }, 400);
  
  const MAX_SIZE = 2 * 1024 * 1024;
  if (file.size > MAX_SIZE) return c.json({ error: 'Object exceeds 2MB limit' }, 413);
  if (!file.type.startsWith('image/')) return c.json({ error: 'Invalid MIME type' }, 415);

  const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
  const uniqueId = crypto.randomUUID();
  const objectKey = `avatars/usr_${user.id}_${uniqueId}.${extension}`;
  
  await c.env.BUCKET.put(objectKey, file.stream(), {
    httpMetadata: { 
      contentType: file.type,
      cacheControl: CACHE_CONTROL_IMMUTABLE 
    },
    customMetadata: {
      uploadedBy: String(user.id),
      originalName: file.name
    }
  });

  const avatarUrl = `${CUSTOM_DOMAIN}/${objectKey}`;
  
  const db = drizzle(c.env.DB);
  await db.update(users).set({ avatarUrl }).where(eq(users.id, user.id));

  return c.json({ success: true, avatarUrl });
});

uploadRouter.post('/chat', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.parseBody();
  const file = body['file'];
  
  if (!(file instanceof File)) return c.json({ error: 'Payload missing file entity' }, 400);
  
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) return c.json({ error: 'Object exceeds 5MB limit' }, 413);

  const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const uniqueId = crypto.randomUUID();
  const objectKey = `chat/msg_${user.id}_${uniqueId}.${extension}`;
  
  await c.env.BUCKET.put(objectKey, file.stream(), {
    httpMetadata: { 
      contentType: file.type,
      cacheControl: CACHE_CONTROL_IMMUTABLE
    },
    customMetadata: {
      uploadedBy: String(user.id),
      originalName: file.name
    }
  });

  const fileUrl = `${CUSTOM_DOMAIN}/${objectKey}`;
  return c.json({ 
    success: true, 
    fileUrl, 
    fileName: file.name, 
    fileType: file.type 
  });
});
