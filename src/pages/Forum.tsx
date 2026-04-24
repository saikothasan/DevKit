import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquarePlus, MessageCircle, Search, Flame, Eye, LockKeyhole, Pin, Hash, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SeoHead } from '@/components/SeoHead';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/utils/cn';

const CATEGORIES = ['all', 'general', 'bins', 'methods', 'bin-list', 'vcc', 'redeem-coupons-keys'];

const formatCategory = (cat: string) => {
  const mappings: Record<string, string> = {
    'all': 'All Sectors', 'bin-list': 'BIN List', 'vcc': 'VCC', 'bins': 'BINS', 'redeem-coupons-keys': 'Redeem / Keys'
  };
  return mappings[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
};

type Thread = {
  id: number; title: string; category: string; author: string; upvotes: number;
  views: number; isPinned: boolean; isLocked: boolean; hasLockedContent: boolean; createdAt: string;
};

type PaginationMeta = { page: number; limit: number; total: number; totalPages: number; };

// Staggered animation variants
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

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
    const delayDebounceFn = setTimeout(() => { fetchThreads(1); }, 300);
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
    <div className="w-full animation-fade-in">
      <SeoHead title="Central Architecture Board" description="Access exclusive technical methods, BIN lists, and VCC configurations." />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange-dark dark:text-brand-orange-light text-[11px] font-bold uppercase tracking-widest mb-4 shadow-sm backdrop-blur-sm">
            <Hash className="size-3.5 fill-current" /> Discussion Node
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-3 flex items-center gap-3">
            Community Hub
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">Discover and discuss premium methods, configurations, and encrypted vectors.</p>
        </div>
        
        <div className="w-full md:w-96 relative group z-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-400 group-focus-within:text-brand-orange transition-colors duration-300" />
          <input 
            type="text" placeholder="Query ledger..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl pl-12 pr-4 py-4 text-[15px] font-medium outline-none focus-ring shadow-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
          />
        </div>
      </div>

      <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-8 items-start relative z-10">
        <div className="w-full lg:col-span-8 space-y-6">
          
          {/* Fluid Category Navigation */}
          <nav aria-label="Thread Categories" className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat;
              return (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)} 
                  className={cn(
                    "relative px-5 py-2.5 rounded-xl text-[13px] font-bold whitespace-nowrap transition-colors focus-ring select-none",
                    isActive ? "text-white dark:text-zinc-950" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50"
                  )}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="category-active" 
                      className="absolute inset-0 bg-zinc-900 dark:bg-zinc-100 rounded-xl shadow-md -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{formatCategory(cat)}</span>
                </button>
              );
            })}
          </nav>

          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-32 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl animate-pulse relative overflow-hidden">
                     <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent" />
                  </div>
                ))}
              </div>
            ) : threads.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-16 text-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl text-zinc-500 border-dashed shadow-sm">
                <div className="mx-auto size-16 bg-zinc-100 dark:bg-zinc-950 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <MessageCircle className="size-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-2 tracking-tight">Null Response</h3>
                <p className="text-sm font-medium">No queries matched the specified parameters.</p>
              </motion.div>
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
                {threads.map(thread => (
                  <motion.div variants={itemVariants} key={thread.id}>
                    <Link 
                      to={`/forum/${thread.id}`} 
                      className={cn(
                        "group flex flex-col sm:flex-row gap-4 p-5 md:p-6 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border rounded-2xl transition-all duration-300 focus-ring",
                        thread.isPinned 
                          ? "border-brand-orange/40 bg-gradient-to-r from-brand-orange/5 to-transparent dark:from-brand-orange/10 dark:to-transparent shadow-sm" 
                          : "border-zinc-200/80 dark:border-zinc-800/80 hover:border-brand-orange/50 hover:shadow-xl hover:shadow-brand-orange/5"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {thread.isPinned && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-orange-dark dark:text-brand-orange-light bg-brand-orange/10 px-2 py-0.5 rounded border border-brand-orange/20"><Pin className="size-3" /> Pinned</span>}
                          {thread.isLocked && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20"><LockKeyhole className="size-3" /> Locked</span>}
                          {thread.hasLockedContent && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"><LockKeyhole className="size-3" /> Encrypted</span>}
                          
                          <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-800/50 text-[10px] font-bold uppercase tracking-wider rounded-md shadow-inner">
                            {formatCategory(thread.category)}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">{new Date(thread.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="font-bold text-lg md:text-[20px] text-zinc-900 dark:text-zinc-100 mb-3 group-hover:text-brand-orange transition-colors line-clamp-2 leading-tight tracking-tight">{thread.title}</h3>
                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-950 border border-transparent dark:border-zinc-800/80 rounded-md truncate max-w-[150px] shadow-inner">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse"></span> {thread.author}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex sm:flex-col justify-end sm:justify-center items-center gap-3 border-t sm:border-t-0 sm:border-l border-zinc-100 dark:border-zinc-800/80 pt-4 sm:pt-0 sm:pl-6 shrink-0 min-w-[90px]">
                        <div className="flex items-center gap-2 text-brand-orange-dark dark:text-brand-orange-light font-black bg-brand-orange/10 border border-brand-orange/20 px-3 py-1.5 rounded-xl shadow-inner w-full justify-center">
                          <Flame className="size-4" /> {thread.upvotes}
                        </div>
                        <div className="flex items-center gap-2 text-zinc-500 font-black bg-zinc-100 dark:bg-zinc-950 border border-transparent dark:border-zinc-800/80 px-3 py-1.5 rounded-xl shadow-inner w-full justify-center">
                          <Eye className="size-4" /> {thread.views}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Pagination Controls */}
            {meta.totalPages > 1 && !isLoading && (
              <div className="flex items-center justify-center gap-4 pt-8 pb-4">
                <button onClick={() => fetchThreads(meta.page - 1)} disabled={meta.page === 1} className="p-2 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-50 transition-all focus-ring active:scale-95 shadow-sm">
                  <ChevronLeft className="size-5 text-zinc-900 dark:text-white" />
                </button>
                <div className="px-4 py-2 rounded-xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
                  <span className="text-[13px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">Page <span className="text-brand-orange">{meta.page}</span> / {meta.totalPages}</span>
                </div>
                <button onClick={() => fetchThreads(meta.page + 1)} disabled={meta.page === meta.totalPages} className="p-2 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-50 transition-all focus-ring active:scale-95 shadow-sm">
                  <ChevronRight className="size-5 text-zinc-900 dark:text-white" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Compiler Surface */}
        <div className="w-full lg:col-span-4 lg:sticky lg:top-24">
          <div className="glass-panel rounded-3xl p-6 md:p-8">
            {user ? (
              <>
                <h3 className="font-black text-xl text-zinc-900 dark:text-white flex items-center gap-2 mb-6 tracking-tight">
                  <div className="p-2 rounded-lg bg-brand-orange/10 text-brand-orange">
                    <MessageSquarePlus className="size-5" />
                  </div>
                  Compile Thread
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative group">
                    <select value={newThread.category} onChange={e => setNewThread({...newThread, category: e.target.value})} className="w-full bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800/80 rounded-xl px-4 py-3.5 text-[14px] font-bold outline-none focus:border-brand-orange/50 focus:ring-2 focus:ring-brand-orange/20 cursor-pointer text-zinc-700 dark:text-zinc-300 appearance-none shadow-inner transition-all">
                      {CATEGORIES.filter(c => c !== 'all').map(cat => <option key={cat} value={cat}>{formatCategory(cat)}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronRight className="size-4 text-zinc-400 rotate-90" />
                    </div>
                  </div>
                  
                  <input required minLength={5} type="text" placeholder="Thread Designation" value={newThread.title} onChange={e => setNewThread({...newThread, title: e.target.value})} className="w-full bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800/80 rounded-xl px-4 py-3.5 text-[15px] font-medium text-zinc-900 dark:text-white outline-none focus:border-brand-orange/50 focus:ring-2 focus:ring-brand-orange/20 shadow-inner transition-all placeholder:text-zinc-400" />
                  
                  <textarea required minLength={10} rows={5} placeholder="Public Payload (Markdown supported)..." value={newThread.content} onChange={e => setNewThread({...newThread, content: e.target.value})} className="w-full bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800/80 rounded-xl px-4 py-3.5 text-[15px] text-zinc-900 dark:text-white outline-none resize-none focus:border-brand-orange/50 focus:ring-2 focus:ring-brand-orange/20 custom-scrollbar shadow-inner transition-all placeholder:text-zinc-400" />
                  
                  <div className="pt-5 mt-2 border-t border-zinc-200/80 dark:border-zinc-800/80 relative">
                    <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <LockKeyhole className="size-3.5 text-brand-orange" /> Encrypted Payload Layer
                    </label>
                    <textarea rows={3} placeholder="Hidden vectors (BINs, logic)..." value={newThread.lockedContent} onChange={e => setNewThread({...newThread, lockedContent: e.target.value})} className="w-full bg-brand-orange/5 border border-brand-orange/20 rounded-xl px-4 py-3.5 text-[14px] font-mono outline-none resize-none focus:ring-2 focus:ring-brand-orange/30 custom-scrollbar mb-3 placeholder:text-brand-orange/40 text-brand-orange-dark dark:text-brand-orange-light shadow-inner transition-all" />
                    
                    <div className="flex items-center gap-3 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800/80 rounded-xl px-4 py-3 shadow-inner">
                       <span className="text-[13px] font-bold text-zinc-600 dark:text-zinc-400 flex-1">Decryption Cost:</span>
                       <div className="relative">
                         <input type="number" min="0" max="10000" value={newThread.unlockCost} onChange={e => setNewThread({...newThread, unlockCost: parseInt(e.target.value) || 0})} className="w-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg pr-8 pl-3 py-1.5 text-[14px] font-black text-zinc-900 dark:text-white outline-none focus:border-brand-orange/50 focus:ring-2 focus:ring-brand-orange/20 text-right shadow-sm transition-all" />
                         <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-brand-orange font-black uppercase tracking-wider select-none">pts</span>
                       </div>
                    </div>
                  </div>

                  <button disabled={isPosting || !newThread.title.trim()} className="w-full relative overflow-hidden bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold py-4 rounded-xl transition-all disabled:opacity-50 shadow-xl shadow-zinc-900/10 dark:shadow-white/10 active:scale-[0.98] cursor-pointer mt-4 flex items-center justify-center gap-2 group hover:bg-brand-orange dark:hover:bg-brand-orange dark:hover:text-white focus-ring">
                    {isPosting ? (
                      <span className="animate-pulse flex items-center gap-2">Compiling Matrix...</span>
                    ) : (
                      <>
                        <Sparkles className="size-4 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                        Deploy Thread
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="mx-auto size-20 bg-gradient-to-br from-brand-orange/20 to-brand-orange/5 rounded-full flex items-center justify-center mb-5 border border-brand-orange/20 shadow-inner">
                  <LockKeyhole className="size-8 text-brand-orange" />
                </div>
                <h3 className="font-black text-2xl mb-2 text-zinc-900 dark:text-white tracking-tight">Access Restricted</h3>
                <p className="text-[14px] text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed font-medium">Establish a session to compile threads, access encrypted payloads, and accumulate reputation points.</p>
                <Link to="/login" className="block w-full bg-brand-orange hover:bg-brand-orange-light text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-brand-orange/20 active:scale-[0.98] focus-ring tracking-wide">
                  Authenticate Entity
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
