import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MessageSquare, Flame, Lock, Pin, Loader2, Plus, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SeoHead } from '@/components/SeoHead';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';

export default function Forum() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  // Enterprise Query Engine: Auto-caches and background refetches D1 Edge Data
  const { data: threads, isLoading } = useQuery({
    queryKey: ['threads', { category, search }],
    queryFn: async () => {
      const url = new URL('/api/forum/threads', window.location.origin);
      if (category !== 'all') url.searchParams.set('category', category);
      if (search) url.searchParams.set('q', search);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Data transmission fault');
      return res.json();
    }
  });

  const categories = [
    { id: 'all', label: 'All Vectors' },
    { id: 'general', label: 'General' },
    { id: 'scripts', label: 'Code & Scripts' },
    { id: 'methods', label: 'Methods' },
    { id: 'accounts', label: 'Accounts' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <SeoHead title="Comm-Link Grid" description="Connect with the DevKit infrastructure network." />
      
      {/* Header Matrix */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0a0a0a] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
        <div className="absolute -right-20 -top-20 size-40 bg-orange-500/10 blur-3xl rounded-full pointer-events-none"></div>
        
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3 tracking-tight">
            <MessageSquare className="size-6 text-orange-500" /> Comm-Link Grid
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mt-1">Access decentralized knowledge vectors and network intel.</p>
        </div>

        {user && (
          <Link to="/forum/new" className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg active:scale-95 shrink-0">
            <Plus className="size-4" /> Initialize Thread
          </Link>
        )}
      </div>

      {/* Filter Matrix */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex w-full sm:w-auto overflow-x-auto gap-2 pb-2 sm:pb-0 custom-scrollbar hide-scrollbar-mobile">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                "whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold transition-all border shrink-0",
                category === cat.id 
                  ? "bg-zinc-900 border-zinc-900 text-white dark:bg-white dark:border-white dark:text-zinc-900 shadow-md" 
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-orange-500/50 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72 ml-auto shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Query network..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all shadow-sm placeholder:font-medium placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Data Visualization Grid */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Loader2 className="size-8 animate-spin mb-4 text-orange-500" />
            <p className="font-bold text-sm tracking-widest uppercase">Syncing Vectors...</p>
          </div>
        ) : threads?.data?.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white/50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 border-dashed">
            <div className="inline-flex items-center justify-center size-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-4">
              <Search className="size-5" />
            </div>
            <h3 className="text-zinc-900 dark:text-white font-bold mb-1">No execution paths found</h3>
            <p className="text-zinc-500 text-sm">Modify search parameters or initialize a new thread.</p>
          </motion.div>
        ) : (
          threads?.data?.map((thread: any, i: number) => (
            <motion.div
              key={thread.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
            >
              <Link 
                to={`/forum/${thread.id}`}
                className="block bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800/80 p-5 rounded-2xl hover:border-orange-500/50 dark:hover:border-orange-500/50 transition-all hover:shadow-md group relative overflow-hidden"
              >
                {thread.isPinned && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-500/20 to-transparent pointer-events-none rounded-tr-2xl"></div>}
                
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {thread.isPinned && <span className="flex items-center gap-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-orange-500/20"><Pin className="size-3" /> Pinned</span>}
                      {thread.isLocked && <span className="flex items-center gap-1 bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-red-500/20"><Lock className="size-3" /> Locked</span>}
                      <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-zinc-200 dark:border-zinc-700/50">{thread.category}</span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-orange-500 transition-colors">
                      {thread.title}
                    </h3>
                    
                    <div className="flex items-center gap-3 mt-3 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5"><span className="size-5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center border border-zinc-300 dark:border-zinc-700"><User className="size-3" /></span> {thread.author}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
                    <div className="flex flex-col items-center min-w-[3rem]">
                      <span className="text-orange-500 font-black text-sm flex items-center gap-1"><Flame className="size-3.5" />{thread.upvotes}</span>
                      <span className="text-[9px] uppercase font-bold text-zinc-400 mt-0.5 tracking-wider">Rep</span>
                    </div>
                    <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800"></div>
                    <div className="flex flex-col items-center min-w-[3rem]">
                      <span className="text-zinc-900 dark:text-zinc-100 font-black text-sm flex items-center gap-1"><MessageSquare className="size-3.5 text-zinc-400" />{thread.replyCount}</span>
                      <span className="text-[9px] uppercase font-bold text-zinc-400 mt-0.5 tracking-wider">Comm</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
