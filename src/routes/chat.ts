import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, or, and, desc, asc, not, like, sql } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { users, conversations, messages } from '@/db/schema';
import { requireAuth } from './auth';

export const chatRouter = new Hono<{ Bindings: { DB: D1Database }, Variables: { user: any } }>();

chatRouter.get('/conversations', requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');

  const userConvos = await db.select()
    .from(conversations)
    .where(or(eq(conversations.user1Id, user.id), eq(conversations.user2Id, user.id)))
    .orderBy(desc(conversations.lastMessageAt));

  const enriched = await Promise.all(userConvos.map(async (conv) => {
    const targetId = conv.user1Id === user.id ? conv.user2Id : conv.user1Id;
    const targetUser = await db.select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, targetId)).get();
    return { ...conv, targetUser };
  }));

  return c.json(enriched);
});

chatRouter.post('/conversations', requireAuth, zValidator('json', z.object({ targetUserId: z.number() })), async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');
  const { targetUserId } = c.req.valid('json');

  if (user.id === targetUserId) return c.json({ error: 'Loopback connections disabled' }, 400);

  let conv = await db.select().from(conversations).where(
    or(
      and(eq(conversations.user1Id, user.id), eq(conversations.user2Id, targetUserId)),
      and(eq(conversations.user1Id, targetUserId), eq(conversations.user2Id, user.id))
    )
  ).get();

  if (!conv) {
    const inserted = await db.insert(conversations).values({ user1Id: user.id, user2Id: targetUserId }).returning();
    conv = inserted[0];
  }

  const targetUser = await db.select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, targetUserId)).get();
  return c.json({ ...conv, targetUser });
});

chatRouter.get('/messages/:id', requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');
  const conversationId = parseInt(c.req.param('id'));
  
  // Performance: Pagination to prevent edge timeout
  const limit = Math.min(100, parseInt(c.req.query('limit') || '50'));
  const offset = parseInt(c.req.query('offset') || '0');
  
  const conv = await db.select().from(conversations).where(eq(conversations.id, conversationId)).get();
  if (!conv || (conv.user1Id !== user.id && conv.user2Id !== user.id)) {
    return c.json({ error: 'Unauthorized Access' }, 403);
  }

  // Fetch descending for pagination, then reverse for UI
  const history = await db.select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .offset(offset);
    
  return c.json(history.reverse());
});

chatRouter.get('/directory', requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');
  const q = c.req.query('q');
  
  let conditions = not(eq(users.id, user.id));
  if (q && q.trim().length > 0) {
    conditions = and(conditions, like(users.username, `%${q.trim()}%`));
  }

  const directory = await db.select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl })
    .from(users)
    .where(conditions)
    .limit(50); // Hard limit to prevent scraping
    
  return c.json(directory);
});

chatRouter.post('/messages/:id', requireAuth, zValidator('json', z.object({
  content: z.string().optional(), fileUrl: z.string().nullable().optional(), fileName: z.string().nullable().optional(), fileType: z.string().nullable().optional()
})), async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');
  const conversationId = parseInt(c.req.param('id'));
  const payload = c.req.valid('json');

  if (!payload.content && !payload.fileUrl) return c.json({ error: 'Empty payload' }, 400);

  const conv = await db.select().from(conversations).where(eq(conversations.id, conversationId)).get();
  if (!conv || (conv.user1Id !== user.id && conv.user2Id !== user.id)) return c.json({ error: 'Unauthorized Access' }, 403);

  try {
    const inserted = await db.insert(messages).values({
      conversationId, senderId: user.id, content: payload.content || '', fileUrl: payload.fileUrl || null, fileName: payload.fileName || null, fileType: payload.fileType || null
    }).returning();

    c.executionCtx.waitUntil(
      db.update(conversations).set({ lastMessageAt: sql`(strftime('%s', 'now'))` }).where(eq(conversations.id, conversationId)).execute()
    );

    return c.json(inserted[0]);
  } catch (err) {
    return c.json({ error: 'Transmission execution failed' }, 500);
  }
});
