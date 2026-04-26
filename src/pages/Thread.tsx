import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Clock, MessageCircle, Send, Flame, Bold, Italic, Code, Pin, LockKeyhole, Trash2, ShieldAlert, Hash, Eye, Crown, Shield, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SeoHead } from '@/components/SeoHead';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const formatCategory = (cat: string) => {
  if (cat === 'all') return 'All';
  if (cat === 'bin-list') return 'BIN List';
  if (cat === 'vcc') return 'VCC';
  if (cat === 'bins') return 'BINS';
  if (cat === 'redeem-coupons-keys') return 'Redeem / Coupons / Keys';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
};

type Reply = { id: number; content: string; author: string; authorId: number; upvotes: number; isAcceptedAnswer?: boolean; createdAt: string; authorIsVip: boolean; authorRole: string; };
type ThreadDetail = { 
  id: number; title: string; content: string; category: string; author: string; authorId: number; 
  upvotes: number; views: number; replyCount: number; isPinned: boolean; isLocked: boolean; createdAt: string; 
  hasLockedContent?: boolean; lockedContent?: string; unlockCost?: number;
  authorIsVip: boolean; authorRole: string;
  replies: Reply[]; 
};

export default function Thread() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isModerator = user?.role === 'admin' || user?.role === 'moderator';
  const isAuthor = user?.username === thread?.author;

  const fetchThread = () => {
    fetch(`/api/forum/threads/${id}`)
      .then(res => res.json() as Promise<ThreadDetail & { error?: string }>)
      .then(data => { if (!data.error) setThread(data as ThreadDetail); })
      .catch(console.error);
  };

  useEffect(() => { fetchThread(); }, [id]);

  const handleVote = async (type: 'thread' | 'reply', targetId: number, authorId: number) => {
    if (!thread) return;
    if (!user) { toast("Authentication required to execute reputation protocol.", "error"); return; }
    if (user.id === authorId) { toast("Self-voting protocol is strictly rejected.", "error"); return; }
    
    const res = await fetch(`/api/forum/vote/${type}/${targetId}`, { method: 'POST' });
    if (res.ok) {
        if (type === 'thread') {
            setThread({ ...thread, upvotes: thread.upvotes + 1 });
        } else {
            setThread({ ...thread, replies: thread.replies.map(r => r.id === targetId ? { ...r, upvotes: r.upvotes + 1 } : r) });
        }
    } else {
        const errorData = await res.json() as any;
        toast(errorData.error || "Cannot process transaction at this time.", "error");
    }
  };

  const handleModeration = async (action: 'pin' | 'lock' | 'delete') => {
    if (!thread) return;
    if (action === 'delete') {
      if (!confirm('Confirm permanent deletion of this vector? Irreversible.')) return;
      await fetch(`/api/forum/threads/${thread.id}`, { method: 'DELETE' });
      navigate('/forum');
      return;
    }

    const res = await fetch(`/api/forum/threads/${thread.id}/${action}`, { method: 'PATCH' });
    if (res.ok) {
      const updated = await res.json() as ThreadDetail;
      setThread({ ...thread, isPinned: updated.isPinned, isLocked: updated.isLocked });
    }
  };

  const handleDeleteReply = async (replyId: number) => {
    if (!confirm('Permanently wipe this transmission?')) return;
    const res = await fetch(`/api/forum/replies/${replyId}`, { method: 'DELETE' });
    if (res.ok && thread) {
      setThread({ 
        ...thread, 
        replyCount: thread.replyCount - 1, 
        replies: thread.replies.filter(r => r.id !== replyId) 
      });
    }
  };

  const handleUnlock = async () => {
    if (!thread) return;
    setIsUnlocking(true);
    try {
      const res = await fetch(`/api/forum/threads/${thread.id}/unlock`, { method: 'POST' });
      const data = await res.json() as any;
      if (data.success) {
        setThread({ ...thread, lockedContent: data.lockedContent });
        await refreshUser();
        toast("Payload Decrypted and Secured.", "success");
      } else toast(data.error || 'Decryption sequence failed.', 'error');
    } finally { setIsUnlocking(false); }
  };

  const insertFormatting = (prefix: string, suffix: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = replyContent;
    const selected = text.substring(start, end) || 'text';
    const newText = text.substring(0, start) + prefix + selected + suffix + text.substring(end);
    setReplyContent(newText);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyContent.trim()) return;
    setIsReplying(true);
    await fetch(`/api/forum/threads/${id}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: replyContent })
    });
    setReplyContent('');
    setIsReplying(false);
    fetchThread(); // Reloads full thread to grab accurate DB metrics
  };

  if (!thread) return (
    <div className="max-w-5xl mx-auto py-16 px-4 flex flex-col items-center animate-pulse">
      <div className="h-10 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl mb-8 self-start"></div>
      <div className="w-full bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 md:p-12 shadow-sm">
        <div className="flex gap-4 mb-8"><div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div><div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div></div>
        <div className="h-12 w-4/5 bg-zinc-200 dark:bg-zinc-800 rounded-xl mb-10"></div>
        <div className="space-y-4"><div className="h-5 w-full bg-zinc-200 dark:bg-zinc-800 rounded"></div><div className="h-5 w-full bg-zinc-200 dark:bg-zinc-800 rounded"></div><div className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded"></div></div>
      </div>
    </div>
  );

  return (
    <article className="max-w-5xl mx-auto md:py-8 px-4 sm:px-6 animation-fade-in">
      <SeoHead title={`${thread.title} - Forum`} description={thread.content.substring(0, 160)} />
      
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <Link to="/forum" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all w-fit group">
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" /> Back to Board
        </Link>
        
        {(isModerator || isAuthor) && (
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-[#0a0a0a] p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
            {isModerator && (
              <>
                <button onClick={() => handleModeration('pin')} className={`p-2.5 rounded-lg transition-all cursor-pointer ${thread.isPinned ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm'}`} title="Pin Thread">
                  <Pin className="size-4" />
                </button>
                <button onClick={() => handleModeration('lock')} className={`p-2.5 rounded-lg transition-all cursor-pointer ${thread.isLocked ? 'bg-red-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm'}`} title="Lock Thread">
                  <LockKeyhole className="size-4" />
                </button>
              </>
            )}
            <button onClick={() => handleModeration('delete')} className="p-2.5 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all ml-1 cursor-pointer" title="Wipe Vector">
              <Trash2 className="size-4" />
            </button>
          </div>
        )}
      </header>

      {/* Main Thread Body */}
      <section className={`bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border rounded-[2rem] p-6 md:p-10 shadow-xl shadow-zinc-200/20 dark:shadow-black/40 mb-12 flex gap-6 md:gap-10 ${thread.isPinned ? 'border-orange-500/50 bg-gradient-to-br from-orange-50/30 to-transparent dark:from-orange-500/5 dark:to-transparent' : thread.authorIsVip ? 'border-amber-500/40 shadow-amber-500/5' : 'border-zinc-200 dark:border-zinc-800'}`}>
        <aside className="hidden sm:flex flex-col items-center gap-4 pt-4 shrink-0">
          <button onClick={() => handleVote('thread', thread.id, thread.authorId)} className={`p-3.5 rounded-2xl transition-all border border-transparent shadow-sm group ${user?.id === thread.authorId ? 'text-zinc-300 dark:text-zinc-700 bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed' : 'text-zinc-500 hover:text-orange-500 bg-white dark:bg-zinc-900 hover:bg-orange-500/10 hover:border-orange-500/20 cursor-pointer hover:-translate-y-1 hover:shadow-md'}`}>
            <Flame className="size-6 group-hover:scale-110 transition-transform" />
          </button>
          <span className="font-black text-2xl text-zinc-900 dark:text-zinc-100">{thread.upvotes}</span>
        </aside>

        <div className="flex-1 w-full overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 mb-6">
             {thread.isPinned && <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 shadow-sm"><Pin className="size-3.5" /> Pinned</span>}
             {thread.isLocked && <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 shadow-sm"><LockKeyhole className="size-3.5" /> Locked</span>}
             {thread.hasLockedContent && <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 shadow-sm"><LockKeyhole className="size-3.5" /> Premium</span>}
             <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-1.5 shadow-sm">
               <Hash className="size-3.5" /> {formatCategory(thread.category)}
             </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black mb-8 text-balance leading-tight text-zinc-900 dark:text-white tracking-tight">{thread.title}</h1>
          
          {/* Enhanced Markdown Typography */}
          <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-lg prose-headings:font-bold prose-a:text-orange-500 hover:prose-a:text-orange-600 prose-pre:bg-zinc-900 dark:prose-pre:bg-black prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-2xl prose-pre:shadow-inner prose-code:text-orange-500 dark:prose-code:text-orange-400 prose-code:bg-orange-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{thread.content}</ReactMarkdown>
          </div>
          
          {thread.hasLockedContent && (
            <div className="mt-12 border border-orange-500/30 bg-gradient-to-br from-orange-50/80 to-white dark:from-[#110800] dark:to-[#0a0a0a] rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-orange-500/5">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-500 to-amber-400"></div>
              {thread.lockedContent ? (
                <div className="animation-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <h4 className="text-sm font-black text-orange-600 dark:text-orange-500 uppercase tracking-widest flex items-center gap-2">
                        <LockKeyhole className="size-5" /> Decrypted Payload Secured
                      </h4>
                      {(user?.isVip || user?.role === 'admin') && user?.id !== thread.authorId && (
                         <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm">
                           <Crown className="size-3" /> VIP Override Active
                         </span>
                      )}
                  </div>
                  <div className="bg-zinc-900 dark:bg-black p-6 rounded-2xl border border-orange-500/20 overflow-x-auto shadow-inner">
                    <pre className="text-orange-50 dark:text-orange-100 font-mono text-sm whitespace-pre-wrap break-all m-0">{thread.lockedContent}</pre>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-center md:text-left">
                    <h4 className="font-extrabold text-2xl text-zinc-900 dark:text-white flex items-center justify-center md:justify-start gap-3 mb-2"><LockKeyhole className="size-8 text-orange-500" /> Encrypted Vector</h4>
                    <p className="text-base text-zinc-600 dark:text-zinc-400">Requires <strong className="text-orange-500">{thread.unlockCost}</strong> reputation points to decrypt this node.</p>
                  </div>
                  {user ? (
                    <button onClick={handleUnlock} disabled={isUnlocking} className="shrink-0 flex w-full md:w-auto items-center justify-center gap-2 bg-zinc-900 hover:bg-orange-500 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-orange-500 dark:hover:text-white font-bold px-10 py-5 rounded-2xl transition-all shadow-xl hover:shadow-orange-500/20 active:scale-[0.98] cursor-pointer disabled:opacity-50 text-lg group">
                      {isUnlocking ? 'Decrypting...' : <>Unlock Payload <LockKeyhole className="size-5 ml-1 group-hover:hidden"/><CheckCircle2 className="size-5 ml-1 hidden group-hover:block"/></>}
                    </button>
                  ) : (
                    <Link to="/login" className="shrink-0 flex w-full md:w-auto items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-5 rounded-2xl transition-all shadow-xl shadow-orange-500/20 active:scale-[0.98] text-lg">
                      Authenticate to Unlock
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
          
          <footer className="mt-12 pt-6 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-6">
            <Link to={`/profile/${thread.author}`} className="flex items-center gap-4 bg-zinc-50 dark:bg-[#0a0a0a] hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-colors px-5 py-3 rounded-2xl group shadow-sm">
              <div className="size-10 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center group-hover:border-orange-500/50 transition-colors shadow-sm">
                 {thread.authorRole === 'admin' ? <Shield className="size-5 text-red-500" /> : thread.authorIsVip ? <Crown className="size-5 text-amber-500" /> : <User className="size-5 text-zinc-400 group-hover:text-orange-500" />}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1.5">Transmitted By</span>
                <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-orange-500 transition-colors leading-none">{thread.author}</span>
              </div>
            </Link>
            <div className="flex items-center gap-6 text-xs font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-900/50 px-5 py-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <time dateTime={new Date(thread.createdAt).toISOString()} className="flex items-center gap-2"><Clock className="size-4" /> {new Date(thread.createdAt).toLocaleString()}</time>
              <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
              <span className="flex items-center gap-2 text-orange-500/80"><Eye className="size-4" /> {thread.views} Views</span>
            </div>
          </footer>
        </div>
      </section>

      {/* Discussion Thread */}
      <section className="mb-16">
        <header className="flex items-center justify-between mb-8 px-2">
          <h3 className="font-extrabold text-3xl flex items-center gap-4 text-zinc-900 dark:text-white">
            <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20 shadow-inner"><MessageCircle className="size-6 text-orange-500" /></div>
            Discussion <span className="text-zinc-400 font-medium text-2xl">({thread.replyCount})</span>
          </h3>
        </header>
        
        <div className="space-y-6">
          {thread.replies.length === 0 ? (
            <div className="bg-white/50 dark:bg-[#0a0a0a]/50 border border-zinc-200 dark:border-zinc-800 border-dashed rounded-[2rem] p-16 text-center text-zinc-500 shadow-sm backdrop-blur-sm">
              <MessageCircle className="size-12 mx-auto mb-4 opacity-20" />
              <p className="font-bold text-lg text-zinc-600 dark:text-zinc-400">No transmissions recorded.</p>
              <p className="text-sm mt-2">Be the first entity to append to this vector.</p>
            </div>
          ) : (
            thread.replies.map(reply => (
              <article key={reply.id} className={`relative bg-white dark:bg-[#0a0a0a] border rounded-[2rem] p-6 md:p-10 ml-0 md:ml-16 flex flex-col sm:flex-row gap-8 transition-all hover:shadow-xl shadow-zinc-200/20 dark:shadow-black/20 ${reply.isAcceptedAnswer ? 'border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-500/5' : reply.authorIsVip ? 'border-amber-500/30' : 'border-zinc-200 dark:border-zinc-800 hover:border-orange-500/30'}`}>
                
                {reply.isAcceptedAnswer && (
                  <div className="absolute -top-4 -right-4 bg-emerald-500 text-white p-2 rounded-xl shadow-lg border-2 border-white dark:border-[#0a0a0a]" title="Accepted Output">
                    <CheckCircle2 className="size-6" />
                  </div>
                )}

                {(isModerator || user?.id === reply.authorId) && (
                  <button onClick={() => handleDeleteReply(reply.id)} className="absolute top-6 right-6 p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer shadow-sm" title="Wipe Reply">
                    <Trash2 className="size-4" />
                  </button>
                )}
                <aside className="flex sm:flex-col items-center justify-between sm:justify-start gap-4 sm:gap-2 shrink-0 border-b sm:border-b-0 sm:border-r border-zinc-100 dark:border-zinc-800 pb-6 sm:pb-0 sm:pr-8">
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={() => handleVote('reply', reply.id, reply.authorId)} className={`p-3 rounded-2xl transition-all border border-transparent shadow-sm group ${user?.id === reply.authorId ? 'text-zinc-300 dark:text-zinc-700 bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed' : 'text-zinc-500 hover:text-orange-500 bg-white dark:bg-zinc-900 hover:bg-orange-500/10 hover:border-orange-500/20 cursor-pointer hover:-translate-y-1 hover:shadow-md'}`}>
                      <Flame className="size-5 group-hover:scale-110 transition-transform" />
                    </button>
                    <span className="font-black text-xl text-zinc-900 dark:text-white">{reply.upvotes}</span>
                  </div>
                </aside>
                <div className="flex-1 overflow-hidden flex flex-col">
                  <header className="flex flex-wrap items-center gap-4 mb-5 border-b border-zinc-100 dark:border-zinc-800/50 pb-4">
                    <Link to={`/profile/${reply.author}`} className="flex items-center gap-3 group bg-zinc-50 dark:bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-transparent dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
                      <div className="size-7 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                        {reply.authorRole === 'admin' ? <Shield className="size-3.5 text-red-500" /> : reply.authorIsVip ? <Crown className="size-3.5 text-amber-500" /> : <User className="size-3.5 text-zinc-500 group-hover:text-orange-500 transition-colors" />}
                      </div>
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-orange-500 transition-colors">{reply.author}</span>
                    </Link>
                    <time dateTime={new Date(reply.createdAt).toISOString()} className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="size-3.5" /> {new Date(reply.createdAt).toLocaleDateString()}
                    </time>
                  </header>
                  <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:leading-relaxed text-base prose-pre:bg-zinc-900 dark:prose-pre:bg-black prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-xl">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{reply.content}</ReactMarkdown>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* Reply Formulation Vector */}
      {thread.isLocked && !isModerator ? (
         <div className="flex flex-col items-center justify-center p-12 bg-zinc-50 dark:bg-[#0a0a0a] rounded-[2rem] border border-zinc-200 dark:border-zinc-800 text-center shadow-inner">
           <div className="size-20 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20 shadow-inner"><ShieldAlert className="size-10 text-red-500" /></div>
           <h4 className="font-black text-2xl mb-3 text-zinc-900 dark:text-white tracking-tight">Vector Locked</h4>
           <p className="text-zinc-500 dark:text-zinc-400 max-w-md text-lg">System protocols have locked this discussion. Transmission rejected.</p>
         </div>
      ) : (
        <section className="bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 md:p-10 shadow-2xl shadow-zinc-200/20 dark:shadow-black/40 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-amber-400"></div>
          <header className="flex items-center justify-between mb-8">
            <h4 className="font-black text-2xl flex items-center gap-3 text-zinc-900 dark:text-white">Transmit Reply</h4>
          </header>
          {user ? (
            <form onSubmit={handleReply} className="space-y-6">
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-[#0a0a0a] focus-within:ring-2 focus-within:ring-orange-500/50 focus-within:border-orange-500/50 transition-all shadow-inner">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                  <button type="button" onClick={() => insertFormatting('**', '**')} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors" title="Bold"><Bold className="size-4" /></button>
                  <button type="button" onClick={() => insertFormatting('*', '*')} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors" title="Italic"><Italic className="size-4" /></button>
                  <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-700 mx-2"></div>
                  <button type="button" onClick={() => insertFormatting('`', '`')} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors" title="Code"><Code className="size-4" /></button>
                </div>
                <textarea ref={textareaRef} required minLength={2} rows={6} placeholder="Initiate response sequence (Markdown parsed)..." value={replyContent} onChange={e => setReplyContent(e.target.value)} className="w-full bg-transparent px-6 py-5 text-base outline-none resize-none placeholder:text-zinc-400 custom-scrollbar text-zinc-900 dark:text-zinc-100" />
              </div>
              <div className="flex justify-end pt-2">
                <button disabled={isReplying || !replyContent.trim()} className="flex items-center justify-center gap-3 bg-zinc-900 hover:bg-orange-500 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-orange-500 dark:hover:text-white font-bold px-10 py-4 rounded-2xl transition-all duration-300 disabled:opacity-50 shadow-xl hover:shadow-orange-500/20 active:scale-[0.98] cursor-pointer text-lg group">
                  {isReplying ? 'Transmitting...' : 'Execute Reply'} <Send className="size-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center p-10 bg-zinc-50 dark:bg-[#0a0a0a] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
               <div className="size-16 bg-zinc-200 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-6 shadow-inner"><LockKeyhole className="size-8 text-zinc-500" /></div>
               <p className="text-base font-bold text-zinc-600 dark:text-zinc-400 mb-8">Authentication protocol required to append to this vector.</p>
               <Link to="/login" className="px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-orange-500/20 active:scale-[0.98] text-lg">Authenticate Entity</Link>
            </div>
          )}
        </section>
      )}
    </article>
  );
}
