import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, desc, like, or, and, sql, count } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';
import { threads, replies, users, threadUnlocks, threadVotes, replyVotes } from '@/db/schema';
import { requireAuth } from './auth';

export type ForumEnv = {
  Bindings: { DB: D1Database; JWT_SECRET: string; };
  Variables: { user: { id: number; username: string; role: string; exp: number; }; };
};

export const forumRouter = new Hono<ForumEnv>();

const getSecret = (c: any): string => c.env.JWT_SECRET || 'super-secure-dev-secret-123';

const requireModerator = async (c: any, next: any) => {
  const user = c.get('user');
  if (user.role !== 'admin' && user.role !== 'moderator') {
    return c.json({ error: 'Forbidden: Administrator or Moderator privileges required.' }, 403);
  }
  await next();
};

forumRouter.get('/threads', async (c) => {
  const db = drizzle(c.env.DB);
  const q = c.req.query('q');
  const category = c.req.query('category');
  const page = Math.max(1, parseInt(c.req.query('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query('limit') || '20')));
  const offset = (page - 1) * limit;

  const conditions = [];
  if (category && category !== 'all') conditions.push(eq(threads.category, category));
  if (q && q.trim() !== '') {
    const searchTerm = `%${q.trim()}%`;
    conditions.push(or(like(threads.title, searchTerm), like(threads.content, searchTerm)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  try {
    const [totalCountResult, fetchedThreads] = await Promise.all([
      db.select({ value: count() }).from(threads).where(whereClause).get(),
      db.select({
        id: threads.id, 
        title: threads.title, 
        category: threads.category,
        author: threads.author, 
        authorId: threads.authorId,
        upvotes: threads.upvotes, 
        views: threads.views,
        isPinned: threads.isPinned, 
        isLocked: threads.isLocked, 
        createdAt: threads.createdAt,
        unlockCost: threads.unlockCost,
        hasLockedContent: sql<boolean>`locked_content IS NOT NULL AND locked_content != ''`
      })
      .from(threads)
      .where(whereClause)
      .orderBy(desc(threads.isPinned), desc(threads.createdAt))
      .limit(limit)
      .offset(offset)
      .execute()
    ]);

    return c.json({
      data: fetchedThreads,
      meta: {
        total: totalCountResult?.value || 0,
        page,
        limit,
        totalPages: Math.ceil((totalCountResult?.value || 0) / limit)
      }
    });
  } catch (err) {
    return c.json({ error: 'Failed to retrieve threads' }, 500);
  }
});

forumRouter.get('/threads/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const threadId = parseInt(c.req.param('id'));

  if (isNaN(threadId)) return c.json({ error: 'Invalid thread ID' }, 400);

  const thread = await db.select().from(threads).where(eq(threads.id, threadId)).get();
  if (!thread) return c.json({ error: 'Thread not found' }, 404);
  
  c.executionCtx.waitUntil(
    db.update(threads).set({ views: sql`${threads.views} + 1` }).where(eq(threads.id, threadId)).execute()
  );
  
  const threadReplies = await db.select().from(replies).where(eq(replies.threadId, threadId)).orderBy(replies.createdAt).execute();
  
  let currentUser: any = null;
  const token = getCookie(c, 'auth_token');
  if (token) {
    try { currentUser = await verify(token, getSecret(c), 'HS256'); } catch {}
  }

  let canViewLocked = false;
  if (currentUser) {
    if (currentUser.id === thread.authorId || currentUser.role === 'admin') {
      canViewLocked = true;
    } else {
      const unlocked = await db.select()
        .from(threadUnlocks)
        .where(and(eq(threadUnlocks.userId, currentUser.id as number), eq(threadUnlocks.threadId, threadId)))
        .get();
      if (unlocked) canViewLocked = true;
    }
  }

  const { lockedContent, ...publicThread } = thread;
  return c.json({ 
    ...publicThread, 
    hasLockedContent: !!lockedContent, 
    lockedContent: canViewLocked ? lockedContent : undefined,
    replies: threadReplies 
  });
});

const createThreadSchema = z.object({ 
  title: z.string().min(5).max(100), 
  content: z.string().min(10).max(20000), 
  category: z.string().min(2).max(30),
  lockedContent: z.string().max(20000).optional(),
  unlockCost: z.number().min(0).max(10000).default(0)
});

forumRouter.post('/threads', requireAuth, zValidator('json', createThreadSchema), async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');
  const { title, content, category, lockedContent, unlockCost } = c.req.valid('json');

  const finalLockedContent = lockedContent?.trim() ? lockedContent : null;
  const finalUnlockCost = finalLockedContent ? unlockCost : 0;

  try {
    const result = await db.insert(threads).values({ 
      title, content, category, lockedContent: finalLockedContent, unlockCost: finalUnlockCost, authorId: user.id, author: user.username 
    }).returning();

    c.executionCtx.waitUntil(
      db.update(users).set({ points: sql`${users.points} + 5` }).where(eq(users.id, user.id)).execute()
    );

    return c.json(result[0], 201);
  } catch (err) {
    return c.json({ error: 'Failed to create thread' }, 500);
  }
});

forumRouter.post('/threads/:id/unlock', requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');
  const threadId = parseInt(c.req.param('id'));

  const thread = await db.select().from(threads).where(eq(threads.id, threadId)).get();
  if (!thread || !thread.lockedContent) return c.json({ error: 'No locked content available' }, 404);

  if (thread.authorId === user.id || user.role === 'admin') {
    return c.json({ success: true, lockedContent: thread.lockedContent });
  }

  const existing = await db.select().from(threadUnlocks).where(and(eq(threadUnlocks.userId, user.id), eq(threadUnlocks.threadId, threadId))).get();
  if (existing) return c.json({ success: true, lockedContent: thread.lockedContent });

  const dbUser = await db.select({ points: users.points }).from(users).where(eq(users.id, user.id)).get();
  if (!dbUser || dbUser.points < thread.unlockCost) {
    return c.json({ error: `Insufficient balance.` }, 400);
  }

  try {
    const authorReward = Math.floor(thread.unlockCost * 0.8);
    await db.batch([
      db.update(users).set({ points: sql`${users.points} - ${thread.unlockCost}` }).where(eq(users.id, user.id)),
      db.update(users).set({ points: sql`${users.points} + ${authorReward}` }).where(eq(users.id, thread.authorId)),
      db.insert(threadUnlocks).values({ userId: user.id, threadId })
    ]);
    return c.json({ success: true, lockedContent: thread.lockedContent });
  } catch (err) {
    return c.json({ error: 'Transaction failed' }, 500);
  }
});

const replySchema = z.object({ content: z.string().min(2).max(5000) });

forumRouter.post('/threads/:id/replies', requireAuth, zValidator('json', replySchema), async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');
  const threadId = parseInt(c.req.param('id'));
  const { content } = c.req.valid('json');

  const thread = await db.select({ isLocked: threads.isLocked }).from(threads).where(eq(threads.id, threadId)).get();
  if (!thread) return c.json({ error: 'Thread not found' }, 404);
  if (thread.isLocked && user.role === 'user') return c.json({ error: 'Thread locked.' }, 403);

  try {
    const result = await db.insert(replies).values({ threadId, content, authorId: user.id, author: user.username }).returning();
    c.executionCtx.waitUntil(
      db.update(users).set({ points: sql`${users.points} + 2` }).where(eq(users.id, user.id)).execute()
    );
    return c.json(result[0], 201);
  } catch (err) {
    return c.json({ error: 'Failed to post reply' }, 500);
  }
});

forumRouter.delete('/replies/:id', requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');
  const replyId = parseInt(c.req.param('id'));

  const reply = await db.select().from(replies).where(eq(replies.id, replyId)).get();
  if (!reply) return c.json({ error: 'Reply not found' }, 404);

  if (reply.authorId !== user.id && user.role === 'user') {
    return c.json({ error: 'Forbidden' }, 403);
  }

  await db.delete(replies).where(eq(replies.id, replyId)).execute();
  return c.json({ success: true });
});

forumRouter.patch('/threads/:id/pin', requireAuth, requireModerator, async (c) => {
  const db = drizzle(c.env.DB);
  const threadId = parseInt(c.req.param('id'));
  
  const thread = await db.select({ isPinned: threads.isPinned }).from(threads).where(eq(threads.id, threadId)).get();
  if (!thread) return c.json({ error: 'Thread not found' }, 404);
  
  const result = await db.update(threads).set({ isPinned: !thread.isPinned }).where(eq(threads.id, threadId)).returning();
  return c.json(result[0]);
});

forumRouter.patch('/threads/:id/lock', requireAuth, requireModerator, async (c) => {
  const db = drizzle(c.env.DB);
  const threadId = parseInt(c.req.param('id'));
  
  const thread = await db.select({ isLocked: threads.isLocked }).from(threads).where(eq(threads.id, threadId)).get();
  if (!thread) return c.json({ error: 'Thread not found' }, 404);
  
  const result = await db.update(threads).set({ isLocked: !thread.isLocked }).where(eq(threads.id, threadId)).returning();
  return c.json(result[0]);
});

forumRouter.delete('/threads/:id', requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const threadId = parseInt(c.req.param('id'));
  const user = c.get('user');
  
  const thread = await db.select({ authorId: threads.authorId }).from(threads).where(eq(threads.id, threadId)).get();
  if (!thread) return c.json({ error: 'Thread not found' }, 404);
  
  if (thread.authorId !== user.id && user.role === 'user') {
    return c.json({ error: 'Forbidden' }, 403);
  }
  
  await db.delete(threads).where(eq(threads.id, threadId)).execute();
  return c.json({ success: true });
});

