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
    GITHUB_CLIENT_ID?: string;
    GITHUB_CLIENT_SECRET?: string;
    TURNSTILE_SECRET_KEY?: string;
  };
  Variables: { user: { id: number; username: string; role: string; exp: number; }; };
};

export const authRouter = new Hono<AuthEnv>();

const getSecret = (c: any): string => c.env.JWT_SECRET || 'super-secure-dev-secret-123';

// ==========================================
// EXPORTED AUTH MIDDLEWARE
// ==========================================
export const requireAuth = async (c: any, next: any) => {
  const token = getCookie(c, 'auth_token');
  if (!token) {
    return c.json({ error: 'Unauthorized: Authentication required.' }, 401);
  }

  try {
    const payload = await verify(token, getSecret(c), 'HS256');
    c.set('user', payload);
    await next();
  } catch (err) {
    return c.json({ error: 'Unauthorized: Invalid or expired token.' }, 401);
  }
};

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

// ==========================================
// RESEND TRANSACTIONAL EMAIL
// ==========================================
const sendVerificationEmail = async (email: string, token: string, apiKey: string, origin: string) => {
  const verifyUrl = `${origin}/verify-email?token=${token}`;
  
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Security <noreply@devkit.local>', // Replace with verified sending domain in production
      to: [email],
      subject: 'Complete your DevKit Registration',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify your email address</h2>
          <p>Thank you for registering. Please confirm your email address by clicking the link below:</p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">Verify Email</a>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">If you did not request this, please ignore this email.</p>
        </div>
      `
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('[Resend API Error]', errorText);
    throw new Error('Failed to dispatch verification email.');
  }
};

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30).regex(/^[a-zA-Z0-9_]+$/, "Only alphanumeric and underscores allowed"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and a number"),
  turnstileToken: z.string().min(1, "Security verification required")
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  turnstileToken: z.string().min(1, "Security verification required")
});

// ==========================================
// EMAIL / PASSWORD AUTHENTICATION
// ==========================================

authRouter.post('/register', zValidator('json', registerSchema), async (c) => {
  const db = drizzle(c.env.DB);
  const { username, email, password, turnstileToken } = c.req.valid('json');

  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '127.0.0.1';
  const secretKey = c.env.TURNSTILE_SECRET_KEY || '0x4AAAAAACZdr21BNxIZulZPOsw_M_1KLXo';

  const validation = await validateTurnstile(turnstileToken, secretKey, ip);
  if (!validation.success) {
    return c.json({ error: 'Security verification failed or expired. Please refresh and try again.' }, 400);
  }

  const ephemeralId = validation.metadata?.ephemeral_id || validation.ephemeral_id;
  if (ephemeralId) {
    const recentSignups = await db.select({ value: count() })
      .from(turnstileEvents)
      .where(
        and(
          eq(turnstileEvents.ephemeralId, ephemeralId),
          eq(turnstileEvents.eventType, 'signup'),
          sql`${turnstileEvents.createdAt} > (strftime('%s', 'now') - 3600)`
        )
      ).get();

    if (recentSignups && recentSignups.value >= 3) {
      return c.json({ error: 'Suspicious activity detected from this device. Please try again later.' }, 429);
    }
  }

  try {
    const existingEmail = await db.select().from(users).where(eq(users.email, email)).get();
    if (existingEmail) return c.json({ error: 'Email already registered' }, 409);
    
    const existingUsername = await db.select().from(users).where(eq(users.username, username)).get();
    if (existingUsername) return c.json({ error: 'Username already taken' }, 409);

    const passwordHash = await hashPassword(password);
    const verificationToken = crypto.randomUUID();
    
    const totalUsers = await db.select({ value: count() }).from(users).get();
    const isFirstUser = totalUsers?.value === 0;
    const assignedRole = isFirstUser ? 'admin' : 'user';
    const isVerified = isFirstUser; 

    const newUser = await db.insert(users).values({ 
      username, 
      email, 
      passwordHash, 
      role: assignedRole,
      isVerified, 
      verificationToken: isVerified ? null : verificationToken
    }).returning();
    
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
      if (c.env.RESEND_API_KEY) {
        const origin = new URL(c.req.url).origin;
        c.executionCtx.waitUntil(
          sendVerificationEmail(email, verificationToken, c.env.RESEND_API_KEY, origin)
        );
      } else {
        console.warn(`[Dev Warning] RESEND_API_KEY missing. Verification link: /verify-email?token=${verificationToken}`);
      }
      return c.json({ requiresVerification: true, message: "Please check your email to verify your account." }, 201);
    }

    const payload = { id: newUser[0].id, username: newUser[0].username, role: newUser[0].role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 };
    const token = await sign(payload, getSecret(c), 'HS256');
    
    setCookie(c, 'auth_token', token, { httpOnly: true, secure: true, sameSite: 'Strict', path: '/', maxAge: 604800 });
    return c.json({ id: newUser[0].id, username: newUser[0].username, role: newUser[0].role, points: newUser[0].points, isVerified: true }, 201);
  } catch (err: any) {
    console.error('[Registration Error]', err);
    return c.json({ error: 'Registration failed due to a system constraint.' }, 500);
  }
});

authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const db = drizzle(c.env.DB);
  const { email, password, turnstileToken } = c.req.valid('json');

  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '127.0.0.1';
  const secretKey = c.env.TURNSTILE_SECRET_KEY || '0x4AAAAAACZdr21BNxIZulZPOsw_M_1KLXo';

  const validation = await validateTurnstile(turnstileToken, secretKey, ip);
  if (!validation.success) {
    return c.json({ error: 'Security verification failed.' }, 400);
  }

  const ephemeralId = validation.metadata?.ephemeral_id || validation.ephemeral_id;

  const user = await db.select().from(users).where(eq(users.email, email)).get();
  if (!user) return c.json({ error: 'Invalid credentials' }, 401);
  
  if (!user.passwordHash) {
    return c.json({ error: 'Account linked via OAuth. Please login using GitHub.' }, 401);
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  if (!user.isVerified) {
    return c.json({ error: 'Please verify your email address before logging in.' }, 403);
  }

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
  
  setCookie(c, 'auth_token', token, { httpOnly: true, secure: true, sameSite: 'Strict', path: '/', maxAge: 604800 });
  return c.json({ id: user.id, username: user.username, role: user.role, points: user.points });
});

authRouter.post('/verify-email', zValidator('json', z.object({ token: z.string() })), async (c) => {
  const db = drizzle(c.env.DB);
  const { token } = c.req.valid('json');

  const user = await db.select().from(users).where(eq(users.verificationToken, token)).get();
  if (!user) return c.json({ error: 'Invalid or expired verification token' }, 400);

  await db.update(users)
    .set({ isVerified: true, verificationToken: null })
    .where(eq(users.id, user.id));

  const payload = { id: user.id, username: user.username, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 };
  const jwt = await sign(payload, getSecret(c), 'HS256');
  
  setCookie(c, 'auth_token', jwt, { httpOnly: true, secure: true, sameSite: 'Strict', path: '/', maxAge: 604800 });
  return c.json({ success: true });
});

// ==========================================
// GITHUB OAUTH
// ==========================================

authRouter.get('/github', async (c) => {
  const clientId = c.env.GITHUB_CLIENT_ID;
  if (!clientId) return c.json({ error: 'GitHub OAuth not configured' }, 500);

  const redirectUri = `${new URL(c.req.url).origin}/api/auth/github/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user user:email`;
  
  return c.redirect(url);
});

authRouter.get('/github/callback', async (c) => {
  const code = c.req.query('code');
  if (!code) return c.redirect('/login?error=Authorization+failed');

  const clientId = c.env.GITHUB_CLIENT_ID;
  const clientSecret = c.env.GITHUB_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) return c.redirect('/login?error=OAuth+not+configured');

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenRes.json() as any;
    if (tokenData.error) throw new Error(tokenData.error_description);

    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'DevKit-Worker-Edge'
      }
    });
    
    const githubUser = await userRes.json() as any;

    let email = githubUser.email;
    if (!email) {
      const emailRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'User-Agent': 'DevKit-Worker-Edge'
        }
      });
      const emails = await emailRes.json() as any[];
      const primaryEmail = emails.find(e => e.primary) || emails[0];
      if (primaryEmail) email = primaryEmail.email;
    }

    if (!email) throw new Error('No public email associated with this GitHub account');

    const db = drizzle(c.env.DB);
    let user = await db.select().from(users).where(eq(users.githubId, githubUser.id.toString())).get();

    if (!user) {
      user = await db.select().from(users).where(eq(users.email, email)).get();
      if (user) {
        await db.update(users).set({ githubId: githubUser.id.toString(), isVerified: true }).where(eq(users.id, user.id));
      } else {
        const totalUsers = await db.select({ value: count() }).from(users).get();
        const isFirstUser = totalUsers?.value === 0;
        
        let username = githubUser.login;
        const existingUsername = await db.select().from(users).where(eq(users.username, username)).get();
        if (existingUsername) username = `${username}_${Math.floor(Math.random() * 1000)}`;

        const newUser = await db.insert(users).values({
          username,
          email,
          githubId: githubUser.id.toString(),
          avatarUrl: githubUser.avatar_url,
          role: isFirstUser ? 'admin' : 'user',
          isVerified: true 
        }).returning();
        user = newUser[0];
      }
    }

    const payload = { id: user.id, username: user.username, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 };
    const token = await sign(payload, getSecret(c), 'HS256');
    
    setCookie(c, 'auth_token', token, { httpOnly: true, secure: true, sameSite: 'Strict', path: '/', maxAge: 604800 });
    
    return c.redirect('/');
  } catch (err: any) {
    console.error('[GitHub OAuth Error]', err);
    return c.redirect(`/login?error=${encodeURIComponent(err.message || 'Authentication failed')}`);
  }
});

// ==========================================
// SESSION MANAGEMENT
// ==========================================

authRouter.post('/logout', async (c) => {
  deleteCookie(c, 'auth_token', { path: '/', secure: true, sameSite: 'Strict' });
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
      deleteCookie(c, 'auth_token', { path: '/', secure: true, sameSite: 'Strict' });
      return c.json({ user: null }, 401);
    }

    return c.json({ user: { id: user.id, username: user.username, role: user.role, points: user.points, avatarUrl: user.avatarUrl } });
  } catch (err) {
    deleteCookie(c, 'auth_token', { path: '/', secure: true, sameSite: 'Strict' });
    return c.json({ user: null }, 401);
  }
});
