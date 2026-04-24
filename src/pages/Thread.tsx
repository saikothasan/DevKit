import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, Unlock, Zap, Eye, MessageSquare, ShieldAlert, 
  User, Flame, Clock, Loader2, ChevronLeft, Send 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/utils/apiClient';
import { cn } from '@/utils/cn';

export function Thread() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [replyContent, setReplyContent] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Core Data Vector Retrieval
  const { data: thread, isLoading, isError } = useQuery({
    queryKey: ['thread', id],
    queryFn: () => api.get(`/forum/threads/${id}`).then(res => res.json()),
    retry: 1
  });

  // Cryptographic Payload Unlock Mutation
  const unlockMutation = useMutation({
    mutationFn: () => api.post(`/forum/threads/${id}/unlock`),
    onMutate: () => setIsDecrypting(true),
    onSuccess: async (data) => {
      // Optimistic cache injection
      queryClient.setQueryData(['thread', id], (old: any) => ({
        ...old, 
        lockedContent: data.lockedContent 
      }));
      // Sync global user state to reflect point deduction
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onSettled: () => setIsDecrypting(false)
  });

  // Reply Transmission Mutation
  const replyMutation = useMutation({
    mutationFn: (content: string) => api.post(`/forum/threads/${id}/replies`, { content }),
    onSuccess: () => {
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['thread', id] });
    }
  });

  // Reputation Execution (Upvote) Mutation with Optimistic UI
  const voteMutation = useMutation({
    mutationFn: ({ type, targetId }: { type: 'thread' | 'reply', targetId: number }) => 
      api.post(`/forum/vote/${type}/${targetId}`),
    onMutate: async ({ type, targetId }) => {
      await queryClient.cancelQueries({ queryKey: ['thread', id] });
      const previousData = queryClient.getQueryData(['thread', id]);

      queryClient.setQueryData(['thread', id], (old: any) => {
        if (!old) return old;
        if (type === 'thread') {
          return { ...old, upvotes: old.upvotes + 1 };
        } else {
          return {
            ...old,
            replies: old.replies.map((r: any) => r.id === targetId ? { ...r, upvotes: r.upvotes + 1 } : r)
          };
        }
      });
      return { previousData };
    },
    onError: (err, variables, context: any) => {
      queryClient.setQueryData(['thread', id], context.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['thread', id] });
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto w-full space-y-6 animate-pulse">
        <div className="h-10 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        <div className="h-64 bg-zinc-200 dark:bg-zinc-800/50 rounded-3xl" />
        <div className="h-32 bg-zinc-200 dark:bg-zinc-800/50 rounded-3xl" />
      </div>
    );
  }

  if (isError || !thread) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 glass-panel rounded-3xl">
        <ShieldAlert className="size-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Vector Untraceable</h2>
        <p className="text-zinc-500">The requested thread has been redacted or does not exist.</p>
        <Link to="/forum" className="mt-6 inline-block bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold px-6 py-2.5 rounded-xl transition-all hover:bg-orange-500 dark:hover:bg-orange-500">
          Return to Grid
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8 pb-12">
      {/* Navigation Breadcrumb */}
      <Link to="/forum" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-orange-500 transition-colors focus-ring rounded-lg px-2 py-1 -ml-2">
        <ChevronLeft className="size-4" /> Back to Operations
      </Link>

      {/* Primary Payload Viewer */}
      <article className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden">
        {thread.isPinned && <div className="absolute top-0 right-0 border-t-[40px] border-r-[40px] border-t-red-500/20 border-r-transparent" />}
        
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase tracking-widest rounded-md border border-orange-500/20 shadow-sm">
              {thread.category}
            </span>
            <div className="flex items-center gap-4 text-xs font-semibold text-zinc-400">
              <span className="flex items-center gap-1.5"><Eye className="size-3.5" /> {thread.views} Executions</span>
              <span className="flex items-center gap-1.5"><Clock className="size-3.5" /> {new Date(thread.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-6 leading-tight">
            {thread.title}
          </h1>
          
          <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-[#0f0f0f] border border-zinc-200 dark:border-zinc-800 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 border border-zinc-300 dark:border-zinc-700">
                <User className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Transmitted By</span>
                <Link to={`/profile/${thread.author}`} className="text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:text-orange-500 transition-colors">
                  {thread.author}
                </Link>
              </div>
            </div>
            
            <button 
              onClick={() => voteMutation.mutate({ type: 'thread', targetId: thread.id })}
              disabled={!user || user.id === thread.authorId}
              className="flex items-center gap-2 bg-white dark:bg-[#1c1c1c] hover:bg-orange-500/10 hover:text-orange-500 hover:border-orange-500/30 border border-zinc-200 dark:border-zinc-700 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm focus-ring disabled:opacity-50 disabled:pointer-events-none group"
            >
              <Flame className={cn("size-4", thread.upvotes > 0 ? "text-amber-500" : "text-zinc-400 group-hover:text-orange-500")} /> 
              {thread.upvotes}
            </button>
          </div>
        </header>
        
        <div className="prose prose-zinc dark:prose-invert max-w-none mb-10 text-zinc-700 dark:text-zinc-300 leading-relaxed text-[15px] whitespace-pre-wrap">
          {thread.content}
        </div>

        {/* Cryptographic Execution Vector (Locked Content Logic) */}
        {thread.hasLockedContent && (
          <div className="mt-8 border-t border-zinc-200 dark:border-zinc-800 pt-8">
            {thread.lockedContent ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#141414] border border-green-500/30 rounded-2xl p-6 relative overflow-hidden shadow-[0_4px_30px_rgba(34,197,94,0.1)] group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500 transform group-hover:scale-110">
                  <Unlock className="size-24 text-green-500" />
                </div>
                <div className="flex items-center gap-2 text-green-400 font-bold text-sm uppercase tracking-wider mb-4 relative z-10">
                  <ShieldAlert className="size-4" /> Decrypted Payload
                </div>
                <div className="text-zinc-300 font-mono text-sm leading-relaxed relative z-10 whitespace-pre-wrap bg-black/40 p-4 rounded-xl border border-zinc-800/80">
                  {thread.lockedContent}
                </div>
              </motion.div>
            ) : (
              <div className="bg-gradient-to-br from-zinc-900 to-[#0a0a0a] border border-zinc-800 rounded-2xl p-8 text-center relative overflow-hidden shadow-2xl group">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
                <div className="absolute -top-12 -right-12 size-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-orange-500/20 transition-colors duration-700" />
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="size-16 bg-zinc-800/80 rounded-2xl flex items-center justify-center border border-zinc-700/50 mb-5 shadow-inner">
                    <Lock className="size-8 text-orange-500 drop-shadow-[0_0_12px_rgba(243,128,32,0.6)]" />
                  </div>
                  <h3 className="text-white font-black text-xl tracking-tight mb-2">Encrypted Telemetry Present</h3>
                  <p className="text-zinc-400 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                    Execution requires reputation expenditure. 80% of cryptographic points are automatically transferred to the author node.
                  </p>
                  
                  {user ? (
                    <button 
                      onClick={() => unlockMutation.mutate()}
                      disabled={isDecrypting || user.points < thread.unlockCost}
                      className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(243,128,32,0.3)] active:scale-95 disabled:opacity-50 disabled:grayscale focus-ring flex items-center gap-2"
                    >
                      {isDecrypting ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4 fill-white/20" />}
                      Execute Decryption (-{thread.unlockCost} pts)
                    </button>
                  ) : (
                    <Link to="/login" className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors focus-ring">
                      <Lock className="size-4" /> Authentication Required to Decrypt
                    </Link>
                  )}
                  {user && user.points < thread.unlockCost && (
                    <p className="text-red-400 text-xs mt-4 font-semibold bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                      Insufficient points (You have {user.points} pts)
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </article>

      {/* Reply Engine Pipeline */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <MessageSquare className="size-5 text-orange-500" />
          <h3 className="text-xl font-black text-zinc-900 dark:text-white">Execution Logs ({thread.meta?.totalReplies || 0})</h3>
        </div>

        {/* Reply Submission Node */}
        {user ? (
          <form 
            onSubmit={(e) => { e.preventDefault(); if (replyContent.trim()) replyMutation.mutate(replyContent); }}
            className="glass-panel p-4 md:p-6 rounded-3xl relative"
          >
            <div className="relative">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Initialize response sequence..."
                className="w-full min-h-[120px] bg-zinc-50 dark:bg-[#0f0f0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm focus-ring text-zinc-900 dark:text-zinc-100 transition-all custom-scrollbar resize-y"
                required
              />
              <div className="absolute bottom-4 right-4">
                <button 
                  type="submit" 
                  disabled={replyMutation.isPending || !replyContent.trim()}
                  className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-orange-500 dark:hover:bg-orange-500 hover:text-white font-bold size-10 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus-ring group"
                >
                  {replyMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="glass-panel p-6 rounded-3xl text-center border-dashed">
            <p className="text-sm font-semibold text-zinc-500 mb-3">You must be authenticated to transmit to the ledger.</p>
            <Link to="/login" className="inline-flex bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold px-6 py-2.5 rounded-xl transition-all hover:opacity-90 focus-ring text-sm">
              Initialize Connection
            </Link>
          </div>
        )}

        {/* Reply Grid Execution */}
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {thread.replies?.map((reply: any) => (
              <motion.div 
                key={reply.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800/80 p-5 md:p-6 rounded-3xl shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                      <User className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <Link to={`/profile/${reply.author}`} className="text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:text-orange-500 transition-colors">
                        {reply.author}
                      </Link>
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        {new Date(reply.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => voteMutation.mutate({ type: 'reply', targetId: reply.id })}
                    disabled={!user || user.id === reply.authorId}
                    className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-orange-500 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-orange-500/10 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 transition-colors focus-ring disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Flame className={cn("size-3", reply.upvotes > 0 ? "text-amber-500" : "")} /> 
                    {reply.upvotes}
                  </button>
                </div>
                
                <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {reply.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {thread.replies?.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="size-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 font-semibold text-sm">No execution logs detected. Be the first to transmit.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
