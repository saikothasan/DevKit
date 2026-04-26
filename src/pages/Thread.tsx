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
    fetchThread(); 
  };

  if (!thread) return (
    <div className="max-w-5xl mx-auto py-10 sm:py-16 px-4 w-full flex flex-col items-center animate-pulse">
      <div className="h-10 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl mb-8 self-start"></div>
      <div className="w-full bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-12 shadow-sm">
        <div className="flex gap-4 mb-8"><div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div><div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div></div>
        <div className="h-12 w-full sm:w-4/5 bg-zinc-200 dark:bg-zinc-800 rounded-xl mb-10"></div>
        <div className="space-y-4"><div className="h-5 w-full bg-zinc-200 dark:bg-zinc-800 rounded"></div><div className="h-5 w-full bg-zinc-200 dark:bg-zinc-800 rounded"></div><div className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded"></div></div>
      </div>
    </div>
  );

  return (
    <article className="max-w-5xl mx-auto md:py-8 px-4 sm:px-6 animation-fade-in w-full">
      <SeoHead title={`${thread.title} - Forum`} description={thread.content.substring(0, 160)} />
      
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <Link to="/forum" className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all w-full sm:w-fit group touch-manipulation">
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" /> Back to Board
        </Link>
        
        {(isModerator || isAuthor) && (
          <div className="flex flex-wrap items-center justify-center gap-2 bg-zinc-50 dark:bg-[#0a0a0a] p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-inner w-full sm:w-auto">
            {isModerator && (
              <>
                <button onClick={() => handleModeration('pin')} className={`flex-1 sm:flex-none flex justify-center p-3 sm:p-2.5 rounded-lg transition-all cursor-pointer touch-manipulation ${thread.isPinned ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm'}`} title="Pin Thread">
                  <Pin className="size-4 sm:size-4" />
                </button>
                <button onClick={() => handleModeration('lock')} className={`flex-1 sm:flex-none flex justify-center p-3 sm:p-2.5 rounded-lg transition-all cursor-pointer touch-manipulation ${thread.isLocked ? 'bg-red-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm'}`} title="Lock Thread">
                  <LockKeyhole className="size-4 sm:size-4" />
                </button>
              </>
            )}
            <button onClick={() => handleModeration('delete')} className="flex-1 sm:flex-none flex justify-center p-3 sm:p-2.5 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all sm:ml-1 cursor-pointer touch-manipulation" title="Wipe Vector">
              <Trash2 className="size-4 sm:size-4" />
            </button>
          </div>
        )}
      </header>

      {/* Main Thread Body */}
      <section className={`bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border rounded-3xl p-5 sm:p-8 md:p-10 shadow-xl shadow-zinc-200/20 dark:shadow-black/40 mb-10 sm:mb-12 flex flex-col sm:flex-row gap-6 md:gap-10 ${thread.isPinned ? 'border-orange-500/50 bg-gradient-to-br from-orange-50/30 to-transparent dark:from-orange-500/5 dark:to-transparent' : thread.authorIsVip ? 'border-amber-500/40 shadow-amber-500/5' : 'border-zinc-200 dark:border-zinc-800'}`}>
        
        {/* Mobile Upvotes - Shows at top for small screens */}
        <div className="flex sm:hidden items-center gap-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl self-start">
           <button onClick={() => handleVote('thread', thread.id, thread.authorId)} className={`p-2 rounded-lg transition-all ${user?.id === thread.authorId ? 'text-zinc-400 cursor-not-allowed' : 'text-zinc-500 hover:text-orange-500 hover:bg-orange-500/10 active:scale-95'}`}>
             <Flame className="size-5" />
           </button>
           <span className="font-black text-lg text-zinc-900 dark:text-zinc-100 pr-3">{thread.upvotes}</span>
        </div>

        {/* Desktop Upvotes */}
        <aside className="hidden sm:flex flex-col items-center gap-4 pt-4 shrink-0">
          <button onClick={() => handleVote('thread', thread.id, thread.authorId)} className={`p-3.5 rounded-2xl transition-all border border-transparent shadow-sm group ${user?.id === thread.authorId ? 'text-zinc-300 dark:text-zinc-700 bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed' : 'text-zinc-500 hover:text-orange-500 bg-white dark:bg-zinc-900 hover:bg-orange-500/10 hover:border-orange-500/20 cursor-pointer hover:-translate-y-1 hover:shadow-md'}`}>
            <Flame className="size-6 group-hover:scale-110 transition-transform" />
          </button>
          <span className="font-black text-2xl text-zinc-900 dark:text-zinc-100">{thread.upvotes}</span>
        </aside>

        <div className="flex-1 w-full min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5 sm:mb-6">
             {thread.isPinned && <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-orange-500/20 shadow-sm"><Pin className="size-3.5" /> Pinned</span>}
             {thread.isLocked && <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400 bg-red-500/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-red-500/20 shadow-sm"><LockKeyhole className="size-3.5" /> Locked</span>}
             {thread.hasLockedContent && <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-emerald-500/20 shadow-sm"><LockKeyhole className="size-3.5" /> Premium</span>}
             <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-1.5 shadow-sm">
               <Hash className="size-3.5" /> {formatCategory(thread.category)}
             </span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black mb-6 sm:mb-8 leading-tight sm:leading-[1.1] text-zinc-900 dark:text-white tracking-tight break-words">{thread.title}</h1>
          
          {/* Responsive Typography Wrapper */}
          <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-base sm:prose-p:text-lg prose-headings:font-bold prose-a:text-orange-500 hover:prose-a:text-orange-600 prose-pre:bg-zinc-900 dark:prose-pre:bg-black prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-2xl prose-pre:shadow-inner prose-code:text-orange-500 dark:prose-code:text-orange-400 prose-code:bg-orange-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-img:rounded-xl prose-img:w-full break-words">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{thread.content}</ReactMarkdown>
          </div>
          
          {thread.hasLockedContent && (
            <div className="mt-8 sm:mt-12 border border-orange-500/30 bg-gradient-to-br from-orange-50/80 to-white dark:from-[#110800] dark:to-[#0a0a0a] rounded-2xl sm:rounded-3xl p-5 sm:p-8 relative overflow-hidden shadow-2xl shadow-orange-500/5">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-500 to-amber-400"></div>
              {thread.lockedContent ? (
                <div className="animation-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
                      <h4 className="text-xs sm:text-sm font-black text-orange-600 dark:text-orange-500 uppercase tracking-widest flex items-center gap-2">
                        <LockKeyhole className="size-4 sm:size-5 shrink-0" /> Decrypted Payload
                      </h4>
                      {(user?.isVip || user?.role === 'admin') && user?.id !== thread.authorId && (
                         <span className="flex items-center gap-1.5 w-fit px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm">
                           <Crown className="size-3 shrink-0" /> VIP Override
                         </span>
                      )}
                  </div>
                  <div className="bg-zinc-900 dark:bg-black p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-orange-500/20 overflow-x-auto shadow-inner">
                    <pre className="text-orange-50 dark:text-orange-100 font-mono text-xs sm:text-sm whitespace-pre-wrap break-words m-0">{thread.lockedContent}</pre>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
                  <div className="text-center lg:text-left w-full">
                    <h4 className="font-extrabold text-xl sm:text-2xl text-zinc-900 dark:text-white flex items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-2"><LockKeyhole className="size-6 sm:size-8 text-orange-500 shrink-0" /> Encrypted Vector</h4>
                    <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">Requires <strong className="text-orange-500">{thread.unlockCost}</strong> reputation points to decrypt.</p>
                  </div>
                  {user ? (
                    <button onClick={handleUnlock} disabled={isUnlocking} className="shrink-0 flex w-full lg:w-auto items-center justify-center gap-2 bg-zinc-900 hover:bg-orange-500 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-orange-500 dark:hover:text-white font-bold px-6 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl transition-all shadow-xl hover:shadow-orange-500/20 active:scale-[0.98] cursor-pointer disabled:opacity-50 text-base sm:text-lg group touch-manipulation">
                      {isUnlocking ? 'Decrypting...' : <>Unlock Payload <LockKeyhole className="size-4 sm:size-5 ml-1 group-hover:hidden"/><CheckCircle2 className="size-4 sm:size-5 ml-1 hidden group-hover:block"/></>}
                    </button>
                  ) : (
                    <Link to="/login" className="shrink-0 flex w-full lg:w-auto items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl transition-all shadow-xl shadow-orange-500/20 active:scale-[0.98] text-base sm:text-lg touch-manipulation">
                      Authenticate to Unlock
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
          
          <footer className="mt-8 sm:mt-12 pt-5 sm:pt-6 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center sm:justify-between gap-4 sm:gap-6">
            <Link to={`/profile/${thread.author}`} className="flex items-center justify-center sm:justify-start w-full sm:w-auto gap-3 sm:gap-4 bg-zinc-50 dark:bg-[#0a0a0a] hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-colors px-4 sm:px-5 py-3 rounded-xl sm:rounded-2xl group shadow-sm touch-manipulation">
              <div className="size-8 sm:size-10 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center group-hover:border-orange-500/50 transition-colors shadow-sm shrink-0">
                 {thread.authorRole === 'admin' ? <Shield className="size-4 sm:size-5 text-red-500" /> : thread.authorIsVip ? <Crown className="size-4 sm:size-5 text-amber-500" /> : <User className="size-4 sm:size-5 text-zinc-400 group-hover:text-orange-500" />}
              </div>
              <div className="flex flex-col text-center sm:text-left">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1 sm:mb-1.5">Transmitted By</span>
                <span className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-orange-500 transition-colors leading-none">{thread.author}</span>
              </div>
            </Link>
            
            <div className="flex items-center justify-center w-full sm:w-auto gap-4 sm:gap-6 text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-900/50 px-4 sm:px-5 py-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <time dateTime={new Date(thread.createdAt).toISOString()} className="flex items-center gap-1.5 sm:gap-2"><Clock className="size-3.5 sm:size-4 shrink-0" /> {new Date(thread.createdAt).toLocaleDateString()}</time>
              <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 shrink-0"></span>
              <span className="flex items-center gap-1.5 sm:gap-2 text-orange-500/80"><Eye className="size-3.5 sm:size-4 shrink-0" /> {thread.views} Views</span>
            </div>
          </footer>
        </div>
      </section>

      {/* Discussion Thread */}
      <section className="mb-12 sm:mb-16">
        <header className="flex items-center justify-between mb-6 sm:mb-8 px-1 sm:px-2">
          <h3 className="font-extrabold text-2xl sm:text-3xl flex items-center gap-3 sm:gap-4 text-zinc-900 dark:text-white">
            <div className="p-1.5 sm:p-2 bg-orange-500/10 rounded-lg sm:rounded-xl border border-orange-500/20 shadow-inner"><MessageCircle className="size-5 sm:size-6 text-orange-500" /></div>
            Discussion <span className="text-zinc-400 font-medium text-xl sm:text-2xl">({thread.replyCount})</span>
          </h3>
        </header>
        
        <div className="space-y-4 sm:space-y-6">
          {thread.replies.length === 0 ? (
            <div className="bg-white/50 dark:bg-[#0a0a0a]/50 border border-zinc-200 dark:border-zinc-800 border-dashed rounded-3xl p-10 sm:p-16 text-center text-zinc-500 shadow-sm backdrop-blur-sm">
              <MessageCircle className="size-10 sm:size-12 mx-auto mb-3 sm:mb-4 opacity-20" />
              <p className="font-bold text-base sm:text-lg text-zinc-600 dark:text-zinc-400">No transmissions recorded.</p>
              <p className="text-xs sm:text-sm mt-1 sm:mt-2">Be the first entity to append to this vector.</p>
            </div>
          ) : (
            thread.replies.map(reply => (
              <article key={reply.id} className={`relative bg-white dark:bg-[#0a0a0a] border rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 md:p-10 ml-0 md:ml-12 lg:ml-16 flex flex-col sm:flex-row gap-5 sm:gap-8 transition-all hover:shadow-xl shadow-zinc-200/20 dark:shadow-black/20 ${reply.isAcceptedAnswer ? 'border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-500/5' : reply.authorIsVip ? 'border-amber-500/30' : 'border-zinc-200 dark:border-zinc-800 hover:border-orange-500/30'}`}>
                
                {reply.isAcceptedAnswer && (
                  <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-emerald-500 text-white p-1.5 sm:p-2 rounded-xl shadow-lg border-2 border-white dark:border-[#0a0a0a]" title="Accepted Output">
                    <CheckCircle2 className="size-4 sm:size-6" />
                  </div>
                )}

                {(isModerator || user?.id === reply.authorId) && (
                  <button onClick={() => handleDeleteReply(reply.id)} className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 sm:p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer shadow-sm touch-manipulation" title="Wipe Reply">
                    <Trash2 className="size-4" />
                  </button>
                )}
                
                <aside className="flex sm:flex-col items-center justify-between sm:justify-start gap-4 sm:gap-2 shrink-0 border-b sm:border-b-0 sm:border-r border-zinc-100 dark:border-zinc-800 pb-4 sm:pb-0 sm:pr-6 md:pr-8">
                  {/* Mobile Profile Display in Header equivalent spot */}
                  <div className="flex sm:hidden items-center gap-3 group bg-zinc-50 dark:bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-transparent dark:border-zinc-800">
                      <div className="size-6 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm shrink-0">
                        {reply.authorRole === 'admin' ? <Shield className="size-3 text-red-500" /> : reply.authorIsVip ? <Crown className="size-3 text-amber-500" /> : <User className="size-3 text-zinc-500" />}
                      </div>
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{reply.author}</span>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center gap-2">
                    <button onClick={() => handleVote('reply', reply.id, reply.authorId)} className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all border border-transparent shadow-sm group ${user?.id === reply.authorId ? 'text-zinc-300 dark:text-zinc-700 bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed' : 'text-zinc-500 hover:text-orange-500 bg-white dark:bg-zinc-900 hover:bg-orange-500/10 hover:border-orange-500/20 cursor-pointer hover:-translate-y-1 hover:shadow-md'}`}>
                      <Flame className="size-4 sm:size-5 group-hover:scale-110 transition-transform" />
                    </button>
                    <span className="font-black text-lg sm:text-xl text-zinc-900 dark:text-white">{reply.upvotes}</span>
                  </div>
                </aside>

                <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
                  <header className="hidden sm:flex flex-wrap items-center gap-4 mb-5 border-b border-zinc-100 dark:border-zinc-800/50 pb-4">
                    <Link to={`/profile/${reply.author}`} className="flex items-center gap-3 group bg-zinc-50 dark:bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-transparent dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
                      <div className="size-7 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm shrink-0">
                        {reply.authorRole === 'admin' ? <Shield className="size-3.5 text-red-500" /> : reply.authorIsVip ? <Crown className="size-3.5 text-amber-500" /> : <User className="size-3.5 text-zinc-500 group-hover:text-orange-500 transition-colors" />}
                      </div>
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-orange-500 transition-colors">{reply.author}</span>
                    </Link>
                    <time dateTime={new Date(reply.createdAt).toISOString()} className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="size-3.5" /> {new Date(reply.createdAt).toLocaleDateString()}
                    </time>
                  </header>

                  <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:leading-relaxed text-sm sm:text-base prose-pre:bg-zinc-900 dark:prose-pre:bg-black prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-xl prose-pre:max-w-[85vw] sm:prose-pre:max-w-full overflow-hidden break-words">
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
         <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-zinc-50 dark:bg-[#0a0a0a] rounded-[2rem] border border-zinc-200 dark:border-zinc-800 text-center shadow-inner">
           <div className="size-16 sm:size-20 bg-red-500/10 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 border border-red-500/20 shadow-inner"><ShieldAlert className="size-8 sm:size-10 text-red-500" /></div>
           <h4 className="font-black text-xl sm:text-2xl mb-2 sm:mb-3 text-zinc-900 dark:text-white tracking-tight">Vector Locked</h4>
           <p className="text-zinc-500 dark:text-zinc-400 max-w-md text-base sm:text-lg">System protocols have locked this discussion. Transmission rejected.</p>
         </div>
      ) : (
        <section className="bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl sm:rounded-[2rem] p-5 sm:p-8 md:p-10 shadow-2xl shadow-zinc-200/20 dark:shadow-black/40 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-amber-400"></div>
          <header className="flex items-center justify-between mb-6 sm:mb-8">
            <h4 className="font-black text-xl sm:text-2xl flex items-center gap-3 text-zinc-900 dark:text-white">Transmit Reply</h4>
          </header>
          {user ? (
            <form onSubmit={handleReply} className="space-y-5 sm:space-y-6">
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-[#0a0a0a] focus-within:ring-2 focus-within:ring-orange-500/50 focus-within:border-orange-500/50 transition-all shadow-inner">
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                  <button type="button" onClick={() => insertFormatting('**', '**')} className="p-2.5 sm:p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors touch-manipulation" title="Bold"><Bold className="size-4" /></button>
                  <button type="button" onClick={() => insertFormatting('*', '*')} className="p-2.5 sm:p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors touch-manipulation" title="Italic"><Italic className="size-4" /></button>
                  <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-700 mx-1 sm:mx-2 hidden sm:block"></div>
                  <button type="button" onClick={() => insertFormatting('`', '`')} className="p-2.5 sm:p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors touch-manipulation" title="Code"><Code className="size-4" /></button>
                </div>
                <textarea ref={textareaRef} required minLength={2} rows={5} placeholder="Initiate response sequence (Markdown parsed)..." value={replyContent} onChange={e => setReplyContent(e.target.value)} className="w-full bg-transparent px-4 sm:px-6 py-4 sm:py-5 text-base sm:text-sm outline-none resize-none placeholder:text-zinc-400 custom-scrollbar text-zinc-900 dark:text-zinc-100" />
              </div>
              <div className="flex justify-end pt-2">
                <button disabled={isReplying || !replyContent.trim()} className="w-full sm:w-auto flex items-center justify-center gap-3 bg-zinc-900 hover:bg-orange-500 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-orange-500 dark:hover:text-white font-bold px-8 sm:px-10 py-4 rounded-2xl transition-all duration-300 disabled:opacity-50 shadow-xl hover:shadow-orange-500/20 active:scale-[0.98] cursor-pointer text-base sm:text-lg group touch-manipulation">
                  {isReplying ? 'Transmitting...' : 'Execute Reply'} <Send className="size-4 sm:size-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 sm:p-10 bg-zinc-50 dark:bg-[#0a0a0a] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
               <div className="size-14 sm:size-16 bg-zinc-200 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 shadow-inner"><LockKeyhole className="size-6 sm:size-8 text-zinc-500" /></div>
               <p className="text-sm sm:text-base font-bold text-zinc-600 dark:text-zinc-400 mb-6 sm:mb-8 text-center">Authentication protocol required to append to this vector.</p>
               <Link to="/login" className="w-full sm:w-auto text-center px-8 sm:px-10 py-3.5 sm:py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl sm:rounded-2xl font-bold transition-all shadow-xl shadow-orange-500/20 active:scale-[0.98] text-base sm:text-lg touch-manipulation">Authenticate Entity</Link>
            </div>
          )}
        </section>
      )}
    </article>
  );
}
