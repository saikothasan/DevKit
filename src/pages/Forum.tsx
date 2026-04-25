import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquarePlus, MessageCircle, Search, Flame, Eye, LockKeyhole, Pin, Hash, ChevronLeft, ChevronRight, Crown, Shield, Layers } from 'lucide-react';
import { SeoHead } from '@/components/SeoHead';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const CATEGORIES = ['all', 'general', 'bins', 'methods', 'bin-list', 'vcc', 'redeem-coupons-keys'];

const formatCategory = (cat: string) => {
  const mappings: Record<string, string> = {
    'all': 'All', 'bin-list': 'BIN List', 'vcc': 'VCC', 'bins': 'BINS', 'redeem-coupons-keys': 'Redeem / Coupons / Keys'
  };
  return mappings[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
};

type Thread = {
  id: number; title: string; category: string; author: string; upvotes: number;
  views: number; replyCount: number; isPinned: boolean; isLocked: boolean; 
  hasLockedContent: boolean; createdAt: string; authorIsVip: boolean; authorRole: string;
};

type PaginationMeta = { page: number; limit: number; total: number; totalPages: number; };

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

  const fetchThreads = useCallback((pageToFetch = 1) => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: pageToFetch.toString(), limit: '15' });
    if (searchQuery) params.append('q', searchQuery);
    if (activeCategory !== 'all') params.append('category', activeCategory);

    fetch(`/api/forum/threads?${params.toString()}`)
      .then(res => res.json() as Promise<{data: Thread[], meta: PaginationMeta}>)
      .then(response => { 
        setThreads(response.data || []);
        if (response.meta) setMeta(response.meta);
      })
      .catch(() => toast('Data stream synchronization failed.', 'error'))
      .finally(() => setIsLoading(false));
  }, [searchQuery, activeCategory, toast]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => { fetchThreads(1); }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchThreads]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newThread.title.trim() || !newThread.content.trim()) return;
    
    setIsPosting(true);
    try {
      const res = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newThread)
      });
      const data = await res.json() as { error?: string; issues?: any[] };
      
      if (res.ok) {
        toast('Vector successfully published to the public ledger.', 'success');
        setNewThread({ title: '', content: '', category: 'general', lockedContent: '', unlockCost: 0 });
        fetchThreads(1);
      } else {
        toast(data.error || 'Compilation failed.', 'error');
      }
    } catch (err) {
      toast('Network disruption detected.', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto md:py-8 px-4 sm:px-6 lg:px-8 animation-fade-in">
      <SeoHead title="Central Architecture Board | Forum" description="Access exclusive technical methods, BIN lists, and secure infrastructure configurations." />
      
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[11px] font-bold uppercase tracking-widest mb-4 shadow-sm backdrop-blur-sm">
            <Layers className="size-3.5 fill-current" /> Architecture Node
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-4">Community Hub</h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">Discover, deploy, and discuss premium methods, zero-day configurations, and cryptographically secured vectors.</p>
        </div>
        
        <div className="w-full lg:w-96 relative group z-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
          <input 
            type="text" placeholder="Query ledger for threads..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all shadow-sm hover:shadow-md text-zinc-900 dark:text-zinc-100"
          />
        </div>
      </header>

      <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-10 items-start relative">
        <main className="w-full lg:col-span-8 space-y-6">
          <nav className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0 sticky top-0 z-20 bg-zinc-50/80 dark:bg-[#030303]/80 backdrop-blur-xl">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${activeCategory === cat ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 shadow-md transform -translate-y-0.5' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:bg-[#0a0a0a] dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                {formatCategory(cat)}
              </button>
            ))}
          </nav>

          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-6 bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-2xl animate-pulse">
                  <div className="flex-1 space-y-4">
                    <div className="flex gap-2"><div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-md" /><div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md" /></div>
                    <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                    <div className="flex gap-2"><div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" /></div>
                  </div>
                  <div className="w-24 border-l border-zinc-100 dark:border-zinc-800 pl-4 space-y-2 flex flex-col justify-center">
                    <div className="h-8 w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                    <div className="h-8 w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                  </div>
                </div>
              ))
            ) : threads.length === 0 ? (
              <div className="p-16 text-center bg-white/50 dark:bg-[#0a0a0a]/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl text-zinc-500 border-dashed shadow-sm backdrop-blur-sm">
                <div className="mx-auto size-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4"><Search className="size-8 text-zinc-400" /></div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Null Response</h3>
                <p className="text-sm">No ledger entries matched your specified parameters.</p>
              </div>
            ) : (
              <>
                {threads.map(thread => (
                  <article key={thread.id}>
                    <Link to={`/forum/${thread.id}`} className={`group flex flex-col sm:flex-row gap-4 p-6 bg-white dark:bg-[#0a0a0a] border rounded-2xl transition-all duration-300 ${thread.isPinned ? 'border-orange-500/50 bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-500/5 dark:to-transparent shadow-sm' : thread.authorIsVip ? 'border-amber-500/30 hover:border-amber-500/60 shadow-sm' : 'border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5 hover:-translate-y-0.5'}`}>
                      <div className="flex-1 min-w-0">
                        <header className="flex flex-wrap items-center gap-2.5 mb-3">
                          {thread.isPinned && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 shadow-sm"><Pin className="size-3" /> Pinned</span>}
                          {thread.isLocked && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20"><LockKeyhole className="size-3" /> Locked</span>}
                          {thread.hasLockedContent && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"><LockKeyhole className="size-3" /> Encrypted</span>}
                          
                          <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider rounded-md">
                            {formatCategory(thread.category)}
                          </span>
                          <time dateTime={new Date(thread.createdAt).toISOString()} className="text-xs text-zinc-500 font-medium">{new Date(thread.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time>
                        </header>
                        <h2 className="font-bold text-lg md:text-xl text-zinc-900 dark:text-zinc-100 mb-3 group-hover:text-orange-500 transition-colors line-clamp-2 leading-snug">{thread.title}</h2>
                        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-md truncate max-w-[200px]">
                            {thread.authorRole === 'admin' ? <Shield className="size-3.5 text-red-500" /> : thread.authorIsVip ? <Crown className="size-3.5 text-amber-500" /> : <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>}
                            <span className="truncate">{thread.author}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex sm:flex-col justify-end sm:justify-center items-center gap-3 sm:gap-2 border-t sm:border-t-0 sm:border-l border-zinc-100 dark:border-zinc-800/80 pt-4 sm:pt-0 sm:pl-6 shrink-0 min-w-[100px]">
                        <div className="flex items-center justify-between w-full text-sm text-orange-500 font-bold bg-orange-500/10 border border-orange-500/10 px-3 py-1.5 rounded-lg transition-colors group-hover:bg-orange-500/20"><Flame className="size-4" /> <span>{thread.upvotes}</span></div>
                        <div className="flex items-center justify-between w-full text-sm text-zinc-500 font-bold bg-zinc-100 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 px-3 py-1.5 rounded-lg"><MessageCircle className="size-4" /> <span>{thread.replyCount || 0}</span></div>
                        <div className="flex items-center justify-between w-full text-sm text-zinc-500 font-bold bg-zinc-100 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 px-3 py-1.5 rounded-lg"><Eye className="size-4" /> <span>{thread.views}</span></div>
                      </div>
                    </Link>
                  </article>
                ))}

                {meta.totalPages > 1 && (
                  <nav aria-label="Pagination" className="flex items-center justify-center gap-4 pt-6 pb-12">
                    <button onClick={() => fetchThreads(meta.page - 1)} disabled={meta.page === 1} className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer shadow-sm hover:shadow-md">
                      <ChevronLeft className="size-5 text-zinc-900 dark:text-white" />
                    </button>
                    <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Page {meta.page} of {meta.totalPages}</span>
                    <button onClick={() => fetchThreads(meta.page + 1)} disabled={meta.page === meta.totalPages} className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer shadow-sm hover:shadow-md">
                      <ChevronRight className="size-5 text-zinc-900 dark:text-white" />
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </main>

        <aside className="w-full lg:col-span-4 lg:sticky lg:top-24 z-10">
          <div className="bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl shadow-zinc-200/20 dark:shadow-black/20">
            {user ? (
              <>
                <h3 className="font-extrabold text-xl text-zinc-900 dark:text-white flex items-center gap-2 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4"><MessageSquarePlus className="size-6 text-orange-500" /> Compile Thread</h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Category Node</label>
                    <select value={newThread.category} onChange={e => setNewThread({...newThread, category: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer text-zinc-700 dark:text-zinc-300 appearance-none shadow-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                      {CATEGORIES.filter(c => c !== 'all').map(cat => <option key={cat} value={cat}>{formatCategory(cat)}</option>)}
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Designation</label>
                    <input required minLength={5} type="text" placeholder="Title of the vector..." value={newThread.title} onChange={e => setNewThread({...newThread, title: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3.5 text-sm font-medium text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50 shadow-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-700" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Public Payload (Markdown)</label>
                    <textarea required minLength={10} rows={6} placeholder="Elaborate on the method or discussion..." value={newThread.content} onChange={e => setNewThread({...newThread, content: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-zinc-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-orange-500/50 custom-scrollbar shadow-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-700" />
                  </div>
                  
                  <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-3">
                       <label className="text-xs font-bold text-orange-600 dark:text-orange-500 uppercase tracking-wider flex items-center gap-1.5">
                         <LockKeyhole className="size-3.5" /> Encrypted Payload
                       </label>
                       {user.isVip && <span className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[10px] font-bold uppercase"><Crown className="size-3" /> VIP Bypass Allowed</span>}
                    </div>
                    <textarea rows={3} placeholder="Hidden vectors (BINs, configurations)..." value={newThread.lockedContent} onChange={e => setNewThread({...newThread, lockedContent: e.target.value})} className="w-full bg-orange-500/5 border border-orange-500/20 rounded-xl px-4 py-3.5 text-sm outline-none resize-none focus:ring-2 focus:ring-orange-500/50 custom-scrollbar mb-4 placeholder:text-orange-500/50 text-orange-900 dark:text-orange-100 shadow-inner" />
                    
                    <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 shadow-sm">
                       <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Reputation Cost</span>
                       <div className="flex items-center gap-2">
                         <input type="number" min="0" max="10000" value={newThread.unlockCost} onChange={e => setNewThread({...newThread, unlockCost: parseInt(e.target.value) || 0})} className="w-24 bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50 text-right shadow-inner" />
                         <span className="text-xs text-orange-500 font-bold uppercase">pts</span>
                       </div>
                    </div>
                  </div>

                  <button disabled={isPosting || !newThread.title.trim() || !newThread.content.trim()} className="w-full bg-zinc-900 hover:bg-orange-500 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-orange-500 dark:hover:text-white font-bold py-4 rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-orange-500/20 active:scale-[0.98] cursor-pointer mt-4 flex items-center justify-center gap-2 group">
                    {isPosting ? <span className="animate-pulse">Compiling Block...</span> : <><MessageSquarePlus className="size-5 group-hover:scale-110 transition-transform" /> Deploy Thread</>}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-10 px-4">
                <div className="mx-auto size-20 bg-gradient-to-br from-orange-500/20 to-orange-500/5 rounded-2xl flex items-center justify-center mb-6 border border-orange-500/20 shadow-inner"><LockKeyhole className="size-10 text-orange-500" /></div>
                <h3 className="font-extrabold text-2xl mb-3 text-zinc-900 dark:text-white">Authentication Required</h3>
                <p className="text-base text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">Establish a secure session to deploy threads, access encrypted payloads, and accumulate reputation points.</p>
                <Link to="/login" className="flex items-center justify-center w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-xl shadow-orange-500/20 active:scale-[0.98]">
                  Authenticate
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
