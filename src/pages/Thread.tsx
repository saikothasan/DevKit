import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Clock, MessageCircle, Send, Flame, Bold, Italic, Code, Pin, LockKeyhole, Trash2, ShieldAlert, Hash, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SeoHead } from '../components/SeoHead';
import { useAuth } from '../context/AuthContext';

const formatCategory = (cat: string) => {
  if (cat === 'all') return 'All';
  if (cat === 'bin-list') return 'BIN List';
  if (cat === 'vcc') return 'VCC';
  if (cat === 'bins') return 'BINS';
  if (cat === 'redeem-coupons-keys') return 'Redeem / Coupons / Keys';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
};

type Reply = { id: number; content: string; author: string; authorId: number; upvotes: number; createdAt: string; };
type ThreadDetail = { 
  id: number; title: string; content: string; category: string; author: string; authorId: number; 
  upvotes: number; views: number; isPinned: boolean; isLocked: boolean; createdAt: string; 
  hasLockedContent?: boolean; lockedContent?: string; unlockCost?: number;
  replies: Reply[]; 
};

export default function Thread() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
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

  const handleVote = async (type: 'thread' | 'reply', targetId: number) => {
    if (!thread) return;
    if (!user) return alert("Authentication required to vote.");
    
    const res = await fetch(`/api/forum/vote/${type}/${targetId}`, { method: 'POST' });
    if (res.ok) {
        if (type === 'thread') {
            setThread({ ...thread, upvotes: thread.upvotes + 1 });
        } else {
            setThread({ ...thread, replies: thread.replies.map(r => r.id === targetId ? { ...r, upvotes: r.upvotes + 1 } : r) });
        }
    } else {
        const errorData = await res.json() as any;
        alert(errorData.error || "Cannot process vote at this time.");
    }
  };

  const handleModeration = async (action: 'pin' | 'lock' | 'delete') => {
    if (!thread) return;
    if (action === 'delete') {
      if (!confirm('Confirm permanent deletion of this thread?')) return;
      await fetch(`/api/forum/threads/${thread.id}`, { method: 'DELETE' });
      navigate('/');
      return;
    }

    const res = await fetch(`/api/forum/threads/${thread.id}/${action}`, { method: 'PATCH' });
    if (res.ok) {
      const updated = await res.json() as ThreadDetail;
      setThread({ ...thread, isPinned: updated.isPinned, isLocked: updated.isLocked });
    }
  };

  const handleDeleteReply = async (replyId: number) => {
    if (!confirm('Permanently wipe this reply sequence?')) return;
    const res = await fetch(`/api/forum/replies/${replyId}`, { method: 'DELETE' });
    if (res.ok && thread) {
      setThread({ ...thread, replies: thread.replies.filter(r => r.id !== replyId) });
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
      } else alert(data.error || 'Decryption sequence failed.');
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
    <div className="max-w-4xl mx-auto py-16 px-4 flex flex-col items-center animate-pulse">
      <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-8 self-start"></div>
      <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
        <div className="flex gap-4 mb-6"><div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded"></div><div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div></div>
        <div className="h-10 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-xl mb-8"></div>
        <div className="space-y-4"><div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded"></div><div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded"></div><div className="h-4 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded"></div></div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto md:py-8 animation-fade-in">
      <SeoHead title={thread.title} description={thread.content.substring(0, 150)} />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all w-fit">
          <ArrowLeft className="size-4" /> Back to Board
        </Link>
        
        {(isModerator || isAuthor) && (
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-[#0a0a0a] p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
            {isModerator && (
              <>
                <button onClick={() => handleModeration('pin')} className={`p-2 rounded-lg transition-colors ${thread.isPinned ? 'bg-orange-500 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800'}`}>
                  <Pin className="size-4" />
                </button>
                <button onClick={() => handleModeration('lock')} className={`p-2 rounded-lg transition-colors ${thread.isLocked ? 'bg-red-500 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800'}`}>
                  <LockKeyhole className="size-4" />
                </button>
              </>
            )}
            <button onClick={() => handleModeration('delete')} className="p-2 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors ml-1">
              <Trash2 className="size-4" />
            </button>
          </div>
        )}
      </div>

      <div className={`bg-white dark:bg-zinc-900 border rounded-3xl p-6 md:p-10 shadow-xl shadow-zinc-200/20 dark:shadow-black/20 mb-8 flex gap-6 md:gap-8 ${thread.isPinned ? 'border-orange-500/50' : 'border-zinc-200 dark:border-zinc-800'}`}>
        <div className="hidden sm:flex flex-col items-center gap-3 pt-2">
          <button onClick={() => handleVote('thread', thread.id)} className="p-3 text-zinc-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-xl transition-all cursor-pointer border border-transparent hover:border-orange-500/20">
            <Flame className="size-6" />
          </button>
          <span className="font-black text-xl text-zinc-900 dark:text-zinc-100">{thread.upvotes}</span>
        </div>

        <div className="flex-1 w-full overflow-hidden">
          <div className="flex flex-wrap items-center gap-2.5 mb-5">
             {thread.isPinned && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-1 rounded-md border border-orange-500/20"><Pin className="size-3" /> Pinned</span>}
             {thread.isLocked && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20"><LockKeyhole className="size-3" /> Locked</span>}
             {thread.hasLockedContent && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20"><LockKeyhole className="size-3" /> Premium</span>}
             <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1">
               <Hash className="size-3" /> {formatCategory(thread.category)}
             </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-extrabold mb-6 text-balance leading-tight text-zinc-900 dark:text-white">{thread.title}</h1>
          
          <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-100 dark:prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-zinc-200 dark:prose-pre:border-zinc-800 prose-pre:rounded-xl">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{thread.content}</ReactMarkdown>
          </div>
          
          {thread.hasLockedContent && (
            <div className="mt-10 border border-orange-500/30 bg-orange-50/50 dark:bg-orange-500/5 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-inner">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-500 to-amber-400"></div>
              {thread.lockedContent ? (
                <div className="animation-fade-in">
                  <h4 className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <LockKeyhole className="size-4" /> Decrypted Payload
                  </h4>
                  <div className="bg-white dark:bg-[#0a0a0a] p-5 rounded-xl border border-orange-500/30 overflow-x-auto shadow-sm">
                    <pre className="text-zinc-800 dark:text-zinc-200 font-mono text-sm whitespace-pre-wrap break-all m-0">{thread.lockedContent}</pre>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="text-center sm:text-left">
                    <h4 className="font-bold text-xl text-zinc-900 dark:text-white flex items-center justify-center sm:justify-start gap-2 mb-2"><LockKeyhole className="size-6 text-orange-500" /> Encrypted Vector</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Requires community reputation points to unlock.</p>
                  </div>
                  {user ? (
                    <button onClick={handleUnlock} disabled={isUnlocking} className="shrink-0 flex w-full sm:w-auto items-center justify-center gap-2 bg-zinc-900 hover:bg-orange-500 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-orange-500 dark:hover:text-white font-bold px-8 py-4 rounded-xl transition-all shadow-xl active:scale-[0.98] cursor-pointer disabled:opacity-50">
                      {isUnlocking ? 'Decrypting...' : `Unlock Payload (${thread.unlockCost} pts)`}
                    </button>
                  ) : (
                    <Link to="/login" className="shrink-0 flex w-full sm:w-auto items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-xl active:scale-[0.98]">
                      Authenticate to Unlock
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="mt-10 pt-6 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-4">
            <Link to={`/profile/${thread.author}`} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors px-4 py-2 rounded-xl group">
              <div className="size-8 rounded-full bg-orange-500/10 flex items-center justify-center"><User className="size-4 text-orange-500" /></div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider leading-none mb-1">Author</span>
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-orange-500 transition-colors leading-none">{thread.author}</span>
              </div>
            </Link>
            <div className="flex items-center gap-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Clock className="size-4" /> {new Date(thread.createdAt).toLocaleString()}</span>
              <span className="flex items-center gap-1.5"><Eye className="size-4" /> {thread.views} Views</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="font-extrabold text-2xl flex items-center gap-3 text-zinc-900 dark:text-white">
            <MessageCircle className="size-6 text-orange-500" /> 
            Discussion <span className="text-zinc-400 font-medium text-lg">({thread.replies.length})</span>
          </h3>
        </div>
        
        <div className="space-y-4">
          {thread.replies.length === 0 ? (
            <div className="bg-white/50 dark:bg-[#0a0a0a]/50 border border-zinc-200 dark:border-zinc-800 border-dashed rounded-3xl p-12 text-center text-zinc-500 shadow-sm">
              <MessageCircle className="size-10 mx-auto mb-3 opacity-20" />
              <p className="font-semibold text-zinc-600 dark:text-zinc-400">No transmissions recorded.</p>
            </div>
          ) : (
            thread.replies.map(reply => (
              <div key={reply.id} className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 ml-0 md:ml-12 flex flex-col sm:flex-row gap-6 transition-all hover:border-orange-500/30 hover:shadow-md">
                {(isModerator || user?.id === reply.authorId) && (
                  <button onClick={() => handleDeleteReply(reply.id)} className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="size-4" />
                  </button>
                )}
                <div className="flex sm:flex-col items-center justify-between sm:justify-start gap-4 sm:gap-2 shrink-0 border-b sm:border-b-0 sm:border-r border-zinc-100 dark:border-zinc-800 pb-4 sm:pb-0 sm:pr-6">
                  <div className="flex flex-col items-center gap-1">
                    <button onClick={() => handleVote('reply', reply.id)} className="p-2 text-zinc-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-orange-500/20"><Flame className="size-5" /></button>
                    <span className="font-black text-lg text-zinc-900 dark:text-white">{reply.upvotes}</span>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex items-center gap-4 mb-4">
                    <Link to={`/profile/${reply.author}`} className="flex items-center gap-2 group">
                      <div className="size-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center"><User className="size-3 text-zinc-500 group-hover:text-orange-500 transition-colors" /></div>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-orange-500 transition-colors">{reply.author}</span>
                    </Link>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="size-3.5" /> {new Date(reply.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:leading-relaxed text-sm md:text-base">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{reply.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {thread.isLocked && !isModerator ? (
         <div className="flex flex-col items-center justify-center p-10 bg-zinc-50 dark:bg-[#0a0a0a] rounded-3xl border border-zinc-200 dark:border-zinc-800 text-center shadow-inner">
           <div className="size-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20"><ShieldAlert className="size-8 text-red-500" /></div>
           <h4 className="font-bold text-xl mb-2 text-zinc-900 dark:text-white">Vector Secured</h4>
           <p className="text-zinc-500 dark:text-zinc-400 max-w-md">System protocols have locked this discussion.</p>
         </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-10 shadow-xl shadow-zinc-200/20 dark:shadow-black/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-400"></div>
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-xl flex items-center gap-2 text-zinc-900 dark:text-white">Transmit Reply</h4>
          </div>
          {user ? (
            <form onSubmit={handleReply} className="space-y-4">
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-[#0a0a0a] focus-within:ring-2 focus-within:ring-orange-500/50 focus-within:border-orange-500/50 transition-all shadow-inner">
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
                  <button type="button" onClick={() => insertFormatting('**', '**')} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors"><Bold className="size-4" /></button>
                  <button type="button" onClick={() => insertFormatting('*', '*')} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors"><Italic className="size-4" /></button>
                  <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1"></div>
                  <button type="button" onClick={() => insertFormatting('`', '`')} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors"><Code className="size-4" /></button>
                </div>
                <textarea ref={textareaRef} required minLength={2} rows={5} placeholder="Initiate response sequence (Markdown parsed)..." value={replyContent} onChange={e => setReplyContent(e.target.value)} className="w-full bg-transparent px-5 py-4 text-base outline-none resize-none placeholder:text-zinc-400 custom-scrollbar" />
              </div>
              <div className="flex justify-end pt-2">
                <button disabled={isReplying || !replyContent.trim()} className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-orange-500 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-orange-500 dark:hover:text-white font-bold px-8 py-4 rounded-xl transition-all disabled:opacity-50 shadow-md active:scale-[0.98] cursor-pointer">
                  {isReplying ? 'Transmitting...' : 'Execute Reply'} <Send className="size-4 ml-1" />
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-[#0a0a0a] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
               <div className="size-12 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4"><LockKeyhole className="size-5 text-zinc-500" /></div>
               <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-6">Authentication required to append to this vector.</p>
               <Link to="/login" className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]">Authenticate Entity</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
