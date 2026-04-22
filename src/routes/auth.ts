import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq, count, and, sql, desc } from 'drizzle-orm';
import { sign, verify } from 'hono/jwt';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { users, turnstileEvents, threads, replies } from '@/db/schema';
import { hashPassword, verifyPassword } from '@/utils/crypto';

export type AuthEnv = {
  Bindings: { 
    DB: D1Database; 
    JWT_SECRET: string; 
    RESEND_API_KEY?: string;
    RESEND_FROM_EMAIL?: string;
    GITHUB_CLIENT_ID?: string;
    GITHUB_CLIENT_SECRET?: string;
    TURNSTILE_SECRET_KEY?: string;
  };
  Variables: { user: { id: number; username: string; role: string; exp: number; }; };
};

export const authRouter = new Hono<AuthEnv>();

const getSecret = (c: any): string => c.env.JWT_SECRET || 'super-secure-dev-secret-123';

export const requireAuth = async (c: any, next: any) => {
  const token = getCookie(c, 'auth_token');
  if (!token) return c.json({ error: 'Unauthorized: Cryptographic token required.' }, 401);

  try {
    const payload = await verify(token, getSecret(c), 'HS256');
    c.set('user', payload);
    await next();
  } catch (err) {
    return c.json({ error: 'Unauthorized: Invalid or expired vector token.' }, 401);
  }
};

const validateTurnstile = async (token: string, secret: string, ip: string) => {
  const formData = new FormData();
  formData.append('secret', secret);
  formData.append('response', token);
  formData.append('remoteip', ip);

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData
    });
    return await res.json() as { success: boolean; ephemeral_id?: string; metadata?: { ephemeral_id?: string }; };
  } catch {
    return { success: false };
  }
};

const sendVerificationEmail = async (email: string, token: string, apiKey: string, fromEmail: string, origin: string) => {
  const verifyUrl = `${origin}/verify-email?token=${token}`;
  
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: fromEmail || 'Security Protocol <noreply@devkit.local>', 
      to: [email],
      subject: 'Architecture Hub - Identity Verification',
      html: `
        <div style="font-family: monospace; max-width: 600px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #e4e4e7; border: 1px solid #27272a; border-radius: 12px;">
          <h2 style="color: #fff; margin-bottom: 16px; font-weight: 800; border-bottom: 1px solid #27272a; padding-bottom: 12px;">Vector Initialization</h2>
          <p style="margin-bottom: 24px; color: #a1a1aa; line-height: 1.6;">A request to bind this address to the network was received. Acknowledge and finalize integration by executing the verification protocol below.</p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 14px 28px; background-color: #f97316; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Authenticate Address</a>
          <p style="margin-top: 32px; font-size: 11px; color: #52525b;">If this transmission is unexpected, disregard immediately. The vector will automatically self-terminate.</p>
        </div>
      `
    })
  });

  if (!res.ok) throw new Error('Verification transmission failed.');
};

// ==========================================
// Authentication Execution Vectors
// ==========================================

const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Alphanumeric and underscores strictly permitted"),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Cryptographic strength insufficient (requires uppercase, lowercase, numeric)"),
  turnstileToken: z.string().min(1)
});

authRouter.post('/register', zValidator('json', registerSchema), async (c) => {
  const db = drizzle(c.env.DB);
  const { username, email, password, turnstileToken } = c.req.valid('json');

  const ip = c.req.header('CF-Connecting-IP') || '127.0.0.1';
  const secretKey = c.env.TURNSTILE_SECRET_KEY || '1x00000000000000000000AA';

  const validation = await validateTurnstile(turnstileToken, secretKey, ip);
  if (!validation.success) return c.json({ error: 'Security anomaly detected.' }, 400);

  const ephemeralId = validation.metadata?.ephemeral_id || validation.ephemeral_id;

  try {
    const existingEmail = await db.select().from(users).where(eq(users.email, email)).get();
    if (existingEmail) return c.json({ error: 'Vector collision: Address registered' }, 409);
    
    const existingUsername = await db.select().from(users).where(eq(users.username, username)).get();
    if (existingUsername) return c.json({ error: 'Vector collision: Identifier assigned' }, 409);

    const passwordHash = await hashPassword(password);
    const verificationToken = crypto.randomUUID();
    
    const totalUsers = await db.select({ value: count() }).from(users).get();
    const isFirstUser = totalUsers?.value === 0;

    const newUser = await db.insert(users).values({ 
      username, email, passwordHash, 
      role: isFirstUser ? 'admin' : 'user',
      isVerified: isFirstUser, 
      verificationToken: isFirstUser ? null : verificationToken
    }).returning();
    
    if (ephemeralId) {
      c.executionCtx.waitUntil(db.insert(turnstileEvents).values({ ephemeralId, userId: newUser[0].id, eventType: 'signup', ipAddress: ip }).execute());
    }

    if (!isFirstUser) {
      if (c.env.RESEND_API_KEY) {
        c.executionCtx.waitUntil(sendVerificationEmail(email, verificationToken, c.env.RESEND_API_KEY, c.env.RESEND_FROM_EMAIL || '', new URL(c.req.url).origin));
      }
      return c.json({ requiresVerification: true, message: "Verification dispatch deployed to target address." }, 201);
    }

    const payload = { id: newUser[0].id, username: newUser[0].username, role: newUser[0].role, exp: Math.floor(Date.now() / 1000) + 604800 };
    const token = await sign(payload, getSecret(c), 'HS256');
    
    setCookie(c, 'auth_token', token, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 604800 });
    return c.json({ id: newUser[0].id, username: newUser[0].username, role: newUser[0].role, isVerified: true }, 201);
  } catch (err) {
    return c.json({ error: 'Internal pipeline failure.' }, 500);
  }
});

