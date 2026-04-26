import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquarePlus, MessageCircle, Search, Flame, Eye,
  LockKeyhole, Pin, ChevronLeft, ChevronRight, Crown,
  Shield, Layers, TrendingUp, Users, Send
} from 'lucide-react';
import { SeoHead } from '@/components/SeoHead';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const CATEGORIES = ['all', 'general', 'bins', 'methods', 'bin-list', 'vcc', 'redeem-coupons-keys'];

const formatCategory = (cat: string) => {
  const m: Record<string, string> = {
    all: 'All', 'bin-list': 'BIN List', vcc: 'VCC',
    bins: 'BINS', 'redeem-coupons-keys': 'Redeem / Keys',
  };
  return m[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
};

type Thread = {
  id: number; title: string; category: string; author: string; upvotes: number;
  views: number; replyCount: number; isPinned: boolean; isLocked: boolean;
  hasLockedContent: boolean; createdAt: string; authorIsVip: boolean; authorRole: string;
};

type PaginationMeta = { page: number; limit: number; total: number; totalPages: number; };

function StatPill({ icon: Icon, value, color }: { icon: any; value: number; color: string }) {
  return (
    <div
      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors"
      style={{ background: `${color}10`, border: `1px solid ${color}20`, color }}
    >
      <Icon className="size-3.5 shrink-0" />
      <span>{value}</span>
    </div>
  );
}

function ThreadSkeleton() {
  return (
    <div className="p-5 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-14 skeleton rounded" />
            <div className="h-5 w-20 skeleton rounded" />
          </div>
          <div className="h-6 w-3/4 skeleton rounded-md" />
          <div className="h-5 w-28 skeleton rounded" />
        </div>
        <div className="w-20 space-y-2 shrink-0">
          <div className="h-8 skeleton rounded-lg" />
          <div className="h-8 skeleton rounded-lg" />
          <div className="h-8 skeleton rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function Forum() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isPosting, setIsPosting] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', content: '', category: 'general', lockedContent: '', unlockCost: 0 });

  const fetchThreads = useCallback((page = 1) => {
    setIsLoading(true);
    const p = new URLSearchParams({ page: page.toString(), limit: '15' });
    if (searchQuery) p.append('q', searchQuery);
    if (activeCategory !== 'all') p.append('category', activeCategory);
    fetch(`/api/forum/threads?${p}`)
      .then(r => r.json() as Promise<{ data: Thread[]; meta: PaginationMeta }>)
      .then(res => { setThreads(res.data || []); if (res.meta) setMeta(res.meta); })
      .catch(() => toast('Failed to load threads.', 'error'))
      .finally(() => setIsLoading(false));
  }, [searchQuery, activeCategory, toast]);

  useEffect(() => {
    const t = setTimeout(() => fetchThreads(1), 350);
    return () => clearTimeout(t);
  }, [fetchThreads]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newThread.title.trim() || !newThread.content.trim()) return;
    setIsPosting(true);
    try {
      const res = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newThread),
      });
      const data = await res.json() as { error?: string };
      if (res.ok) {
        toast('Thread published successfully.', 'success');
        setNewThread({ title: '', content: '', category: 'general', lockedContent: '', unlockCost: 0 });
        fetchThreads(1);
      } else {
        toast(data.error || 'Failed to publish.', 'error');
      }
    } catch {
      toast('Network error.', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="w-full animation-fade-in">
      <SeoHead
        title="Community Hub | Forum"
        description="Exclusive technical methods, BIN lists, and secure infrastructure configurations."
      />

      {/* ── Page Header ── */}
      <header className="mb-8 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full badge-mono mb-4"
              style={{ background: 'var(--orange-dim)', border: '1px solid var(--orange-border)', color: 'var(--orange)' }}
            >
              <Layers className="size-3" />
              Discussion Board
            </div>
            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-2"
              style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}
            >
              Community Hub
            </h1>
            <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
              Discover and discuss premium methods, configurations, and technical resources.
            </p>
          </div>

          {/* Search */}
          <div className="w-full lg:w-80 relative group">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search threads..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none transition-all"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--orange-dim)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
        </div>
      </header>

      {/* ── Main Grid ── */}
      <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-8 items-start">

        {/* ── Thread List (left/main) ── */}
        <main className="w-full lg:col-span-8 space-y-5">

          {/* Category Tabs */}
          <div
            className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0 sticky z-20"
            style={{ top: '56px' }}
          >
            <div
              className="flex gap-2 min-w-max py-2 px-1"
              style={{ background: 'var(--bg)' }}
            >
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all shrink-0"
                  style={
                    activeCategory === cat
                      ? { background: 'var(--text-primary)', color: 'var(--bg)', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
                      : { background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                  }
                >
                  {formatCategory(cat)}
                </button>
              ))}
            </div>
          </div>

          {/* Thread count */}
          {!isLoading && (
            <div className="flex items-center justify-between">
              <p className="badge-mono" style={{ color: 'var(--text-muted)' }}>
                {meta.total} thread{meta.total !== 1 ? 's' : ''}
                {activeCategory !== 'all' ? ` in ${formatCategory(activeCategory)}` : ''}
              </p>
              <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <TrendingUp className="size-3.5" />
                <span className="badge-mono text-[10px]">Most Recent</span>
              </div>
            </div>
          )}

          {/* Threads */}
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <ThreadSkeleton key={i} />)
            ) : threads.length === 0 ? (
              <div
                className="py-20 text-center rounded-2xl"
                style={{ background: 'var(--surface)', border: '1px dashed var(--border-strong)' }}
              >
                <div
                  className="mx-auto size-14 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
                >
                  <Search className="size-6" style={{ color: 'var(--text-muted)' }} />
                </div>
                <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>
                  No Results Found
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Try adjusting your search or changing the category filter.
                </p>
              </div>
            ) : (
              <>
                {threads.map((thread, idx) => (
                  <article
                    key={thread.id}
                    className="animation-fade-up"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <Link
                      to={`/forum/${thread.id}`}
                      className="group flex flex-col sm:flex-row gap-4 p-5 rounded-2xl transition-all duration-200 card-interactive thread-card"
                      style={{
                        background: 'var(--surface)',
                        border: `1px solid ${thread.isPinned ? 'rgba(243,128,32,0.35)' : thread.authorIsVip ? 'rgba(245,158,11,0.2)' : 'var(--border)'}`,
                        background: thread.isPinned ? 'linear-gradient(135deg, rgba(243,128,32,0.04) 0%, var(--surface) 100%)' : 'var(--surface)',
                      } as React.CSSProperties}
                    >
                      <div className="flex-1 min-w-0">
                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                          {thread.isPinned && (
                            <span className="badge-mono flex items-center gap-1 px-2 py-0.5 rounded text-orange-500" style={{ background: 'var(--orange-dim)', border: '1px solid var(--orange-border)' }}>
                              <Pin className="size-2.5" /> Pinned
                            </span>
                          )}
                          {thread.isLocked && (
                            <span className="badge-mono flex items-center gap-1 px-2 py-0.5 rounded text-red-500" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                              <LockKeyhole className="size-2.5" /> Locked
                            </span>
                          )}
                          {thread.hasLockedContent && (
                            <span className="badge-mono flex items-center gap-1 px-2 py-0.5 rounded text-emerald-500" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                              <LockKeyhole className="size-2.5" /> Encrypted
                            </span>
                          )}
                          <span
                            className="badge-mono px-2 py-0.5 rounded"
                            style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                          >
                            {formatCategory(thread.category)}
                          </span>
                          <time
                            dateTime={new Date(thread.createdAt).toISOString()}
                            className="text-xs ml-auto"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {new Date(thread.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </time>
                        </div>

                        {/* Title */}
                        <h2
                          className="font-bold text-base sm:text-lg mb-2.5 line-clamp-2 leading-snug transition-colors group-hover:text-orange-500"
                          style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}
                        >
                          {thread.title}
                        </h2>

                        {/* Author */}
                        <div className="flex items-center gap-1.5">
                          <span
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold truncate max-w-[200px]"
                            style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                          >
                            {thread.authorRole === 'admin'
                              ? <Shield className="size-3 text-red-500 shrink-0" />
                              : thread.authorIsVip
                              ? <Crown className="size-3 text-amber-500 shrink-0" />
                              : <Users className="size-3 shrink-0" style={{ color: 'var(--text-muted)' }} />
                            }
                            <span className="truncate">{thread.author}</span>
                          </span>
                        </div>
                      </div>

                      {/* Stats column */}
                      <div
                        className="flex sm:flex-col justify-end sm:justify-center items-center gap-2 pt-3 sm:pt-0 sm:pl-5 shrink-0"
                        style={{ borderTop: '1px solid var(--border)', ...(typeof window !== 'undefined' && window.innerWidth >= 640 ? { borderTop: 'none', borderLeft: '1px solid var(--border)' } : {}) }}
                      >
                        <StatPill icon={Flame} value={thread.upvotes} color="#F38020" />
                        <StatPill icon={MessageCircle} value={thread.replyCount || 0} color={`var(--text-secondary)`} />
                        <StatPill icon={Eye} value={thread.views} color={`var(--text-secondary)`} />
                      </div>
                    </Link>
                  </article>
                ))}

                {/* Pagination */}
                {meta.totalPages > 1 && (
                  <nav aria-label="Pagination" className="flex items-center justify-center gap-3 pt-4 pb-8">
                    <button
                      onClick={() => fetchThreads(meta.page - 1)}
                      disabled={meta.page === 1}
                      className="size-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-30 active:scale-95"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <span className="badge-mono px-4 py-2 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      {meta.page} / {meta.totalPages}
                    </span>
                    <button
                      onClick={() => fetchThreads(meta.page + 1)}
                      disabled={meta.page === meta.totalPages}
                      className="size-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-30 active:scale-95"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </main>

        {/* ── Sidebar: New Thread / Login CTA ── */}
        <aside className="w-full lg:col-span-4 lg:sticky lg:top-6">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
          >
            {/* Top accent */}
            <div className="h-px w-full bg-gradient-to-r from-orange-500/80 via-amber-400/40 to-transparent" />

            {user ? (
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2.5 mb-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div
                    className="flex size-9 items-center justify-center rounded-xl"
                    style={{ background: 'var(--orange-dim)', border: '1px solid var(--orange-border)' }}
                  >
                    <MessageSquarePlus className="size-4.5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>
                      New Thread
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Share with the community</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Category */}
                  <div>
                    <label className="badge-mono block mb-1.5" style={{ color: 'var(--text-muted)' }}>Category</label>
                    <select
                      value={newThread.category}
                      onChange={e => setNewThread({ ...newThread, category: e.target.value })}
                      className="w-full rounded-xl px-3.5 py-3 text-sm font-semibold outline-none transition-all appearance-none cursor-pointer"
                      style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
                    >
                      {CATEGORIES.filter(c => c !== 'all').map(cat => (
                        <option key={cat} value={cat}>{formatCategory(cat)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="badge-mono block mb-1.5" style={{ color: 'var(--text-muted)' }}>Title</label>
                    <input
                      required
                      minLength={5}
                      type="text"
                      placeholder="Thread title..."
                      value={newThread.title}
                      onChange={e => setNewThread({ ...newThread, title: e.target.value })}
                      className="w-full rounded-xl px-3.5 py-3 text-sm font-medium outline-none transition-all"
                      style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--orange-dim)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="badge-mono block mb-1.5" style={{ color: 'var(--text-muted)' }}>Content (Markdown)</label>
                    <textarea
                      required
                      minLength={10}
                      rows={5}
                      placeholder="Describe your thread..."
                      value={newThread.content}
                      onChange={e => setNewThread({ ...newThread, content: e.target.value })}
                      className="w-full rounded-xl px-3.5 py-3 text-sm outline-none resize-none custom-scrollbar transition-all"
                      style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--orange-dim)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {/* Encrypted payload */}
                  <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="badge-mono flex items-center gap-1 text-orange-500">
                        <LockKeyhole className="size-3" /> Encrypted Payload
                      </label>
                      {user.isVip && (
                        <span className="badge-mono flex items-center gap-1 text-amber-500 px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                          <Crown className="size-2.5" /> VIP
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Hidden content (BINs, configs)..."
                      value={newThread.lockedContent}
                      onChange={e => setNewThread({ ...newThread, lockedContent: e.target.value })}
                      className="w-full rounded-xl px-3.5 py-3 text-sm outline-none resize-none custom-scrollbar"
                      style={{ background: 'rgba(243,128,32,0.05)', border: '1px solid rgba(243,128,32,0.2)', color: 'var(--text-primary)' }}
                    />

                    <div
                      className="mt-2.5 flex items-center justify-between rounded-xl px-3.5 py-3"
                      style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
                    >
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Unlock Cost</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="10000"
                          value={newThread.unlockCost}
                          onChange={e => setNewThread({ ...newThread, unlockCost: parseInt(e.target.value) || 0 })}
                          className="w-20 rounded-lg px-3 py-1.5 text-sm font-bold outline-none text-right transition-all"
                          style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
                        />
                        <span className="badge-mono text-orange-500">pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    disabled={isPosting || !newThread.title.trim() || !newThread.content.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 active:scale-[0.98] group"
                    style={{ background: 'var(--text-primary)', color: 'var(--bg)' }}
                    onMouseEnter={e => { if (!isPosting) e.currentTarget.style.background = 'var(--orange)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--text-primary)'; }}
                  >
                    {isPosting ? (
                      <span className="animate-pulse">Publishing...</span>
                    ) : (
                      <><Send className="size-4" /> Publish Thread</>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-6 text-center">
                <div
                  className="mx-auto size-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: 'var(--orange-dim)', border: '1px solid var(--orange-border)' }}
                >
                  <LockKeyhole className="size-7 text-orange-500" />
                </div>
                <h3
                  className="font-bold text-xl mb-2"
                  style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}
                >
                  Sign In Required
                </h3>
                <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Create an account to post threads, access encrypted content, and earn reputation points.
                </p>
                <div className="space-y-2.5">
                  <Link
                    to="/login"
                    className="flex items-center justify-center w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                    style={{ background: 'var(--orange)', color: '#fff' }}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center justify-center w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                    style={{ background: 'var(--surface-raised)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
