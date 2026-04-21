import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, or, and, desc, not } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { users, conversations, messages } from '../db/schema';
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
  
  // Security Layer: Verify the user is a participant in this conversation
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

// 5. WebSocket Upgrade Pipeline routing to Durable Object
chatRouter.get('/ws', requireAuth, async (c) => {
  const conversationId = c.req.query('conversationId');
  if (!conversationId) return c.text('Missing routing constraint', 400);

  const db = drizzle(c.env.DB);
  const user = c.get('user');
  
  // Security Layer: Stop unauthorized WebSocket upgrades
  const conv = await db.select().from(conversations).where(eq(conversations.id, parseInt(conversationId))).get();
  if (!conv || (conv.user1Id !== user.id && conv.user2Id !== user.id)) {
    return new Response('Unauthorized Web Socket Access', { status: 403 });
  }

  // Bind and delegate Request to Durable Object using the conversationId as the isolated namespace
  const id = c.env.LiveSession.idFromName(conversationId);
  const stub = c.env.LiveSession.get(id);
  
  return stub.fetch(c.req.raw);
});
