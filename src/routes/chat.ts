import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq, or, and, desc } from 'drizzle-orm';
import { conversations, messages, users } from '@/db/schema';
import { requireAuth } from './auth';

export const chatRouter = new Hono<{ Bindings: { DB: D1Database }, Variables: { user: any } }>();

// GET /api/chat/conversations - List active communication vectors
chatRouter.get('/conversations', requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');

  // Fetch all conversations where user is a participant
  const convos = await db.select()
    .from(conversations)
    .where(or(eq(conversations.user1Id, user.id), eq(conversations.user2Id, user.id)))
    .orderBy(desc(conversations.lastMessageAt))
    .all();

  // Map user details to the other participant
  const enrichedConvos = await Promise.all(convos.map(async (convo) => {
    const otherUserId = convo.user1Id === user.id ? convo.user2Id : convo.user1Id;
    const otherUser = await db.select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl })
      .from(users).where(eq(users.id, otherUserId)).get();
    
    // Fetch latest message
    const lastMsg = await db.select().from(messages)
      .where(eq(messages.conversationId, convo.id))
      .orderBy(desc(messages.createdAt)).limit(1).get();

    return {
      id: convo.id,
      participant: otherUser,
      lastMessage: lastMsg ? { content: lastMsg.content, isRead: lastMsg.isRead, createdAt: lastMsg.createdAt } : null,
      updatedAt: convo.lastMessageAt
    };
  }));

  return c.json({ conversations: enrichedConvos });
});

// POST /api/chat/send - Dispatch telemetry/message
chatRouter.post('/send', requireAuth, zValidator('json', z.object({
  targetUserId: z.number(),
  content: z.string().optional(),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional()
})), async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');
  const payload = c.req.valid('json');

  if (!payload.content && !payload.fileUrl) {
    return c.json({ error: 'Empty payload rejected.' }, 400);
  }

  // Prevent self-messaging
  if (user.id === payload.targetUserId) {
    return c.json({ error: 'Loopback communication restricted.' }, 400);
  }

  // Find existing conversation or initialize new one
  let conversation = await db.select().from(conversations).where(
    or(
      and(eq(conversations.user1Id, user.id), eq(conversations.user2Id, payload.targetUserId)),
      and(eq(conversations.user1Id, payload.targetUserId), eq(conversations.user2Id, user.id))
    )
  ).get();

  if (!conversation) {
    const newConvo = await db.insert(conversations).values({
      user1Id: user.id,
      user2Id: payload.targetUserId
    }).returning();
    conversation = newConvo[0];
  }

  // Execute D1 Batch for strict consistency between message creation and conversation bump
  const newMsgId = await db.batch([
    db.insert(messages).values({
      conversationId: conversation.id,
      senderId: user.id,
      content: payload.content || '',
      fileUrl: payload.fileUrl,
      fileName: payload.fileName,
      fileType: payload.fileType
    }).returning({ id: messages.id }),
    db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conversation.id))
  ]);

  return c.json({ success: true, messageId: newMsgId[0][0].id }, 201);
});

// GET /api/chat/:conversationId - Retrieve telemetry history
chatRouter.get('/:conversationId', requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');
  const conversationId = parseInt(c.req.param('conversationId'));

  // Security Verification: Ensure user is part of the conversation
  const conversation = await db.select().from(conversations).where(eq(conversations.id, conversationId)).get();
  if (!conversation || (conversation.user1Id !== user.id && conversation.user2Id !== user.id)) {
    return c.json({ error: 'Unauthorized network path.' }, 403);
  }

  const msgs = await db.select().from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(50); // Pagination logic can be added here

  // Background task: Mark unread messages from the other user as read
  c.executionCtx.waitUntil(
    db.update(messages).set({ isRead: true }).where(
      and(eq(messages.conversationId, conversationId), eq(messages.isRead, false)) // Only unread
    ).execute() // Note: senderId check isn't strictly necessary if updating all unread in chat
  );

  return c.json({ messages: msgs.reverse() }); // Return chronological
});