authRouter.post('/login', zValidator('json', z.object({
  email: z.string().email(),
  password: z.string(),
  turnstileToken: z.string().min(1)
})), async (c) => {
  const db = drizzle(c.env.DB);
  const { email, password, turnstileToken } = c.req.valid('json');

  const ip = c.req.header('CF-Connecting-IP') || '127.0.0.1';
  const validation = await validateTurnstile(turnstileToken, c.env.TURNSTILE_SECRET_KEY || '1x00000000000000000000AA', ip);
  if (!validation.success) return c.json({ error: 'Security anomaly detected.' }, 400);

  const user = await db.select().from(users).where(eq(users.email, email)).get();
  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return c.json({ error: 'Invalid cryptographic parameters.' }, 401);
  }

  if (!user.isVerified) return c.json({ error: 'Node locked. Verification phase pending.' }, 403);

  const ephemeralId = validation.metadata?.ephemeral_id || validation.ephemeral_id;
  if (ephemeralId) c.executionCtx.waitUntil(db.insert(turnstileEvents).values({ ephemeralId, userId: user.id, eventType: 'login', ipAddress: ip }).execute());

  const payload = { id: user.id, username: user.username, role: user.role, exp: Math.floor(Date.now() / 1000) + 604800 };
  const token = await sign(payload, getSecret(c), 'HS256');
  
  setCookie(c, 'auth_token', token, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 604800 });
  return c.json({ id: user.id, username: user.username, role: user.role, points: user.points, isVip: user.isVip });
});

authRouter.post('/verify-email', zValidator('json', z.object({ token: z.string() })), async (c) => {
  const db = drizzle(c.env.DB);
  const { token } = c.req.valid('json');

  const user = await db.select().from(users).where(eq(users.verificationToken, token)).get();
  if (!user) return c.json({ error: 'Invalid or expired vector token.' }, 400);

  await db.update(users).set({ isVerified: true, verificationToken: null }).where(eq(users.id, user.id));

  const payload = { id: user.id, username: user.username, role: user.role, exp: Math.floor(Date.now() / 1000) + 604800 };
  const jwt = await sign(payload, getSecret(c), 'HS256');
  
  setCookie(c, 'auth_token', jwt, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 604800 });
  return c.json({ success: true });
});

authRouter.post('/logout', async (c) => {
  deleteCookie(c, 'auth_token', { path: '/', secure: true, sameSite: 'Lax' });
  return c.json({ success: true });
});

// ==========================================
// Identity Retrieval Vectors
// ==========================================

authRouter.get('/me', async (c) => {
  const token = getCookie(c, 'auth_token');
  if (!token) return c.json({ user: null }, 401);

  try {
    const payload = await verify(token, getSecret(c), 'HS256');
    const db = drizzle(c.env.DB);
    const user = await db.select().from(users).where(eq(users.id, payload.id as number)).get();
    
    if (!user) throw new Error('Identity missing');
    return c.json({ user: { id: user.id, username: user.username, role: user.role, points: user.points, avatarUrl: user.avatarUrl, isVerified: user.isVerified, isVip: user.isVip, vipSince: user.vipSince } });
  } catch {
    deleteCookie(c, 'auth_token', { path: '/', secure: true, sameSite: 'Lax' });
    return c.json({ user: null }, 401);
  }
});

authRouter.get('/profile/:username', async (c) => {
  const db = drizzle(c.env.DB);
  const targetUsername = c.req.param('username');

  try {
    const targetUser = await db.select({ 
      id: users.id, username: users.username, role: users.role, points: users.points, 
      avatarUrl: users.avatarUrl, createdAt: users.createdAt, isVip: users.isVip, vipSince: users.vipSince 
    }).from(users).where(eq(users.username, targetUsername)).get();

    if (!targetUser) return c.json({ error: 'Target node untraceable in the ledger.' }, 404);

    const [threadCount, replyCount] = await Promise.all([
      db.select({ value: count() }).from(threads).where(eq(threads.authorId, targetUser.id)).get(),
      db.select({ value: count() }).from(replies).where(eq(replies.authorId, targetUser.id)).get()
    ]);

    const recentThreads = await db.select({ 
      id: threads.id, title: threads.title, category: threads.category, upvotes: threads.upvotes, createdAt: threads.createdAt 
    })
    .from(threads).where(eq(threads.authorId, targetUser.id)).orderBy(desc(threads.createdAt)).limit(5).execute();

    return c.json({ 
      user: targetUser, 
      stats: { threads: threadCount?.value || 0, replies: replyCount?.value || 0 }, 
      recentThreads 
    });
  } catch (err) {
    return c.json({ error: 'Profile aggregation fault.' }, 500);
  }
});