forumRouter.post('/vote/:type/:id', requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');
  const type = c.req.param('type');
  const id = parseInt(c.req.param('id'));

  if (isNaN(id) || (type !== 'thread' && type !== 'reply')) return c.json({ error: 'Invalid parameters' }, 400);

  try {
    if (type === 'thread') {
      const existingVote = await db.select().from(threadVotes).where(and(eq(threadVotes.threadId, id), eq(threadVotes.userId, user.id))).get();
      if (existingVote) return c.json({ error: 'Already voted' }, 400);

      const target = await db.select({ authorId: threads.authorId }).from(threads).where(eq(threads.id, id)).get();
      if (!target) return c.json({ error: 'Thread not found' }, 404);

      await db.batch([
        db.insert(threadVotes).values({ threadId: id, userId: user.id }),
        db.update(threads).set({ upvotes: sql`${threads.upvotes} + 1` }).where(eq(threads.id, id)),
        db.update(users).set({ points: sql`${users.points} + 2` }).where(eq(users.id, target.authorId)) 
      ]);
    } else {
      const existingVote = await db.select().from(replyVotes).where(and(eq(replyVotes.replyId, id), eq(replyVotes.userId, user.id))).get();
      if (existingVote) return c.json({ error: 'Already voted' }, 400);

      const target = await db.select({ authorId: replies.authorId }).from(replies).where(eq(replies.id, id)).get();
      if (!target) return c.json({ error: 'Reply not found' }, 404);

      await db.batch([
        db.insert(replyVotes).values({ replyId: id, userId: user.id }),
        db.update(replies).set({ upvotes: sql`${replies.upvotes} + 1` }).where(eq(replies.id, id)),
        db.update(users).set({ points: sql`${users.points} + 1` }).where(eq(users.id, target.authorId)) 
      ]);
    }
    
    return c.json({ success: true, message: 'Vote registered' });
  } catch (err) {
    return c.json({ error: 'Failed to process vote' }, 500);
  }
});
