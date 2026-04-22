import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { User, Calendar, MessageSquarePlus, MessageCircle, Flame, Camera, Loader2, Shield, ShieldAlert, Network, Share2, CheckCircle2, Crown } from 'lucide-react';
import { SeoHead } from '@/components/SeoHead';
import { useAuth } from '@/context/AuthContext';

type ProfileData = {
  user: { id: number; username: string; points: number; avatarUrl: string | null; createdAt: string; role: string; isVerified?: boolean; isVip?: boolean; vipSince?: string; };
  stats: { threads: number; replies: number; };
  recentThreads: { id: number; title: string; category: string; upvotes: number; createdAt: string; }[];
};

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    if (!username) return;
    setIsLoading(true);
    setUploadError('');
    
    fetch(`/api/auth/profile/${username}`)
      .then(res => res.json() as Promise<ProfileData & { error?: string }>)
      .then(data => {
        if (data.error) throw new Error(data.error);
        setProfile(data as ProfileData);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [username]);

  const handleCopyVector = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Payload exceeds the 2MB transmission limit.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: formData });
      const data = await res.json() as any;
      
      if (res.ok && data.success && profile) {
        setProfile({ ...profile, user: { ...profile.user, avatarUrl: data.avatarUrl } });
        await refreshUser();
      } else {
        setUploadError(data.error || "Integrity verification failed during transmission.");
      }
    } catch (err) {
      setUploadError("Network integrity lost during upload sequence.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const initializeCommLink = async () => {
    if (!currentUser) return navigate('/login');
    if (!profile) return;
    
    setIsConnecting(true);
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: profile.user.id })
      });
      if (res.ok) {
        navigate('/messages');
      } else {
        const data = await res.json() as any;
        setUploadError(data.error || 'Failed to establish cryptographic tunnel.');
      }
    } catch (err) {
      setUploadError('Network error while routing connection.');
    } finally {
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 md:py-16 flex flex-col items-center">
        <div className="size-28 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-6 animate-pulse"></div>
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-4 animate-pulse"></div>
        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 border-dashed rounded-3xl text-center text-zinc-500 shadow-sm">
          <User className="size-16 mx-auto mb-4 opacity-20" />
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Identity Unresolved</h2>
          <p className="text-sm">The target node is non-existent within the active registry.</p>
          <Link to="/" className="mt-6 px-6 py-2.5 bg-zinc-900 hover:bg-orange-500 text-white rounded-xl font-bold transition-colors">Abort Execution</Link>
        </div>
      </div>
    );
  }

  const roleColor = profile.user.role === 'admin' ? 'text-red-500 border-red-500/20 bg-red-500/10' : 
                    profile.user.role === 'moderator' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' : 
                    'text-zinc-500 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800';

  return (
    <div className="max-w-4xl mx-auto md:py-8 animation-fade-in">
      <SeoHead title={`Entity: ${profile.user.username}`} description={`Registry analysis for node identifier ${profile.user.username}.`} />
      
      {uploadError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 text-sm font-semibold shadow-sm">
          <ShieldAlert className="size-5 shrink-0" /> {uploadError}
        </div>
      )}

      <div className={`bg-white dark:bg-zinc-900 border ${profile.user.isVip ? 'border-orange-500/50 shadow-orange-500/10' : 'border-zinc-200 dark:border-zinc-800'} rounded-3xl p-8 md:p-12 shadow-xl mb-8 relative overflow-hidden transition-all`}>
        <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${profile.user.isVip ? 'from-amber-400 via-orange-500 to-amber-400 animate-gradient-x' : 'from-zinc-500 to-zinc-400'}`}></div>
        
        <div className="absolute top-4 right-4 md:top-6 md:right-6 flex gap-2">
           <button 
             onClick={handleCopyVector}
             className="p-2.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-[#0a0a0a] dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-orange-500 rounded-xl transition-all shadow-sm"
             title="Clone Routing Signature"
           >
             {isCopied ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Share2 className="size-4" />}
           </button>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10">
          <div className="relative group shrink-0">
            <div className={`size-28 md:size-32 rounded-full flex items-center justify-center border-4 shadow-xl overflow-hidden ${profile.user.isVip ? 'bg-orange-500/10 border-orange-500/20 ring-2 ring-orange-500/50' : 'bg-zinc-100 border-zinc-50 dark:bg-zinc-800 dark:border-[#0a0a0a] ring-1 ring-zinc-200 dark:ring-zinc-800'}`}>
              {profile.user.avatarUrl ? (
                <img src={profile.user.avatarUrl} alt="Visual Signature" className="w-full h-full object-cover" />
              ) : (
                <User className={`size-12 ${profile.user.isVip ? 'text-orange-500' : 'text-zinc-400 dark:text-zinc-600'}`} />
              )}
            </div>
            
            {isOwnProfile && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed backdrop-blur-sm m-1"
              >
                {isUploading ? <Loader2 className="size-6 animate-spin" /> : <Camera className="size-6" />}
              </button>
            )}
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/png, image/jpeg, image/webp" className="hidden" />
          </div>
          
          <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
              <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">{profile.user.username}</h1>
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${roleColor} flex items-center gap-1`}>
                <Shield className="size-3" /> {profile.user.role}
              </span>
              {profile.user.isVip && (
                 <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border border-orange-500/30 bg-orange-500/10 text-orange-500 flex items-center gap-1 shadow-sm shadow-orange-500/10">
                   <Crown className="size-3" /> Elite Status
                 </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs font-mono text-zinc-500 uppercase tracking-wider mb-6">
              <span className="flex items-center gap-1.5 bg-zinc-50 dark:bg-[#0a0a0a] px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800"><Calendar className="size-3.5" /> Initialize: {new Date(profile.user.createdAt).toLocaleDateString()}</span>
              {profile.user.isVerified && <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20"><CheckCircle2 className="size-3.5" /> Validated</span>}
            </div>

            {!isOwnProfile && (
              <button 
                onClick={initializeCommLink}
                disabled={isConnecting}
                className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-orange-500 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-orange-500 dark:hover:text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {isConnecting ? <Loader2 className="size-4 animate-spin" /> : <Network className="size-4" />}
                {isConnecting ? 'Routing...' : 'Initialize Secure Comm-Link'}
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 w-full border-t border-zinc-100 dark:border-zinc-800/80 pt-8 mt-8">
          <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-[#0a0a0a] rounded-2xl border border-zinc-100 dark:border-zinc-800/50 shadow-inner">
            <span className="text-2xl md:text-3xl font-black text-orange-500 font-mono">{profile.user.points}</span>
            <span className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-1.5 mt-1">
              <Flame className="size-3.5 hidden sm:block" /> Reputation
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-[#0a0a0a] rounded-2xl border border-zinc-100 dark:border-zinc-800/50 shadow-inner">
            <span className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white font-mono">{profile.stats.threads}</span>
            <span className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-1.5 mt-1">
              <MessageSquarePlus className="size-3.5 hidden sm:block" /> Origin Vectors
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-[#0a0a0a] rounded-2xl border border-zinc-100 dark:border-zinc-800/50 shadow-inner">
            <span className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white font-mono">{profile.stats.replies}</span>
            <span className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-1.5 mt-1">
              <MessageCircle className="size-3.5 hidden sm:block" /> Transmissions
            </span>
          </div>
        </div>
      </div>

      <h3 className="font-extrabold text-xl md:text-2xl mb-6 flex items-center gap-3 text-zinc-900 dark:text-white px-2">
        <Network className="size-6 text-orange-500" /> Network Activity
      </h3>
      
      <div className="space-y-4 mb-12">
        {profile.recentThreads.length === 0 ? (
           <div className="p-12 text-center bg-white/50 dark:bg-[#0a0a0a]/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl text-zinc-500 border-dashed shadow-sm">
             <Network className="size-10 mx-auto mb-3 opacity-20" />
             <p className="font-semibold text-zinc-600 dark:text-zinc-400">Zero active transmissions traced.</p>
           </div>
        ) : (
          profile.recentThreads.map(thread => (
            <Link 
              key={thread.id} 
              to={`/forum/${thread.id}`} 
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-orange-500/50 hover:shadow-md transition-all group shadow-sm"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                  <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-zinc-200 dark:border-zinc-700">
                    {thread.category}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Deployed: {new Date(thread.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 group-hover:text-orange-500 transition-colors leading-snug">
                  {thread.title}
                </h4>
              </div>
              <div className="flex items-center gap-2 text-orange-500 font-bold text-sm bg-orange-500/10 px-4 py-2 rounded-xl border border-orange-500/20 shrink-0 w-fit">
                <Flame className="size-4" /> {thread.upvotes}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
