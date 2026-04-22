import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquarePlus, MessageCircle, Search, Flame, Eye, LockKeyhole, Pin, Hash } from 'lucide-react';
import { SeoHead } from '../components/SeoHead';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['all', 'general', 'bins', 'methods', 'bin-list', 'vcc', 'redeem-coupons-keys'];

const formatCategory = (cat: string) => {
  if (cat === 'all') return 'All';
  if (cat === 'bin-list') return 'BIN List';
  if (cat === 'vcc') return 'VCC';
  if (cat === 'bins') return 'BINS';
  if (cat === 'redeem-coupons-keys') return 'Redeem / Coupons / Keys';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
};

type Thread = {
  id: number;
  title: string;
  category: string;
  author: string;
  upvotes: number;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  hasLockedContent: boolean;
  createdAt: string;
};

export default function Forum() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  
  const [isPosting, setIsPosting] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', content: '', category: 'general', lockedContent: '', unlockCost: 0 });

  const fetchThreads = useCallback(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (activeCategory !== 'all') params.append('category', activeCategory);

    fetch(`/api/forum/threads?${params.toString()}`)
      .then(res => res.json() as Promise<{data: Thread[], meta: any}>)
      .then(response => { 
        // Handle pagination response structure
        const threadData = Array.isArray(response) ? response : (response.data || []);
        setThreads(threadData); 
        setIsLoading(false); 
      })
      .catch(console.error);
  }, [searchQuery, activeCategory]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => { fetchThreads(); }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchThreads]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newThread.title.trim() || !newThread.content.trim()) return;
    
    setIsPosting(true);
    await fetch('/api/forum/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newThread)
    });
    setNewThread({ title: '', content: '', category: 'general', lockedContent: '', unlockCost: 0 });
    setIsPosting(false);
    fetchThreads();
  };

  return (
    <div className="max-w-6xl mx-auto md:py-8 animation-fade-in">
      <SeoHead title="Community Forum" description="Search, filter, and discuss methods, BINS, VCCs, and more." />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[11px] font-bold uppercase tracking-widest mb-4 shadow-sm">
            <Hash className="size-3.5 fill-current" /> Discussion Board
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Community Hub</h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400">Discover and discuss premium methods, tools, and configurations.</p>
        </div>
        
        <div className="w-full md:w-96 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search discussions..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/50 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-8 items-start">
        <div className="w-full lg:col-span-8 space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
                  activeCategory === cat 
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 shadow-md' 
                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-800'
                }`}
              >
                {formatCategory(cat)}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl animate-pulse"></div>
              ))
            ) : threads.length === 0 ? (
              <div className="p-16 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl text-zinc-500 border-dashed shadow-sm">
                <div className="mx-auto size-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="size-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">No discussions found</h3>
                <p className="text-sm">Try adjusting the search query or selecting a different category.</p>
              </div>
            ) : (
              threads.map(thread => (
                <Link 
                  key={thread.id} 
                  to={`/forum/${thread.id}`}
                  className={`group flex flex-col sm:flex-row gap-4 p-6 bg-white dark:bg-zinc-900 border rounded-2xl transition-all ${
                    thread.isPinned ? 'border-orange-500/50 bg-orange-50/50 dark:bg-orange-500/10 shadow-sm' : 'border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2.5 mb-3">
                      {thread.isPinned && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400"><Pin className="size-3" /> Pinned</span>}
                      {thread.isLocked && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500"><LockKeyhole className="size-3" /> Locked</span>}
                      {thread.hasLockedContent && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400"><LockKeyhole className="size-3" /> Premium</span>}
                      
                      <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                        {formatCategory(thread.category)}
                      </span>
                      <span className="text-xs text-zinc-500 font-medium">{new Date(thread.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-lg md:text-xl text-zinc-900 dark:text-zinc-100 mb-3 group-hover:text-orange-500 transition-colors line-clamp-2 leading-snug">{thread.title}</h3>
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md truncate max-w-[150px]"><span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span> {thread.author}</span>
                    </div>
                  </div>
                  
                  <div className="flex sm:flex-col justify-end sm:justify-center items-center gap-4 sm:gap-3 border-t sm:border-t-0 sm:border-l border-zinc-100 dark:border-zinc-800 pt-4 sm:pt-0 sm:pl-6 shrink-0 min-w-[80px]">
                    <div className="flex items-center gap-2 text-orange-500 font-bold bg-orange-500/10 px-3 py-1.5 rounded-lg" title="Upvotes">
                      <Flame className="size-4" /> {thread.upvotes}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500 font-bold bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg" title="Views">
                      <Eye className="size-4" /> {thread.views}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="w-full lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl shadow-zinc-200/20 dark:shadow-black/20 lg:sticky lg:top-8">
          {user ? (
            <>
              <h3 className="font-bold text-lg flex items-center gap-2 mb-6"><MessageSquarePlus className="size-5 text-orange-500" /> Start Discussion</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <select value={newThread.category} onChange={e => setNewThread({...newThread, category: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer text-zinc-700 dark:text-zinc-300 appearance-none">
                  {CATEGORIES.filter(c => c !== 'all').map(cat => <option key={cat} value={cat}>{formatCategory(cat)}</option>)}
                </select>
                <input required minLength={5} type="text" placeholder="Thread Title" value={newThread.title} onChange={e => setNewThread({...newThread, title: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/50" />
                <textarea required minLength={10} rows={5} placeholder="Public Content (Markdown supported)..." value={newThread.content} onChange={e => setNewThread({...newThread, content: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-orange-500/50 custom-scrollbar" />
                
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><LockKeyhole className="size-3.5 text-orange-500" /> Premium Lock (Optional)</label>
                  <textarea rows={3} placeholder="Hidden Content (Code snippets, methods, BINs)..." value={newThread.lockedContent} onChange={e => setNewThread({...newThread, lockedContent: e.target.value})} className="w-full bg-orange-500/5 border border-orange-500/20 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-orange-500/50 custom-scrollbar mb-3 placeholder:text-orange-500/50 text-orange-900 dark:text-orange-100" />
                  <div className="flex items-center gap-3 bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3">
                     <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400 flex-1">Unlock Cost:</span>
                     <input type="number" min="0" max="10000" value={newThread.unlockCost} onChange={e => setNewThread({...newThread, unlockCost: parseInt(e.target.value) || 0})} className="w-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/50 text-right" />
                     <span className="text-xs text-orange-500 font-bold uppercase">pts</span>
                  </div>
                </div>

                <button disabled={isPosting || !newThread.title.trim()} className="w-full bg-zinc-900 hover:bg-orange-500 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-orange-500 dark:hover:text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 shadow-md active:scale-[0.98] cursor-pointer mt-2">
                  {isPosting ? 'Publishing...' : 'Post Thread'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto size-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-4 border border-orange-500/20"><LockKeyhole className="size-8 text-orange-500" /></div>
              <h3 className="font-bold text-xl mb-2 text-zinc-900 dark:text-white">Join the Community</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">Authentication is required to initiate discussions, share methods, and earn reputation points.</p>
              <Link to="/login" className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]">Log In to Post</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
