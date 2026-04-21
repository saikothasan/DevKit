import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq, count, and, sql } from 'drizzle-orm';
import { sign, verify } from 'hono/jwt';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { users, turnstileEvents } from '../db/schema';
import { hashPassword, verifyPassword } from '../utils/crypto';

export type AuthEnv = {
  Bindings: { 
    DB: D1Database; 
    JWT_SECRET: string; 
    RESEND_API_KEY?: string;
    GITHUB_CLIENT_ID?: string;
    GITHUB_CLIENT_SECRET?: string;
    TURNSTILE_SECRET_KEY?: string; // Add your Turnstile Secret Key to wrangler.toml / CF Dashboard
  };
  Variables: { user: { id: number; username: string; role: string; exp: number; }; };
};

export const authRouter = new Hono<AuthEnv>();

const getSecret = (c: any): string => c.env.JWT_SECRET || 'super-secure-dev-secret-123';

// ==========================================
// CLOUDFLARE TURNSTILE VALIDATION
// ==========================================
const validateTurnstile = async (token: string, secret: string, ip: string) => {
  const formData = new FormData();
  formData.append('secret', secret);
  formData.append('response', token);
  formData.append('remoteip', ip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData
  });
  return await res.json() as {
    success: boolean;
    challenge_ts?: string;
    hostname?: string;
    'error-codes'?: string[];
    action?: string;
    cdata?: string;
    metadata?: { ephemeral_id?: string };
    ephemeral_id?: string;
  };
};

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  turnstileToken: z.string().min(1, "Security verification required")
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  turnstileToken: z.string().min(1, "Security verification required")
});

authRouter.post('/register', zValidator('json', registerSchema), async (c) => {
  const db = drizzle(c.env.DB);
  const { username, email, password, turnstileToken } = c.req.valid('json');

  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '127.0.0.1';
  // Use dummy secret if not provided in env for local dev
  const secretKey = c.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';

  // 1. Validate Token with Cloudflare
  const validation = await validateTurnstile(turnstileToken, secretKey, ip);
  if (!validation.success) {
    return c.json({ error: 'Security verification failed or expired. Please refresh and try again.' }, 400);
  }

  // 2. Ephemeral ID Fraud Detection (Velocity Check)
  const ephemeralId = validation.metadata?.ephemeral_id || validation.ephemeral_id;
  if (ephemeralId) {
    // Block if more than 3 accounts created from this device fingerprint in the last hour
    const recentSignups = await db.select({ value: count() })
      .from(turnstileEvents)
      .where(
        and(
          eq(turnstileEvents.ephemeralId, ephemeralId),
          eq(turnstileEvents.eventType, 'signup'),
          sql`${turnstileEvents.createdAt} > (strftime('%s', 'now') - 3600)` // Last hour
        )
      ).get();

    if (recentSignups && recentSignups.value >= 3) {
      return c.json({ error: 'Suspicious activity detected. Please try again later.' }, 403);
    }
  }

  try {
    const existingEmail = await db.select().from(users).where(eq(users.email, email)).get();
    if (existingEmail) return c.json({ error: 'Email already registered' }, 400);
    
    const existingUsername = await db.select().from(users).where(eq(users.username, username)).get();
    if (existingUsername) return c.json({ error: 'Username already taken' }, 400);

    const passwordHash = await hashPassword(password);
    const verificationToken = crypto.randomUUID();
    
    const totalUsers = await db.select({ value: count() }).from(users).get();
    const isFirstUser = totalUsers?.value === 0;
    const assignedRole = isFirstUser ? 'admin' : 'user';
    
    // Automatically verify the first user (admin), otherwise require email verification
    const isVerified = isFirstUser;

    const newUser = await db.insert(users).values({ 
      username, 
      email, 
      passwordHash, 
      role: assignedRole,
      isVerified, 
      verificationToken: isVerified ? null : verificationToken
    }).returning();
    
    // 3. Log the successful signup event
    if (ephemeralId) {
      c.executionCtx.waitUntil(
        db.insert(turnstileEvents).values({
          ephemeralId,
          userId: newUser[0].id,
          eventType: 'signup',
          ipAddress: ip
        }).execute()
      );
    }

    if (!isVerified) {
      // Mock Resend trigger here
      console.log(`[Email Mock] Sent verification to ${email}: /verify-email?token=${verificationToken}`);
      return c.json({ requiresVerification: true, message: "Please check your email to verify your account." }, 201);
    }

    const payload = { id: newUser[0].id, username: newUser[0].username, role: newUser[0].role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 };
    const token = await sign(payload, getSecret(c), 'HS256');
    
    setCookie(c, 'auth_token', token, { httpOnly: true, secure: true, sameSite: 'Strict', path: '/' });
    return c.json({ id: newUser[0].id, username: newUser[0].username, role: newUser[0].role, points: newUser[0].points, isVerified: true }, 201);
  } catch (err: any) {
    return c.json({ error: 'Registration failed due to a system constraint.' }, 500);
  }
});

authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const db = drizzle(c.env.DB);
  const { email, password, turnstileToken } = c.req.valid('json');

  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '127.0.0.1';
  const secretKey = c.env.TURNSTILE_SECRET_KEY || '0x4AAAAAACZdr21BNxIZulZPOsw_M_1KLXo';

  // 1. Validate Token with Cloudflare
  const validation = await validateTurnstile(turnstileToken, secretKey, ip);
  if (!validation.success) {
    return c.json({ error: 'Security verification failed.' }, 400);
  }

  const ephemeralId = validation.metadata?.ephemeral_id || validation.ephemeral_id;

  const user = await db.select().from(users).where(eq(users.email, email)).get();
  if (!user) return c.json({ error: 'Invalid credentials' }, 401);
  
  if (!user.passwordHash) {
    return c.json({ error: 'Please login using GitHub (Social Login).' }, 401);
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  if (!user.isVerified) {
    return c.json({ error: 'Please verify your email address before logging in.' }, 403);
  }

  // 2. Log Ephemeral ID for the successful Login event
  if (ephemeralId) {
    c.executionCtx.waitUntil(
      db.insert(turnstileEvents).values({
        ephemeralId,
        userId: user.id,
        eventType: 'login',
        ipAddress: ip
      }).execute()
    );
  }

  const payload = { id: user.id, username: user.username, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 };
  const token = await sign(payload, getSecret(c), 'HS256');
  
  setCookie(c, 'auth_token', token, { httpOnly: true, secure: true, sameSite: 'Strict', path: '/' });
  return c.json({ id: user.id, username: user.username, role: user.role, points: user.points });
});

authRouter.post('/logout', async (c) => {
  deleteCookie(c, 'auth_token', { path: '/' });
  return c.json({ success: true });
});

authRouter.get('/me', async (c) => {
  const token = getCookie(c, 'auth_token');
  if (!token) return c.json({ user: null }, 401);

  try {
    const payload = await verify(token, getSecret(c), 'HS256');
    const db = drizzle(c.env.DB);
    const user = await db.select().from(users).where(eq(users.id, payload.id as number)).get();
    
    if (!user) {
      deleteCookie(c, 'auth_token', { path: '/' });
      return c.json({ user: null }, 401);
    }

    return c.json({ user: { id: user.id, username: user.username, role: user.role, points: user.points, avatarUrl: user.avatarUrl } });
  } catch (err) {
    deleteCookie(c, 'auth_token', { path: '/' });
    return c.json({ user: null }, 401);
  }
});
