import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // Nullable to support OAuth-only accounts
  githubId: text('github_id').unique(), // Secure identity tracking for Social Login
  role: text('role', { enum: ['admin', 'moderator', 'user'] }).notNull().default('user'),
  points: integer('points').notNull().default(100), // 100 points sign-up bonus
  isVerified: integer('is_verified', { mode: 'boolean' }).notNull().default(false),
  verificationToken: text('verification_token'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const threads = sqliteTable('threads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  authorId: integer('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  author: text('author').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  lockedContent: text('locked_content'), // Premium content hidden behind points
  unlockCost: integer('unlock_cost').notNull().default(0), // Cost to unlock
  category: text('category').notNull().default('general'),
  upvotes: integer('upvotes').notNull().default(0),
  views: integer('views').notNull().default(0),
  isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
  isLocked: integer('is_locked', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const replies = sqliteTable('replies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  threadId: integer('thread_id').notNull().references(() => threads.id, { onDelete: 'cascade' }),
  authorId: integer('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  author: text('author').notNull(),
  content: text('content').notNull(),
  upvotes: integer('upvotes').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Registry to track which users have unlocked which threads
export const threadUnlocks = sqliteTable('thread_unlocks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  threadId: integer('thread_id').notNull().references(() => threads.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// --- NEW REAL-TIME CHAT ENTITIES ---

export const conversations = sqliteTable('conversations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user1Id: integer('user1_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  user2Id: integer('user2_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lastMessageAt: integer('last_message_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  conversationId: integer('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: integer('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});
