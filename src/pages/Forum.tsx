import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MessageSquare, Flame, Lock, Pin, Loader2, Plus, Search, X, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

import { SeoHead } from '@/components/SeoHead';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';

// Client-Side Security Schema for Thread Initialization
const createThreadSchema = z.object({
  title: z.string().min(5, 'Title requires 5+ characters').max(100),
  content: z.string().min(10, 'Payload requires 10+ characters').max(20000),
  category: z.string().min(2),
  lockedContent: z.string().max(20000).optional(),
  unlockCost: z.number().min(0).max(10000).default(0)
});
type CreateThreadForm = z.infer<typeof createThreadSchema>;

const categories = [
  { id: 'all', label: 'All Vectors' },
  { id: 'general', label: 'General' },
  { id: 'scripts', label: 'Code & Scripts' },
  { id: 'methods', label: 'Methods' },
  { id: 'accounts', label: 'Accounts' }
];

export default function Forum() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Network Query Execution
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['threads', { category, search, page }],
    queryFn: async () => {
      const url = new URL('/api/forum/threads', window.location.origin);
      if (category !== 'all') url.searchParams.set('category', category);
      if (search) url.searchParams.set('q', search);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', '15');
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Data transmission fault');
      return res.json();
    },
    placeholderData: (previousData) => previousData // Prevents UI flashing during pagination
  });

  // Initialization Mutation
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<CreateThreadForm>({
    resolver: zodResolver(createThreadSchema),
    defaultValues: { category: 'general', unlockCost: 0 }
  });

  const hasLockedContent = watch('lockedContent')?.length > 0;

  const createMutation = useMutation({
    mutationFn: async (payload: CreateThreadForm) => {
      const res = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Execution failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      setIsCreateModalOpen(false);
      reset();
      toast.success('Thread compiled and integrated successfully.');
    },
    onError: (err: any) => toast.error(err.message)
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      <SeoHead title="Comm-Link Grid" description="Access decentralized knowledge vectors and network intel." />
      
      {/* Header Matrix */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0a0a0a] p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
        <div className="absolute -right-20 -top-20 size-40 bg-orange-500/10 blur-3xl rounded-full pointer-events-none"></div>
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3 tracking-tight">
            <MessageSquare className="size-6 text-orange-500" /> Comm-Link Grid
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mt-1">Access decentralized knowledge vectors.</p>
        </div>
        {user ? (
          <button onClick={() => setIsCreateModalOpen(true)} className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg active:scale-95 shrink-0">
            <Plus className="size-4" /> Initialize Thread
          </button>
        ) : (
          <Link to="/login" className="inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 font-bold px-6 py-3 rounded-xl transition-all shadow-lg active:scale-95 shrink-0">
            Authenticate to Post
          </Link>
        )}
      </div>

      {/* Filter & Search Dashboard */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex w-full md:w-auto overflow-x-auto gap-2 pb-2 md:pb-0 custom-scrollbar hide-scrollbar-mobile">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setCategory(cat.id); setPage(1); }}
              className={cn(
                "whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold transition-all border shrink-0",
                category === cat.id ? "bg-zinc-900 border-zinc-900 text-white dark:bg-white dark:border-white dark:text-zinc-900 shadow-md" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-orange-500/50 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72 md:ml-auto shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Query network..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all shadow-sm placeholder:font-medium placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Data Grid Rendering */}
      <div className="space-y-3 relative">
        {isFetching && !isLoading && (
           <div className="absolute top-2 right-4 z-10">
             <Loader2 className="size-4 animate-spin text-orange-500" />
           </div>
        )}
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Loader2 className="size-8 animate-spin mb-4 text-orange-500" />
            <p className="font-bold text-sm tracking-widest uppercase">Syncing Vectors...</p>
          </div>
        ) : data?.data?.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white/50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 border-dashed">
            <div className="inline-flex items-center justify-center size-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-4"><Search className="size-5" /></div>
            <h3 className="text-zinc-900 dark:text-white font-bold mb-1">No execution paths found</h3>
            <p className="text-zinc-500 text-sm">Modify parameters or establish a new thread.</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {data?.data?.map((thread: any, i: number) => (
              <motion.div key={thread.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2, delay: i * 0.03 }}>
                <Link to={`/forum/${thread.id}`} className="block bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800/80 p-5 rounded-2xl hover:border-orange-500/50 transition-all hover:shadow-md group relative overflow-hidden">
                  {thread.isPinned && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-500/20 to-transparent pointer-events-none rounded-tr-2xl"></div>}
                  
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {thread.isPinned && <span className="flex items-center gap-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-orange-500/20"><Pin className="size-3" /> Pinned</span>}
                        {thread.hasLockedContent && <span className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-amber-500/20"><Lock className="size-3" /> Premium ({thread.unlockCost} pts)</span>}
                        {thread.isLocked && <span className="flex items-center gap-1 bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-red-500/20"><Lock className="size-3" /> Locked</span>}
                        <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-zinc-200 dark:border-zinc-700/50">{thread.category}</span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-orange-500 transition-colors">{thread.title}</h3>
                      
                      <div className="flex items-center gap-3 mt-3 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1.5"><span className="size-5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center border border-zinc-300 dark:border-zinc-700"><User className="size-3" /></span> {thread.author}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline">{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
                      <div className="flex flex-col items-center min-w-[3rem]">
                        <span className="text-orange-500 font-black text-sm flex items-center gap-1"><Flame className="size-3.5" />{thread.upvotes}</span>
                      </div>
                      <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800"></div>
                      <div className="flex flex-col items-center min-w-[3rem]">
                        <span className="text-zinc-900 dark:text-zinc-100 font-black text-sm flex items-center gap-1"><MessageSquare className="size-3.5 text-zinc-400" />{thread.replyCount}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination Controls */}
      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-6">
           <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"><ChevronLeft className="size-5" /></button>
           <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">Page {page} of {data.meta.totalPages}</span>
           <button onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))} disabled={page === data.meta.totalPages} className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"><ChevronRight className="size-5" /></button>
        </div>
      )}

      {/* Hardware-Accelerated Thread Creation Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="relative w-full max-w-2xl bg-white dark:bg-[#0a0a0a] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2"><Plus className="size-5 text-orange-500" /> Initialize Thread</h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"><X className="size-5 text-zinc-500" /></button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <form id="create-thread-form" onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 ml-1">Vector Category</label>
                    <select {...register('category')} className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all shadow-inner">
                      {categories.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 ml-1">Thread Identifier (Title)</label>
                    <input {...register('title')} placeholder="Enter a descriptive title..." className={cn("w-full bg-zinc-50 dark:bg-zinc-900/50 border rounded-xl px-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-white outline-none transition-all shadow-inner", errors.title ? "border-red-500/50" : "border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/50")} />
                    {errors.title && <p className="text-[10px] text-red-500 font-bold px-1">{errors.title.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 ml-1">Public Payload (Markdown Supported)</label>
                    <textarea {...register('content')} placeholder="Initialize network transmission..." rows={5} className={cn("w-full bg-zinc-50 dark:bg-zinc-900/50 border rounded-xl px-4 py-3.5 text-sm font-medium text-zinc-900 dark:text-white outline-none transition-all shadow-inner resize-none", errors.content ? "border-red-500/50" : "border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/50")} />
                    {errors.content && <p className="text-[10px] text-red-500 font-bold px-1">{errors.content.message}</p>}
                  </div>

                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2">
                       <Lock className="size-4 text-amber-500" />
                       <h3 className="font-bold text-amber-600 dark:text-amber-500 text-sm">Cryptographic Premium Payload (Optional)</h3>
                    </div>
                    <div className="space-y-1">
                      <textarea {...register('lockedContent')} placeholder="Content encrypted behind a reputation cost barrier..." rows={3} className="w-full bg-white dark:bg-zinc-950/50 border border-amber-500/20 rounded-xl px-4 py-3.5 text-sm font-medium text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all shadow-inner resize-none" />
                      {errors.lockedContent && <p className="text-[10px] text-red-500 font-bold px-1">{errors.lockedContent.message}</p>}
                    </div>
                    {hasLockedContent && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1">
                        <label className="text-xs font-bold text-amber-700 dark:text-amber-500/80 ml-1">Reputation Unlocking Cost</label>
                        <input type="number" {...register('unlockCost', { valueAsNumber: true })} min={0} className="w-full bg-white dark:bg-zinc-950/50 border border-amber-500/20 rounded-xl px-4 py-3.5 text-sm font-bold text-amber-900 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all shadow-inner" />
                        {errors.unlockCost && <p className="text-[10px] text-red-500 font-bold px-1">{errors.unlockCost.message}</p>}
                      </motion.div>
                    )}
                  </div>
                </form>
              </div>
              
              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 shrink-0 flex justify-end gap-3">
                 <button onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">Abort</button>
                 <button form="create-thread-form" disabled={createMutation.isPending} className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-400 text-white transition-all disabled:opacity-50 shadow-md active:scale-95">
                   {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Compile Execution
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
