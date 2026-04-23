import { Hono } from 'hono';
import { requireAuth } from './auth';
import { drizzle } from 'drizzle-orm/d1';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const uploadRouter = new Hono<{ Bindings: { BUCKET: R2Bucket, DB: D1Database }, Variables: { user: any } }>();

const CUSTOM_DOMAIN = 'https://agent-files.xxxx.visatk.us';
const CACHE_CONTROL_IMMUTABLE = 'public, max-age=31536000, immutable';

const ALLOWED_IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const ALLOWED_AVATAR_EXT = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif']);
const BLOCKED_CHAT_EXT = new Set(['exe', 'bat', 'sh', 'js', 'html', 'htm', 'php', 'svg', 'vbs', 'ps1', 'jar']);

uploadRouter.post('/avatar', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.parseBody();
  const file = body['file'];
  
  if (!(file instanceof File)) return c.json({ error: 'Payload missing file entity' }, 400);
  if (file.size > 2 * 1024 * 1024) return c.json({ error: 'Object exceeds 2MB limit' }, 413);

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_AVATAR_EXT.has(extension) || !ALLOWED_IMAGE_MIMES.has(file.type)) {
    return c.json({ error: 'Invalid or dangerous file format. MIME spoofing detected.' }, 415);
  }

  const uniqueId = crypto.randomUUID();
  const objectKey = `avatars/usr_${user.id}_${uniqueId}.${extension}`;
  
  // Direct streaming to R2 for optimal Worker memory usage
  await c.env.BUCKET.put(objectKey, file.stream(), {
    httpMetadata: { 
      contentType: file.type,
      cacheControl: CACHE_CONTROL_IMMUTABLE 
    },
    customMetadata: { uploadedBy: String(user.id), timestamp: Date.now().toString() }
  });

  const avatarUrl = `${CUSTOM_DOMAIN}/${objectKey}`;
  
  // Non-blocking DB update via execution context
  c.executionCtx.waitUntil(
    drizzle(c.env.DB).update(users).set({ avatarUrl }).where(eq(users.id, user.id)).execute()
  );

  return c.json({ success: true, avatarUrl });
});

uploadRouter.post('/chat', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.parseBody();
  const file = body['file'];
  
  if (!(file instanceof File)) return c.json({ error: 'Payload missing file entity' }, 400);
  if (file.size > 10 * 1024 * 1024) return c.json({ error: 'Object exceeds 10MB limit' }, 413);

  const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
  if (BLOCKED_CHAT_EXT.has(extension)) {
    return c.json({ error: 'Executable payloads strictly prohibited' }, 415);
  }

  const uniqueId = crypto.randomUUID();
  const objectKey = `chat/msg_${user.id}_${uniqueId}.${extension}`;
  
  const isImage = ALLOWED_AVATAR_EXT.has(extension) && ALLOWED_IMAGE_MIMES.has(file.type);
  
  // Mitigation against stored XSS and malicious downloads
  const contentDisposition = isImage ? 'inline' : `attachment; filename="${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}"`;

  await c.env.BUCKET.put(objectKey, file.stream(), {
    httpMetadata: { 
      contentType: file.type || 'application/octet-stream',
      cacheControl: CACHE_CONTROL_IMMUTABLE,
      contentDisposition
    },
    customMetadata: { uploadedBy: String(user.id), originalName: file.name }
  });

  return c.json({ 
    success: true, 
    fileUrl: `${CUSTOM_DOMAIN}/${objectKey}`, 
    fileName: file.name, 
    fileType: file.type,
    size: file.size
  });
});
