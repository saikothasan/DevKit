import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Flame, Lock, Pin, Loader2, ArrowLeft, Send, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

import { SeoHead } from '@/components/SeoHead';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';

export default function Thread() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [replyContent, setReplyContent] = useState('');
  const [replyPage, setReplyPage] = useState(1);

  // Network Query Execution (Thread + Paginated Replies)
  const { data: thread, isLoading } = useQuery({
    queryKey: ['thread', id, replyPage],
    queryFn: async () => {
      const res = await fetch(`/api/forum/threads/${id}?page=${replyPage}&limit=50`);
      if (!res.ok) throw new Error('Decryption fault or vector missing');
      return res.json();
    },
    placeholderData: (prev) => prev
  });

  // Reply Transmission Mutation
  const replyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/forum/threads/${id}/replies`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Transmission failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread', id] });
      setReplyContent('');
      toast.success('Communication relayed successfully.');
    },
    onError: (err: any) => toast.error(err.message)
  });

  // Cryptographic Unlock Mutation
  const unlockMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/forum/threads/${id}/unlock`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Cryptographic exchange failed');
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Optimistically inject the unlocked content into the cache
      queryClient.setQueryData(['thread', id, replyPage], (old: any) => ({
        ...old, lockedContent: data.lockedContent
      }));
      queryClient.invalidateQueries({ queryKey: ['user'] }); // Refresh user points
      toast.success('Premium payload decrypted.');
    },
    onError: (err: any) => toast.error(err.message)
  });

  // Reputation Increment Mutation (Voting)
  const voteMutation = useMutation({
    mutationFn: async ({ type, targetId }: { type: 'thread' | 'reply', targetId: number }) => {
      const res = await fetch(`/api/forum/vote/${type}/${targetId}`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Execution blocked');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread', id] });
      toast.success('Reputation incremented.');
    },
    onError: (err: any) => toast.error(err.message)
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-500">
        <Loader2 className="size-10 animate-spin mb-4 text-orange-500" />
        <p className="font-bold text-sm tracking-widest uppercase">Decrypting Vector...</p>
      </div>
    );
  }

  if (!thread || thread.error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 bg-white/50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 border-dashed">
         <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Vector Lost</h1>
         <p className="text-zinc-500 font-medium mb-6">The requested execution path cannot be resolved.</p>
         <Link to="/" className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-orange-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg">
           <ArrowLeft className="size-4" /> Return to Grid
         </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <SeoHead title={thread.title} description={thread.content.substring(0, 150)} />

      <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
        <ArrowLeft className="size-4" /> Comm-Link Grid
      </Link>

      {/* Main Thread Payload */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
        
        <div className="p-6 md:p-8 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {thread.isPinned && <span className="flex items-center gap-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider border border-orange-500/20"><Pin className="size-3.5" /> Pinned</span>}
            {thread.isLocked && <span className="flex items-center gap-1 bg-red-500/10 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider border border-red-500/20"><Lock className="size-3.5" /> Locked</span>}
            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider border border-zinc-200 dark:border-zinc-700/50">{thread.category}</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight mb-4">{thread.title}</h1>
          
          <div className="flex items-center gap-4 text-sm font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 inline-flex">
             <Link to={`/profile/${thread.author}`} className="flex items-center gap-2 hover:text-orange-500 transition-colors">
               <span className="size-6 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center border border-zinc-300 dark:border-zinc-700 shadow-sm"><User className="size-3.5" /></span>
               <span className="text-zinc-900 dark:text-zinc-100">{thread.author}</span>
             </Link>
             <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700"></div>
             <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
             <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700"></div>
             <span className="flex items-center gap-1"><Flame className="size-4 text-orange-500" /> {thread.upvotes} Rep</span>
          </div>
        </div>

        <div className="p-6 md:p-8 whitespace-pre-wrap font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed text-[15px]">
           {thread.content}
        </div>

        {/* Cryptographic Premium Vector */}
        {thread.hasLockedContent && (
           <div className="p-6 md:p-8 bg-zinc-50 dark:bg-zinc-900/30 border-t border-zinc-200 dark:border-zinc-800">
             {thread.lockedContent ? (
               <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Lock className="size-24 text-amber-500" /></div>
                 <h3 className="font-black text-amber-600 dark:text-amber-500 text-sm mb-4 flex items-center gap-2 uppercase tracking-widest"><Lock className="size-4" /> Decrypted Premium Payload</h3>
                 <div className="whitespace-pre-wrap font-medium text-amber-900 dark:text-amber-100/90 relative z-10">{thread.lockedContent}</div>
               </motion.div>
             ) : (
               <div className="bg-zinc-900 dark:bg-black border border-zinc-800 rounded-2xl p-8 text-center relative overflow-hidden shadow-2xl">
                 <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                 <div className="relative z-10">
                   <div className="inline-flex items-center justify-center size-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-4 shadow-inner">
                     <Lock className="size-7" />
                   </div>
                   <h3 className="text-xl font-black text-white mb-2">Encrypted Execution Vector</h3>
                   <p className="text-zinc-400 text-sm font-medium mb-6 max-w-sm mx-auto">This payload requires a reputation expenditure to decrypt and access.</p>
                   
                   {user ? (
                     <button onClick={() => unlockMutation.mutate()} disabled={unlockMutation.isPending} className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-50 active:scale-95">
                       {unlockMutation.isPending ? <Loader2 className="size-5 animate-spin" /> : <Lock className="size-5" />}
                       Decrypt Payload ({thread.unlockCost} pts)
                     </button>
                   ) : (
                     <Link to="/login" className="inline-flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-md active:scale-95">Authenticate to Decrypt</Link>
                   )}
                 </div>
               </div>
             )}
           </div>
        )}

        <div className="p-4 bg-zinc-100 dark:bg-zinc-900/80 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
           <button onClick={() => voteMutation.mutate({ type: 'thread', targetId: thread.id })} disabled={!user || voteMutation.isPending || user.username === thread.author} className="flex items-center gap-2 bg-white dark:bg-zinc-800 hover:bg-orange-500 hover:text-white hover:border-orange-500 dark:hover:bg-orange-500 text-zinc-600 dark:text-zinc-300 font-bold px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-all disabled:opacity-50 disabled:hover:bg-white dark:disabled:hover:bg-zinc-800 shadow-sm active:scale-95">
             <Flame className="size-4" /> Endorse Vector
           </button>
        </div>
      </motion.div>

      {/* Communications Matrix (Replies) */}
      <div className="space-y-4 pt-6">
        <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2"><MessageSquare className="size-5 text-orange-500" /> Execution Logs ({thread.meta.totalReplies})</h3>
        
        <AnimatePresence mode="popLayout">
          {thread.replies?.map((reply: any, i: number) => (
            <motion.div key={reply.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm flex gap-4">
              <div className="shrink-0 flex flex-col items-center gap-3">
                 <div className="size-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-inner">
                   <User className="size-5 text-zinc-400" />
                 </div>
                 <button onClick={() => voteMutation.mutate({ type: 'reply', targetId: reply.id })} disabled={!user || voteMutation.isPending || user.username === reply.author} className="flex flex-col items-center group disabled:opacity-50 transition-opacity">
                   <div className="size-8 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center group-hover:bg-orange-500 group-hover:border-orange-500 group-hover:text-white transition-all shadow-sm">
                     <Flame className="size-4 text-zinc-400 group-hover:text-white transition-colors" />
                   </div>
                   <span className="text-xs font-black mt-1 text-zinc-500 dark:text-zinc-400">{reply.upvotes}</span>
                 </button>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Link to={`/profile/${reply.author}`} className="font-bold text-sm text-zinc-900 dark:text-zinc-100 hover:text-orange-500 transition-colors">{reply.author}</Link>
                  <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500">• {formatDistanceToNow(new Date(reply.createdAt))} ago</span>
                </div>
                <div className="whitespace-pre-wrap font-medium text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                  {reply.content}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Reply Pagination Controls */}
        {thread.meta.totalReplies > thread.meta.replyLimit && (
          <div className="flex items-center justify-center gap-4 py-4">
             <button onClick={() => setReplyPage(p => Math.max(1, p - 1))} disabled={replyPage === 1} className="p-2 rounded-xl bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white disabled:opacity-50 shadow-sm active:scale-95 transition-transform"><ChevronLeft className="size-5" /></button>
             <span className="text-sm font-bold text-zinc-500">Page {replyPage}</span>
             <button onClick={() => setReplyPage(p => p + 1)} disabled={thread.replies.length < thread.meta.replyLimit} className="p-2 rounded-xl bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white disabled:opacity-50 shadow-sm active:scale-95 transition-transform"><ChevronRight className="size-5" /></button>
          </div>
        )}

        {/* Reply Input Vector */}
        {!thread.isLocked ? (
           user ? (
            <div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm relative mt-8 overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
               <textarea 
                 value={replyContent} 
                 onChange={(e) => setReplyContent(e.target.value)} 
                 placeholder="Formulate your transmission..." 
                 rows={3} 
                 className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3.5 text-sm font-medium text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all shadow-inner resize-none mb-3" 
               />
               <div className="flex justify-end">
                 <button onClick={() => replyMutation.mutate()} disabled={!replyContent.trim() || replyMutation.isPending} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-50 active:scale-95">
                   {replyMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Transmit
                 </button>
               </div>
            </div>
           ) : (
            <div className="text-center py-10 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 mt-8">
              <p className="text-zinc-500 font-bold mb-4">You must authenticate to interface with this thread.</p>
              <Link to="/login" className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-50 dark:text-zinc-900 font-bold px-6 py-3 rounded-xl transition-all shadow-md active:scale-95">Authenticate Now</Link>
            </div>
           )
        ) : (
          <div className="text-center py-6 bg-red-500/5 border border-red-500/20 rounded-2xl mt-8">
             <div className="inline-flex items-center justify-center size-10 rounded-full bg-red-500/10 text-red-500 mb-2"><Lock className="size-5" /></div>
             <p className="text-red-600 dark:text-red-400 font-black text-sm uppercase tracking-widest">Vector Locked</p>
             <p className="text-red-500/70 dark:text-red-400/70 font-medium text-xs mt-1">Further communication has been restricted.</p>
          </div>
        )}
      </div>
    </div>
  );
}
