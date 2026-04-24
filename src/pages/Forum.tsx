import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Eye, Filter, Plus, Flame, Pin, Lock, ArrowDownAZ } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/utils/apiClient';
import { cn } from '@/utils/cn';
import { formatDistanceToNow } from 'date-fns';

export function Forum() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = parseInt(searchParams.get('page') || '1');
  const category = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'latest';
  const q = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(q);

  const { data, isLoading } = useQuery({
    queryKey: ['threads', { page, category, sort, q }],
    queryFn: () => api.get(`/forum/threads?page=${page}&category=${category}&sort=${sort}&q=${encodeURIComponent(q)}`).then(res => res.json())
  });

  const updateParams = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => newParams.set(k, v));
    newParams.set('page', '1'); // Reset pagination on filter change
    setSearchParams(newParams);
  };

  const categories = ['all', 'general', 'releases', 'tutorials', 'support'];
  const sorts = [
    { value: 'latest', label: 'Latest' },
    { value: 'popular', label: 'Top Voted' },
    { value: 'views', label: 'Most Viewed' }
  ];

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      {/* Utility Bar */}
      <div className="flex flex-col gap-4 bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 p-4 rounded-3xl shadow-sm">
        
        {/* Top Row: Search & Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <form onSubmit={(e) => { e.preventDefault(); updateParams({ q: searchInput }); }} className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-orange-500 transition-colors">
              <Search className="size-4" />
            </div>
            <input 
              type="text" 
              value={searchInput} 
              onChange={(e) => setSearchInput(e.target.value)} 
              placeholder="Search network vectors..." 
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus-ring text-zinc-900 dark:text-zinc-100 transition-all"
            />
          </form>

          {user && (
            <Link to="/forum/new" className="w-full sm:w-auto shrink-0 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-orange-500 dark:hover:bg-orange-500 px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 focus-ring">
              <Plus className="size-4" /> New Payload
            </Link>
          )}
        </div>

        {/* Bottom Row: Mobile-friendly Filter & Sort Scroll-X */}
        <div className="flex items-center gap-4 overflow-x-auto custom-scrollbar pb-1 w-full mask-linear-fade">
          <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shrink-0">
            {categories.map(c => (
              <button 
                key={c}
                onClick={() => updateParams({ category: c })}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all focus-ring whitespace-nowrap", category === c ? "bg-white dark:bg-[#1c1c1c] text-orange-500 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300")}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0" />

          <div className="flex items-center gap-1.5 shrink-0">
            <ArrowDownAZ className="size-4 text-zinc-400 hidden sm:block" />
            {sorts.map(s => (
              <button 
                key={s.value}
                onClick={() => updateParams({ sort: s.value })}
                className={cn("px-3 py-1.5 rounded-xl text-xs font-bold transition-all focus-ring whitespace-nowrap border", sort === s.value ? "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400" : "bg-white dark:bg-[#141414] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700")}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Execution */}
      <div className="space-y-3 min-h-[40vh]">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse h-24 bg-zinc-200 dark:bg-zinc-800/50 rounded-2xl" />
          ))
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-20 glass-panel rounded-3xl">
            <Filter className="size-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Zero Results Propagated</h3>
            <p className="text-sm text-zinc-500 mt-1">Adjust your search parameters or query another category.</p>
          </div>
        ) : (
          data?.data?.map((thread: any, idx: number) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: idx * 0.05 }}
              key={thread.id}
            >
              <Link to={`/forum/thread/${thread.id}`} className="group block bg-white dark:bg-[#141414] hover:bg-zinc-50 dark:hover:bg-[#1c1c1c] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 transition-all focus-ring relative overflow-hidden">
                {thread.isPinned && <div className="absolute top-0 right-0 border-t-[30px] border-r-[30px] border-t-red-500/20 border-r-transparent" />}
                
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  {/* Left Metadata & Title */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {thread.isPinned && <Pin className="size-3 text-red-500 fill-red-500/20 shrink-0" />}
                      <span className="px-2 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[9px] font-bold uppercase tracking-widest rounded border border-orange-500/20 shrink-0">
                        {thread.category}
                      </span>
                      <span className="truncate text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        Deployed by <span className="text-zinc-900 dark:text-zinc-300 font-bold">{thread.author}</span>
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-600 hidden sm:inline">•</span>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium hidden sm:inline">
                        {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 group-hover:text-orange-500 transition-colors leading-tight truncate">
                      {thread.title}
                    </h3>
                  </div>

                  {/* Right Analytics */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-zinc-100 dark:border-zinc-800/50">
                    {thread.hasLockedContent && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded-md border border-orange-500/20 shrink-0" title={`Unlock Cost: ${thread.unlockCost} pts`}>
                        <Lock className="size-3.5" /> {thread.unlockCost}
                      </div>
                    )}
                    <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-0.5 text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold"><Eye className="size-3.5" /> {thread.views}</span>
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold"><Flame className="size-3.5 text-amber-500" /> {thread.upvotes}</span>
                    </div>
                    <div className="flex items-center justify-center h-8 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 group-hover:bg-orange-500 group-hover:text-white transition-colors shrink-0">
                      <span className="text-sm font-black">{thread.replyCount}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>
      
      {/* Pagination Controls */}
      {data?.meta?.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-6 pb-12">
          {Array.from({ length: data.meta.totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => updateParams({ page: (i + 1).toString() })}
              className={cn("size-8 sm:size-10 rounded-xl text-sm font-bold transition-all focus-ring", page === i + 1 ? "bg-orange-500 text-white shadow-md" : "bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800")}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
