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

type Reply = { 
  id: number; content: string; author: string; authorId: number; 
  upvotes: number; isAcceptedAnswer?: boolean; createdAt: string; 
  authorIsVip: boolean; authorRole: string; 
};

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
  const [notFound, setNotFound] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isModerator = user?.role === 'admin' || user?.role === 'moderator';
  const isAuthor = user?.username === thread?.author;

  const fetchThread = () => {
    fetch(`/api/forum/threads/${id}`)
      .then(res => res.json() as Promise<ThreadDetail & { error?: string }>)
      .then(data => { 
        if (data.error) {
          if (data.error === 'Target vector not found.') setNotFound(true);
          else toast(data.error, 'error');
        } else {
          setThread(data as ThreadDetail);
        }
      })
      .catch(() => {
        toast('Failed to establish connection with the central node.', 'error');
      });
  };

  useEffect(() => { fetchThread(); }, [id]);

  const handleVote = async (type: 'thread' | 'reply', targetId: number, authorId: number) => {
    if (!thread) return;
    if (!user) { toast("Authentication required to execute reputation protocol.", "error"); return; }
    if (user.id === authorId) { toast("Self-voting protocol is strictly rejected.", "error"); return; }
    
    try {
      const res = await fetch(`/api/forum/vote/${type}/${targetId}`, { method: 'POST' });
      const data = await res.json() as { error?: string; success?: boolean; message?: string };
      
      if (res.ok && data.success) {
          if (type === 'thread') {
              setThread({ ...thread, upvotes: thread.upvotes + 1 });
          } else {
              setThread({ ...thread, replies: thread.replies.map(r => r.id === targetId ? { ...r, upvotes: r.upvotes + 1 } : r) });
          }
      } else {
          toast(data.error || "Cannot process transaction at this time.", "error");
      }
    } catch (err) {
      toast("Execution fault during reputation update.", "error");
    }
  };

  const handleModeration = async (action: 'pin' | 'lock' | 'delete') => {
    if (!thread) return;
    if (action === 'delete') {
      if (!confirm('Confirm permanent deletion of this vector? Irreversible.')) return;
      
      try {
        const res = await fetch(`/api/forum/threads/${thread.id}`, { method: 'DELETE' });
        if (res.ok) navigate('/forum');
        else toast('Failed to wipe vector.', 'error');
      } catch {
        toast('Network fault during deletion.', 'error');
      }
      return;
    }

    try {
      const res = await fetch(`/api/forum/threads/${thread.id}/${action}`, { method: 'PATCH' });
      if (res.ok) {
        const updated = await res.json() as { isPinned: boolean; isLocked: boolean };
        setThread({ ...thread, isPinned: updated.isPinned, isLocked: updated.isLocked });
      } else {
         toast(`Failed to execute ${action} protocol.`, 'error');
      }
    } catch {
      toast('Network fault during state mutation.', 'error');
    }
  };

  const handleDeleteReply = async (replyId: number) => {
    if (!confirm('Permanently wipe this transmission?')) return;
    try {
      const res = await fetch(`/api/forum/replies/${replyId}`, { method: 'DELETE' });
      if (res.ok && thread) {
        setThread({ 
          ...thread, 
          replyCount: thread.replyCount - 1, 
          replies: thread.replies.filter(r => r.id !== replyId) 
        });
      } else {
        toast('Failed to clear transmission.', 'error');
      }
    } catch {
      toast('Network fault during transmission deletion.', 'error');
    }
  };

  const handleUnlock = async () => {
    if (!thread) return;
    setIsUnlocking(true);
    try {
      const res = await fetch(`/api/forum/threads/${thread.id}/unlock`, { method: 'POST' });
      const data = await res.json() as { success?: boolean; lockedContent?: string; error?: string };
      
      if (data.success && data.lockedContent) {
        setThread({ ...thread, lockedContent: data.lockedContent });
        await refreshUser();
        toast("Payload Decrypted and Secured.", "success");
      } else {
        toast(data.error || 'Decryption sequence failed.', 'error');
      }
    } catch {
      toast("System execution failure during decryption.", "error");
    } finally { 
      setIsUnlocking(false); 
    }
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
    try {
      const res = await fetch(`/api/forum/threads/${id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent })
      });
      
      if (res.ok) {
        setReplyContent('');
        fetchThread(); 
      } else {
        const data = await res.json() as { error?: string };
        toast(data.error || 'Failed to transmit reply.', 'error');
      }
    } catch {
      toast('Network failure during transmission.', 'error');
    } finally {
      setIsReplying(false);
    }
  };

  if (notFound) return (
    <div className="max-w-3xl mx-auto py-24 text-center">
        <ShieldAlert className="size-16 text-zinc-500 mx-auto mb-6 opacity-50" />
        <h1 className="text-3xl font-bold mb-4 text-[var(--text-primary)]">Target Vector Missing</h1>
        <p className="text-[var(--text-secondary)] mb-8">The requested thread could not be located in the central database. It may have been relocated or wiped.</p>
        <Link to="/forum" className="px-6 py-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] hover:border-[var(--orange)] transition-colors inline-flex items-center gap-2">
            <ArrowLeft className="size-4" /> Return to Hub
        </Link>
    </div>
  );

  if (!thread) return (
    <div className="max-w-5xl mx-auto py-16 px-4 flex flex-col items-center animate-pulse">
      <div className="h-10 w-48 bg-[var(--surface-raised)] rounded-xl mb-8 self-start"></div>
      <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8 md:p-12 shadow-sm">
        <div className="flex gap-4 mb-8"><div className="h-6 w-24 bg-[var(--surface-raised)] rounded-md"></div><div className="h-6 w-32 bg-[var(--surface-raised)] rounded-md"></div></div>
        <div className="h-12 w-4/5 bg-[var(--surface-raised)] rounded-xl mb-10"></div>
        <div className="space-y-4"><div className="h-5 w-full bg-[var(--surface-raised)] rounded"></div><div className="h-5 w-full bg-[var(--surface-raised)] rounded"></div><div className="h-5 w-3/4 bg-[var(--surface-raised)] rounded"></div></div>
      </div>
    </div>
  );

  return (
    <article className="max-w-5xl mx-auto md:py-8 px-4 sm:px-6 animation-fade-in">
      <SeoHead title={`${thread.title} - Forum`} description={thread.content.substring(0, 160)} />
      
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-[var(--border)] pb-6">
        <Link to="/forum" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--orange)] shadow-sm transition-all w-fit group">
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" /> Back to Board
        </Link>
        
        {(isModerator || isAuthor) && (
          <div className="flex items-center gap-2 bg-[var(--surface-raised)] p-1.5 rounded-xl border border-[var(--border)] shadow-inner">
            {isModerator && (
              <>
                <button onClick={() => handleModeration('pin')} className={`p-2.5 rounded-lg transition-all cursor-pointer ${thread.isPinned ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-500 hover:text-[var(--text-primary)] hover:bg-[var(--surface)] hover:shadow-sm'}`} title="Pin Thread">
                  <Pin className="size-4" />
                </button>
                <button onClick={() => handleModeration('lock')} className={`p-2.5 rounded-lg transition-all cursor-pointer ${thread.isLocked ? 'bg-red-500 text-white shadow-md' : 'text-zinc-500 hover:text-[var(--text-primary)] hover:bg-[var(--surface)] hover:shadow-sm'}`} title="Lock Thread">
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
      <section className={`bg-[var(--surface)] backdrop-blur-xl border rounded-[2rem] p-6 md:p-10 shadow-xl shadow-zinc-200/20 dark:shadow-black/40 mb-12 flex gap-6 md:gap-10 ${thread.isPinned ? 'border-orange-500/50 bg-gradient-to-br from-[var(--orange-dim)] to-transparent' : thread.authorIsVip ? 'border-amber-500/40 shadow-amber-500/5' : 'border-[var(--border)]'}`}>
        <aside className="hidden sm:flex flex-col items-center gap-4 pt-4 shrink-0">
          <button onClick={() => handleVote('thread', thread.id, thread.authorId)} className={`p-3.5 rounded-2xl transition-all border border-transparent shadow-sm group ${user?.id === thread.authorId ? 'text-zinc-500 bg-[var(--surface-raised)] cursor-not-allowed opacity-50' : 'text-zinc-500 hover:text-[var(--orange)] bg-[var(--surface-raised)] hover:border-[var(--orange-border)] cursor-pointer hover:-translate-y-1 hover:shadow-md'}`}>
            <Flame className="size-6 group-hover:scale-110 transition-transform" />
          </button>
          <span className="font-black text-2xl text-[var(--text-primary)]">{thread.upvotes}</span>
        </aside>

        <div className="flex-1 w-full overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 mb-6">
             {thread.isPinned && <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-orange-500 bg-[var(--orange-dim)] px-3 py-1.5 rounded-lg border border-[var(--orange-border)] shadow-sm"><Pin className="size-3.5" /> Pinned</span>}
             {thread.isLocked && <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 shadow-sm"><LockKeyhole className="size-3.5" /> Locked</span>}
             {thread.hasLockedContent && <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 shadow-sm"><LockKeyhole className="size-3.5" /> Premium</span>}
             <span className="px-3 py-1.5 bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border)] text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-1.5 shadow-sm">
               <Hash className="size-3.5" /> {formatCategory(thread.category)}
             </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black mb-8 text-balance leading-tight text-[var(--text-primary)] tracking-tight">{thread.title}</h1>
          
          <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-lg prose-headings:font-bold prose-a:text-[var(--orange)] hover:prose-a:text-orange-600 prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-[var(--border-strong)] prose-pre:rounded-2xl prose-pre:shadow-inner prose-code:text-[var(--orange)] prose-code:bg-[var(--orange-dim)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{thread.content}</ReactMarkdown>
          </div>
          
          {thread.hasLockedContent && (
            <div className="mt-12 border border-[var(--orange-border)] bg-[var(--surface)] rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-orange-500/5">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-500 to-amber-400"></div>
              {thread.lockedContent ? (
                <div className="animation-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <h4 className="text-sm font-black text-[var(--orange)] uppercase tracking-widest flex items-center gap-2">
                        <LockKeyhole className="size-5" /> Decrypted Payload Secured
                      </h4>
                      {(user?.isVip || user?.role === 'admin') && user?.id !== thread.authorId && (
                         <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm">
                           <Crown className="size-3" /> VIP Override Active
                         </span>
                      )}
                  </div>
                  <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-[var(--border-strong)] overflow-x-auto shadow-inner">
                    <pre className="text-orange-50 font-mono text-sm whitespace-pre-wrap break-all m-0">{thread.lockedContent}</pre>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-center md:text-left">
                    <h4 className="font-extrabold text-2xl text-[var(--text-primary)] flex items-center justify-center md:justify-start gap-3 mb-2"><LockKeyhole className="size-8 text-[var(--orange)]" /> Encrypted Vector</h4>
                    <p className="text-base text-[var(--text-secondary)]">Requires <strong className="text-[var(--orange)]">{thread.unlockCost}</strong> reputation points to decrypt this node.</p>
                  </div>
                  {user ? (
                    <button onClick={handleUnlock} disabled={isUnlocking} className="shrink-0 flex w-full md:w-auto items-center justify-center gap-2 bg-[var(--text-primary)] hover:bg-[var(--orange)] text-[var(--bg)] font-bold px-10 py-5 rounded-2xl transition-all shadow-xl hover:shadow-orange-500/20 active:scale-[0.98] cursor-pointer disabled:opacity-50 text-lg group">
                      {isUnlocking ? 'Decrypting...' : <>Unlock Payload <LockKeyhole className="size-5 ml-1 group-hover:hidden"/><CheckCircle2 className="size-5 ml-1 hidden group-hover:block"/></>}
                    </button>
                  ) : (
                    <Link to="/login" className="shrink-0 flex w-full md:w-auto items-center justify-center gap-2 bg-[var(--orange)] hover:opacity-90 text-[#fff] font-bold px-10 py-5 rounded-2xl transition-all shadow-xl shadow-orange-500/20 active:scale-[0.98] text-lg">
                      Authenticate to Unlock
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
          
          <footer className="mt-12 pt-6 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-6">
            <Link to={`/profile/${thread.author}`} className="flex items-center gap-4 bg-[var(--surface-raised)] border border-[var(--border)] hover:border-[var(--orange)] transition-colors px-5 py-3 rounded-2xl group shadow-sm">
              <div className="size-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center transition-colors shadow-sm">
                 {thread.authorRole === 'admin' ? <Shield className="size-5 text-red-500" /> : thread.authorIsVip ? <Crown className="size-5 text-amber-500" /> : <User className="size-5 text-zinc-500 group-hover:text-[var(--orange)]" />}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1.5">Transmitted By</span>
                <span className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--orange)] transition-colors leading-none">{thread.author}</span>
              </div>
            </Link>
            <div className="flex items-center gap-6 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest bg-[var(--surface-raised)] px-5 py-3 rounded-xl border border-[var(--border)]">
              <time dateTime={new Date(thread.createdAt).toISOString()} className="flex items-center gap-2"><Clock className="size-4" /> {new Date(thread.createdAt).toLocaleString()}</time>
              <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]"></span>
              <span className="flex items-center gap-2 text-[var(--orange)] opacity-80"><Eye className="size-4" /> {thread.views} Views</span>
            </div>
          </footer>
        </div>
      </section>

      {/* Discussion Thread */}
      <section className="mb-16">
        <header className="flex items-center justify-between mb-8 px-2">
          <h3 className="font-extrabold text-3xl flex items-center gap-4 text-[var(--text-primary)]">
            <div className="p-2 bg-[var(--orange-dim)] rounded-xl border border-[var(--orange-border)] shadow-inner"><MessageCircle className="size-6 text-[var(--orange)]" /></div>
            Discussion <span className="text-[var(--text-muted)] font-medium text-2xl">({thread.replyCount})</span>
          </h3>
        </header>
        
        <div className="space-y-6">
          {thread.replies.length === 0 ? (
            <div className="bg-[var(--surface-raised)] border border-[var(--border)] border-dashed rounded-[2rem] p-16 text-center shadow-sm">
              <MessageCircle className="size-12 mx-auto mb-4 opacity-20 text-[var(--text-muted)]" />
              <p className="font-bold text-lg text-[var(--text-secondary)]">No transmissions recorded.</p>
              <p className="text-sm mt-2 text-[var(--text-muted)]">Be the first entity to append to this vector.</p>
            </div>
          ) : (
            thread.replies.map(reply => (
              <article key={reply.id} className={`relative bg-[var(--surface)] border rounded-[2rem] p-6 md:p-10 ml-0 md:ml-16 flex flex-col sm:flex-row gap-8 transition-all hover:shadow-xl shadow-zinc-200/20 dark:shadow-black/20 ${reply.isAcceptedAnswer ? 'border-emerald-500/50 bg-emerald-500/5' : reply.authorIsVip ? 'border-amber-500/30' : 'border-[var(--border)] hover:border-[var(--orange-border)]'}`}>
                
                {reply.isAcceptedAnswer && (
                  <div className="absolute -top-4 -right-4 bg-emerald-500 text-[#fff] p-2 rounded-xl shadow-lg border-2 border-[var(--bg)]" title="Accepted Output">
                    <CheckCircle2 className="size-6" />
                  </div>
                )}

                {(isModerator || user?.id === reply.authorId) && (
                  <button onClick={() => handleDeleteReply(reply.id)} className="absolute top-6 right-6 p-2.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer shadow-sm" title="Wipe Reply">
                    <Trash2 className="size-4" />
                  </button>
                )}
                <aside className="flex sm:flex-col items-center justify-between sm:justify-start gap-4 sm:gap-2 shrink-0 border-b sm:border-b-0 sm:border-r border-[var(--border)] pb-6 sm:pb-0 sm:pr-8">
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={() => handleVote('reply', reply.id, reply.authorId)} className={`p-3 rounded-2xl transition-all border border-transparent shadow-sm group ${user?.id === reply.authorId ? 'text-zinc-500 bg-[var(--surface-raised)] cursor-not-allowed opacity-50' : 'text-zinc-500 hover:text-[var(--orange)] bg-[var(--surface-raised)] hover:border-[var(--orange-border)] cursor-pointer hover:-translate-y-1 hover:shadow-md'}`}>
                      <Flame className="size-5 group-hover:scale-110 transition-transform" />
                    </button>
                    <span className="font-black text-xl text-[var(--text-primary)]">{reply.upvotes}</span>
                  </div>
                </aside>
                <div className="flex-1 overflow-hidden flex flex-col">
                  <header className="flex flex-wrap items-center gap-4 mb-5 border-b border-[var(--border)] pb-4">
                    <Link to={`/profile/${reply.author}`} className="flex items-center gap-3 group bg-[var(--surface-raised)] px-3 py-1.5 rounded-lg border border-transparent hover:border-[var(--border-strong)] transition-colors">
                      <div className="size-7 rounded-full bg-[var(--surface)] flex items-center justify-center shadow-sm">
                        {reply.authorRole === 'admin' ? <Shield className="size-3.5 text-red-500" /> : reply.authorIsVip ? <Crown className="size-3.5 text-amber-500" /> : <User className="size-3.5 text-[var(--text-muted)] group-hover:text-[var(--orange)] transition-colors" />}
                      </div>
                      <span className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--orange)] transition-colors">{reply.author}</span>
                    </Link>
                    <time dateTime={new Date(reply.createdAt).toISOString()} className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="size-3.5" /> {new Date(reply.createdAt).toLocaleDateString()}
                    </time>
                  </header>
                  <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:leading-relaxed text-base prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-[var(--border-strong)] prose-pre:rounded-xl">
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
         <div className="flex flex-col items-center justify-center p-12 bg-[var(--surface-raised)] rounded-[2rem] border border-[var(--border)] text-center shadow-inner">
           <div className="size-20 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20 shadow-inner"><ShieldAlert className="size-10 text-red-500" /></div>
           <h4 className="font-black text-2xl mb-3 text-[var(--text-primary)] tracking-tight">Vector Locked</h4>
           <p className="text-[var(--text-secondary)] max-w-md text-lg">System protocols have locked this discussion. Transmission rejected.</p>
         </div>
      ) : (
        <section className="bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] rounded-[2rem] p-6 md:p-10 shadow-2xl shadow-zinc-200/20 dark:shadow-black/40 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-amber-400"></div>
          <header className="flex items-center justify-between mb-8">
            <h4 className="font-black text-2xl flex items-center gap-3 text-[var(--text-primary)]">Transmit Reply</h4>
          </header>
          {user ? (
            <form onSubmit={handleReply} className="space-y-6">
              <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--surface-raised)] focus-within:ring-2 focus-within:ring-[var(--orange-dim)] focus-within:border-[var(--orange-border)] transition-all shadow-inner">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)] backdrop-blur-sm">
                  <button type="button" onClick={() => insertFormatting('**', '**')} className="p-2 text-zinc-500 hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-raised)] cursor-pointer transition-colors" title="Bold"><Bold className="size-4" /></button>
                  <button type="button" onClick={() => insertFormatting('*', '*')} className="p-2 text-zinc-500 hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-raised)] cursor-pointer transition-colors" title="Italic"><Italic className="size-4" /></button>
                  <div className="w-px h-5 bg-[var(--border-strong)] mx-2"></div>
                  <button type="button" onClick={() => insertFormatting('`', '`')} className="p-2 text-zinc-500 hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-raised)] cursor-pointer transition-colors" title="Code"><Code className="size-4" /></button>
                </div>
                <textarea ref={textareaRef} required minLength={2} rows={6} placeholder="Initiate response sequence (Markdown parsed)..." value={replyContent} onChange={e => setReplyContent(e.target.value)} className="w-full bg-transparent px-6 py-5 text-base outline-none resize-none placeholder:text-[var(--text-muted)] custom-scrollbar text-[var(--text-primary)]" />
              </div>
              <div className="flex justify-end pt-2">
                <button disabled={isReplying || !replyContent.trim()} className="flex items-center justify-center gap-3 bg-[var(--text-primary)] hover:bg-[var(--orange)] text-[var(--bg)] font-bold px-10 py-4 rounded-2xl transition-all duration-300 disabled:opacity-50 shadow-xl hover:shadow-orange-500/20 active:scale-[0.98] cursor-pointer text-lg group">
                  {isReplying ? 'Transmitting...' : 'Execute Reply'} <Send className="size-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center p-10 bg-[var(--surface-raised)] rounded-2xl border border-[var(--border)] shadow-inner">
               <div className="size-16 bg-[var(--surface)] rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-[var(--border)]"><LockKeyhole className="size-8 text-[var(--text-muted)]" /></div>
               <p className="text-base font-bold text-[var(--text-secondary)] mb-8">Authentication protocol required to append to this vector.</p>
               <Link to="/login" className="px-10 py-4 bg-[var(--orange)] hover:opacity-90 text-[#fff] rounded-2xl font-bold transition-all shadow-xl shadow-orange-500/20 active:scale-[0.98] text-lg">Authenticate Entity</Link>
            </div>
          )}
        </section>
      )}
    </article>
  );
}
