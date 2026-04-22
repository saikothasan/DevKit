import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq, count, and, sql } from 'drizzle-orm';
import { sign, verify } from 'hono/jwt';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { users, turnstileEvents } from '@/db/schema';
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
  if (!token) return c.json({ error: 'Unauthorized: Authentication required.' }, 401);

  try {
    const payload = await verify(token, getSecret(c), 'HS256');
    c.set('user', payload);
    await next();
  } catch (err) {
    return c.json({ error: 'Unauthorized: Invalid or expired token.' }, 401);
  }
};

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
    ephemeral_id?: string;
    metadata?: { ephemeral_id?: string };
  };
};

const sendVerificationEmail = async (email: string, token: string, apiKey: string, fromEmail: string, origin: string) => {
  const verifyUrl = `${origin}/verify-email?token=${token}`;
  
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail || 'Security <noreply@devkit.local>', 
      to: [email],
      subject: 'DevKit Ecosystem - Verify Identification',
      html: `
        <div style="font-family: monospace; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #e4e4e7; border: 1px solid #27272a; border-radius: 8px;">
          <h2 style="color: #fff; margin-bottom: 16px;">Vector Initialization: Verification Required</h2>
          <p style="margin-bottom: 24px; color: #a1a1aa; line-height: 1.5;">A request to attach this address to the DevKit network was received. Acknowledge and finalize integration by executing the verification protocol below.</p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #f97316; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Verify Address</a>
          <p style="margin-top: 32px; font-size: 11px; color: #52525b; border-top: 1px solid #27272a; pt: 16px;">If this transmission is unexpected, disregard immediately. The vector will self-terminate.</p>
        </div>
      `
    })
  });

  if (!res.ok) throw new Error('Failed to dispatch verification transmission.');
};

const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Only alphanumeric and underscores allowed"),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Must contain uppercase, lowercase, and numeric characters"),
  turnstileToken: z.string().min(1)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  turnstileToken: z.string().min(1)
});

authRouter.post('/register', zValidator('json', registerSchema), async (c) => {
  const db = drizzle(c.env.DB);
  const { username, email, password, turnstileToken } = c.req.valid('json');

  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '127.0.0.1';
  const secretKey = c.env.TURNSTILE_SECRET_KEY || '0x4AAAAAACZdr21BNxIZulZPOsw_M_1KLXo';

  const validation = await validateTurnstile(turnstileToken, secretKey, ip);
  if (!validation.success) return c.json({ error: 'Security challenge failed.' }, 400);

  const ephemeralId = validation.metadata?.ephemeral_id || validation.ephemeral_id;
  if (ephemeralId) {
    const recentSignups = await db.select({ value: count() }).from(turnstileEvents)
      .where(and(eq(turnstileEvents.ephemeralId, ephemeralId), eq(turnstileEvents.eventType, 'signup'), sql`${turnstileEvents.createdAt} > (strftime('%s', 'now') - 3600)`)).get();
    if (recentSignups && recentSignups.value >= 3) return c.json({ error: 'Rate limit exceeded for this node.' }, 429);
  }

  try {
    const existingEmail = await db.select().from(users).where(eq(users.email, email)).get();
    if (existingEmail) return c.json({ error: 'Vector collision: Email registered' }, 409);
    
    const existingUsername = await db.select().from(users).where(eq(users.username, username)).get();
    if (existingUsername) return c.json({ error: 'Vector collision: Username taken' }, 409);

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
      return c.json({ requiresVerification: true, message: "Verification dispatch deployed. Review your inbox." }, 201);
    }

    const payload = { id: newUser[0].id, username: newUser[0].username, role: newUser[0].role, exp: Math.floor(Date.now() / 1000) + 604800 };
    const token = await sign(payload, getSecret(c), 'HS256');
    
    setCookie(c, 'auth_token', token, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 604800 });
    return c.json({ id: newUser[0].id, username: newUser[0].username, role: newUser[0].role, isVerified: true }, 201);
  } catch (err) {
    return c.json({ error: 'Internal pipeline failure.' }, 500);
  }
});

authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const db = drizzle(c.env.DB);
  const { email, password, turnstileToken } = c.req.valid('json');

  const ip = c.req.header('CF-Connecting-IP') || '127.0.0.1';
  const validation = await validateTurnstile(turnstileToken, c.env.TURNSTILE_SECRET_KEY || '0x4AAAAAACZdr21BNxIZulZPOsw_M_1KLXo', ip);
  if (!validation.success) return c.json({ error: 'Security challenge failed.' }, 400);

  const user = await db.select().from(users).where(eq(users.email, email)).get();
  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return c.json({ error: 'Invalid credentials or OAuth account.' }, 401);
  }

  if (!user.isVerified) return c.json({ error: 'Vector locked. Verify email first.' }, 403);

  const ephemeralId = validation.metadata?.ephemeral_id || validation.ephemeral_id;
  if (ephemeralId) c.executionCtx.waitUntil(db.insert(turnstileEvents).values({ ephemeralId, userId: user.id, eventType: 'login', ipAddress: ip }).execute());

  const payload = { id: user.id, username: user.username, role: user.role, exp: Math.floor(Date.now() / 1000) + 604800 };
  const token = await sign(payload, getSecret(c), 'HS256');
  
  setCookie(c, 'auth_token', token, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 604800 });
  return c.json({ id: user.id, username: user.username, role: user.role, points: user.points });
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

authRouter.get('/github', async (c) => {
  const clientId = c.env.GITHUB_CLIENT_ID;
  if (!clientId) return c.json({ error: 'OAuth unavailable' }, 500);
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(`${new URL(c.req.url).origin}/api/auth/github/callback`)}&scope=read:user user:email`;
  return c.redirect(url);
});

authRouter.get('/github/callback', async (c) => {
  const code = c.req.query('code');
  if (!code) return c.redirect('/login?error=Authorization+failed');

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: c.env.GITHUB_CLIENT_ID, client_secret: c.env.GITHUB_CLIENT_SECRET, code }),
    });

    const tokenData = await tokenRes.json() as any;
    if (tokenData.error) throw new Error(tokenData.error_description);

    const headers = { 'Authorization': `Bearer ${tokenData.access_token}`, 'User-Agent': 'DevKit-Worker-Edge' };
    const [userRes, emailRes] = await Promise.all([
      fetch('https://api.github.com/user', { headers }),
      fetch('https://api.github.com/user/emails', { headers })
    ]);
    
    const githubUser = await userRes.json() as any;
    const emails = await emailRes.json() as any[];
    
    const primaryEmail = emails.find(e => e.primary && e.verified) || emails.find(e => e.verified) || emails[0];
    if (!primaryEmail || !primaryEmail.email) throw new Error('Verified email required.');

    const db = drizzle(c.env.DB);
    let user = await db.select().from(users).where(eq(users.githubId, githubUser.id.toString())).get();

    if (!user) {
      user = await db.select().from(users).where(eq(users.email, primaryEmail.email)).get();
      if (user) {
        await db.update(users).set({ githubId: githubUser.id.toString(), isVerified: true }).where(eq(users.id, user.id));
      } else {
        const isFirstUser = (await db.select({ value: count() }).from(users).get())?.value === 0;
        let username = githubUser.login;
        if (await db.select().from(users).where(eq(users.username, username)).get()) username = `${username}_${Math.floor(Math.random() * 1000)}`;

        const newUser = await db.insert(users).values({
          username, email: primaryEmail.email, githubId: githubUser.id.toString(), avatarUrl: githubUser.avatar_url, role: isFirstUser ? 'admin' : 'user', isVerified: true 
        }).returning();
        user = newUser[0];
      }
    }

    const payload = { id: user.id, username: user.username, role: user.role, exp: Math.floor(Date.now() / 1000) + 604800 };
    const token = await sign(payload, getSecret(c), 'HS256');
    setCookie(c, 'auth_token', token, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 604800 });
    
    return c.redirect('/');
  } catch (err: any) {
    return c.redirect(`/login?error=${encodeURIComponent(err.message || 'OAuth failure')}`);
  }
});

authRouter.post('/logout', async (c) => {
  deleteCookie(c, 'auth_token', { path: '/', secure: true, sameSite: 'Lax' });
  return c.json({ success: true });
});

authRouter.get('/me', async (c) => {
  const token = getCookie(c, 'auth_token');
  if (!token) return c.json({ user: null }, 401);

  try {
    const payload = await verify(token, getSecret(c), 'HS256');
    const db = drizzle(c.env.DB);
    const user = await db.select().from(users).where(eq(users.id, payload.id as number)).get();
    
    if (!user) throw new Error('User not found');
    return c.json({ user: { id: user.id, username: user.username, role: user.role, points: user.points, avatarUrl: user.avatarUrl, isVerified: user.isVerified } });
  } catch {
    deleteCookie(c, 'auth_token', { path: '/', secure: true, sameSite: 'Lax' });
    return c.json({ user: null }, 401);
  }
});
