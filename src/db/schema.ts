// src/db/schema.ts
import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

// ==========================================
// 1. Core Authentication & Identity
// ==========================================

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  githubId: text('github_id').unique(),
  role: text('role', { enum: ['admin', 'moderator', 'user'] }).notNull().default('user'),
  points: integer('points').notNull().default(100),
  avatarUrl: text('avatar_url'), 
  isVerified: integer('is_verified', { mode: 'boolean' }).notNull().default(false),
  isVip: integer('is_vip', { mode: 'boolean' }).notNull().default(false),
  vipSince: integer('vip_since', { mode: 'timestamp' }),
  verificationToken: text('verification_token'),
  resetToken: text('reset_token'),
  resetTokenExpiry: integer('reset_token_expiry', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// ==========================================
// 2. Apirone Cryptographic Payment Ledger
// ==========================================

export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  invoiceId: text('invoice_id').unique(),
  fiatAmount: real('fiat_amount').notNull(),
  cryptoAmount: integer('crypto_amount').notNull(), 
  currency: text('currency').notNull(), // e.g., 'usdt@trx', 'btc', 'ltc'
  status: text('status', { enum: ['created', 'paid', 'partpaid', 'completed', 'expired'] }).notNull().default('created'),
  secretToken: text('secret_token').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// ==========================================
// 3. Forum Architecture
// ==========================================

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  order: integer('order').notNull().default(0),
});

export const threads = sqliteTable('threads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  authorId: integer('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  lockedContent: text('locked_content'),
  unlockCost: integer('unlock_cost').notNull().default(0),
  upvotes: integer('upvotes').notNull().default(0),
  views: integer('views').notNull().default(0),
  replyCount: integer('reply_count').notNull().default(0),
  isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
  isLocked: integer('is_locked', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const replies = sqliteTable('replies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  threadId: integer('thread_id').notNull().references(() => threads.id, { onDelete: 'cascade' }),
  authorId: integer('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  upvotes: integer('upvotes').notNull().default(0),
  isAcceptedAnswer: integer('is_accepted_answer', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// ==========================================
// 4. Forum Execution Vectors (Unlocks & Votes)
// ==========================================

export const threadUnlocks = sqliteTable('thread_unlocks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  threadId: integer('thread_id').notNull().references(() => threads.id, { onDelete: 'cascade' }),
  pointsSpent: integer('points_spent').notNull().default(0), // Tracks actual deduction (0 if VIP)
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

export const threadVotes = sqliteTable('thread_votes', {
  threadId: integer('thread_id').notNull().references(() => threads.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  voteType: integer('vote_type').notNull(), // 1 for upvote, -1 for downvote
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (t) => ({
  pk: primaryKey(t.threadId, t.userId),
}));

export const replyVotes = sqliteTable('reply_votes', {
  replyId: integer('reply_id').notNull().references(() => replies.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  voteType: integer('vote_type').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (t) => ({
  pk: primaryKey(t.replyId, t.userId),
}));

// ==========================================
// 5. Secure Messaging System
// ==========================================

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
  content: text('content').default(''),
  fileUrl: text('file_url'),
  fileName: text('file_name'),
  fileType: text('file_type'),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// ==========================================
// 6. Security Validation (Turnstile/Audit)
// ==========================================

export const turnstileEvents = sqliteTable('turnstile_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ephemeralId: text('ephemeral_id').notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  eventType: text('event_type').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// ==========================================
// 7. ORM Relations (For advanced query inference)
// ==========================================

export const usersRelations = relations(users, ({ many }) => ({
  threads: many(threads),
  replies: many(replies),
  payments: many(payments),
  sentMessages: many(messages),
}));

export const threadsRelations = relations(threads, ({ one, many }) => ({
  author: one(users, {
    fields: [threads.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [threads.categoryId],
    references: [categories.id],
  }),
  replies: many(replies),
  unlocks: many(threadUnlocks),
}));

export const repliesRelations = relations(replies, ({ one }) => ({
  thread: one(threads, {
    fields: [replies.threadId],
    references: [threads.id],
  }),
  author: one(users, {
    fields: [replies.authorId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));
