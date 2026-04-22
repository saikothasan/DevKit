import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, or, and, desc, not, sql } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { users, conversations, messages } from '@/db/schema';
import { requireAuth } from './auth';

export const chatRouter = new Hono<{ Bindings: any, Variables: any }>();

// 1. Fetch all active conversations for the authenticated user
chatRouter.get('/conversations', requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');

  const userConvos = await db.select()
    .from(conversations)
    .where(or(eq(conversations.user1Id, user.id), eq(conversations.user2Id, user.id)))
    .orderBy(desc(conversations.lastMessageAt));

  const enriched = await Promise.all(userConvos.map(async (conv) => {
    const targetId = conv.user1Id === user.id ? conv.user2Id : conv.user1Id;
    const targetUser = await db.select({ id: users.id, username: users.username }).from(users).where(eq(users.id, targetId)).get();
    return { ...conv, targetUser };
  }));

  return c.json(enriched);
});

// 2. Initialize or retrieve a specific conversation session
chatRouter.post('/conversations', requireAuth, zValidator('json', z.object({ targetUserId: z.number() })), async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');
  const { targetUserId } = c.req.valid('json');

  if (user.id === targetUserId) return c.json({ error: 'Cannot start conversation with yourself' }, 400);

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

  const targetUser = await db.select({ id: users.id, username: users.username }).from(users).where(eq(users.id, targetUserId)).get();
  return c.json({ ...conv, targetUser });
});

// 3. Fetch historical message vectors
chatRouter.get('/messages/:id', requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');
  const conversationId = parseInt(c.req.param('id'));
  
  const conv = await db.select().from(conversations).where(eq(conversations.id, conversationId)).get();
  if (!conv || (conv.user1Id !== user.id && conv.user2Id !== user.id)) {
    return c.json({ error: 'Unauthorized Access' }, 403);
  }

  const history = await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  return c.json(history);
});

// 4. Directory of available peers to start chats
chatRouter.get('/directory', requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');
  const directory = await db.select({ id: users.id, username: users.username }).from(users).where(not(eq(users.id, user.id))).limit(100);
  return c.json(directory);
});

// 5. REST Pipeline for Transmission (Replaces DO WebSocket)
const sendMessageSchema = z.object({
  content: z.string().optional(),
  fileUrl: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
  fileType: z.string().nullable().optional()
});

chatRouter.post('/messages/:id', requireAuth, zValidator('json', sendMessageSchema), async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');
  const conversationId = parseInt(c.req.param('id'));
  const payload = c.req.valid('json');

  const conv = await db.select().from(conversations).where(eq(conversations.id, conversationId)).get();
  if (!conv || (conv.user1Id !== user.id && conv.user2Id !== user.id)) {
    return c.json({ error: 'Unauthorized Access' }, 403);
  }

  try {
    const inserted = await db.insert(messages).values({
      conversationId,
      senderId: user.id,
      content: payload.content || '',
      fileUrl: payload.fileUrl || null,
      fileName: payload.fileName || null,
      fileType: payload.fileType || null
    }).returning();

    c.executionCtx.waitUntil(
      db.update(conversations)
        .set({ lastMessageAt: sql`(strftime('%s', 'now'))` })
        .where(eq(conversations.id, conversationId))
        .execute()
    );

    return c.json(inserted[0]);
  } catch (err) {
    return c.json({ error: 'Transmission execution failed' }, 500);
  }
});
