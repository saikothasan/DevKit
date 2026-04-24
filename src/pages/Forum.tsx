import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MessageSquare, Lock, Pin, Search, Eye, Filter, Plus, Flame } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/utils/apiClient';
import { cn } from '@/utils/cn';

export function Forum() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = parseInt(searchParams.get('page') || '1');
  const category = searchParams.get('category') || 'all';
  const q = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(q);

  const { data, isLoading } = useQuery({
    queryKey: ['threads', { page, category, q }],
    queryFn: () => api.get(`/forum/threads?page=${page}&category=${category}&q=${encodeURIComponent(q)}`).then(res => res.json())
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ page: '1', category, q: searchInput });
  };

  const categories = ['all', 'general', 'releases', 'tutorials', 'support'];

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      {/* Utility Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
        <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
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

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto custom-scrollbar pb-2 md:pb-0">
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shrink-0">
            {categories.map(c => (
              <button 
                key={c}
                onClick={() => setSearchParams({ page: '1', category: c, q })}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all focus-ring", category === c ? "bg-white dark:bg-[#1c1c1c] text-orange-500 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300")}
              >
                {c}
              </button>
            ))}
          </div>
          
          {user && (
            <Link to="/forum/new" className="shrink-0 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-orange-500 dark:hover:bg-orange-500 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-md active:scale-95 focus-ring">
              <Plus className="size-4" /> New Payload
            </Link>
          )}
        </div>
      </div>

      {/* Grid Execution */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse h-24 bg-zinc-200 dark:bg-zinc-800/50 rounded-2xl" />
          ))
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-3xl">
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
              <Link to={`/forum/thread/${thread.id}`} className="group block bg-white dark:bg-[#141414] hover:bg-zinc-50 dark:hover:bg-[#1c1c1c] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 transition-all focus-ring">
                <div className="flex items-center justify-between gap-4">
                  
                  {/* Left Metadata & Title */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {thread.isPinned && <Pin className="size-3.5 text-red-500 fill-red-500/20" />}
                      <span className="px-2 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[9px] font-bold uppercase tracking-widest rounded border border-orange-500/20 shrink-0">
                        {thread.category}
                      </span>
                      <span className="truncate text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        Deployed by <span className="text-zinc-900 dark:text-zinc-300 font-bold">{thread.author}</span>
                      </span>
                    </div>
                    <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 truncate group-hover:text-orange-500 transition-colors">
                      {thread.title}
                    </h3>
                  </div>

                  {/* Right Analytics */}
                  <div className="flex items-center gap-6 shrink-0">
                    {thread.hasLockedContent && (
                      <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded-md border border-orange-500/20" title={`Unlock Cost: ${thread.unlockCost} pts`}>
                        <Lock className="size-3.5" /> {thread.unlockCost}
                      </div>
                    )}
                    <div className="hidden md:flex flex-col items-end gap-0.5 text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5 text-xs font-semibold"><Eye className="size-3.5" /> {thread.views}</span>
                      <span className="flex items-center gap-1.5 text-xs font-semibold"><Flame className="size-3.5 text-amber-500" /> {thread.upvotes}</span>
                    </div>
                    <div className="flex items-center justify-center size-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 group-hover:bg-orange-500 group-hover:text-white transition-colors">
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
        <div className="flex justify-center gap-2 pt-4">
          {Array.from({ length: data.meta.totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setSearchParams({ page: (i + 1).toString(), category, q })}
              className={cn("size-8 rounded-lg text-xs font-bold transition-all focus-ring", page === i + 1 ? "bg-orange-500 text-white shadow-md" : "bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800")}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
