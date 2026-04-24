import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { motion, AnimatePresence } from 'framer-motion';
import { SeoHead } from '@/components/SeoHead';
import { useAuth } from '@/context/AuthContext';

function GitHubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0); 
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const siteKey = import.meta.env.VITE_TURNSTILE_SITEKEY || '0x4AAAAAACZdr2afC17LFhhN';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err) setError(decodeURIComponent(err.replace(/\+/g, ' ')));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      setError('Cryptographic security verification required.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, turnstileToken }) 
      });
      
      const data = await res.json() as any;
      
      if (!res.ok) {
        setTurnstileToken(''); 
        setTurnstileKey(prev => prev + 1); 
        throw new Error(data.error?.issues?.[0]?.message || data.error || 'Authentication execution failed');
      }
      
      await refreshUser();
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-[85vh] p-4 relative z-10 w-full">
      <SeoHead title="Authenticate Node" description="Establish a secure session to access the DevKit infrastructure." />
      
      {/* Ambient Deep Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[600px] bg-brand-orange/15 dark:bg-brand-orange/20 blur-[120px] rounded-full pointer-events-none -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-[440px] glass-panel rounded-[2rem] p-8 sm:p-10 relative overflow-hidden"
      >
        {/* Top Edge Highlight */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-brand-orange to-transparent opacity-80" />
        
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-brand-orange/20 to-brand-orange/5 border border-brand-orange/30 text-brand-orange mb-6 shadow-inner">
            <LogIn className="size-7 drop-shadow-sm" />
          </div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Secure Authorization</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-[15px] font-medium leading-relaxed">Initialize a session to access elite vectors.</p>
        </header>

        <a href="/api/auth/github" className="w-full mb-6 flex items-center justify-center gap-3 bg-[#24292e] hover:bg-[#1b1f23] text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-black/10 active:scale-[0.98] group focus-ring">
          <GitHubIcon className="size-5 group-hover:scale-110 transition-transform duration-300" />
          Authenticate via GitHub
        </a>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200/80 dark:border-zinc-800/80" /></div>
          <div className="relative flex justify-center text-sm"><span className="px-4 bg-white dark:bg-zinc-950 text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest text-[11px] rounded-full">Or standard protocol</span></div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }} 
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 shadow-inner">
                <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-[14px] text-red-600 dark:text-red-400 font-bold leading-snug">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[12px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest ml-1">Routing Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-400 group-focus-within:text-brand-orange transition-colors duration-300" />
              <input required type="email" placeholder="entity@domain.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl pl-12 pr-4 py-4 text-[15px] font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:border-brand-orange/50 focus:ring-brand-orange/20 transition-all shadow-inner placeholder:font-medium placeholder:text-zinc-400" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest ml-1">Cryptographic Key</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-400 group-focus-within:text-brand-orange transition-colors duration-300" />
              <input required type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl pl-12 pr-4 py-4 text-[15px] font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:border-brand-orange/50 focus:ring-brand-orange/20 transition-all shadow-inner placeholder:font-medium placeholder:text-zinc-400" />
            </div>
          </div>

          <div className="flex justify-center py-2 min-h-[70px] bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-inner overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="relative z-10 w-full flex justify-center scale-[0.95] origin-center">
                <Turnstile
                  key={turnstileKey}
                  siteKey={siteKey}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setTurnstileToken('')}
                  onExpire={() => setTurnstileToken('')}
                  options={{ theme: 'auto', size: 'flexible' }}
                />
            </div>
          </div>

          <button disabled={isSubmitting || !turnstileToken} className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-brand-orange text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-brand-orange dark:hover:text-white font-bold py-4 rounded-xl transition-all duration-300 disabled:opacity-50 mt-6 shadow-xl active:scale-[0.98] focus-ring group">
            {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <LogIn className="size-5 transition-transform group-hover:translate-x-1" />}
            {isSubmitting ? 'Establishing Tunnel...' : 'Initialize Session'}
          </button>
        </form>

        <footer className="text-center text-[14px] text-zinc-500 dark:text-zinc-400 mt-8 pt-6 border-t border-zinc-200/80 dark:border-zinc-800/80 font-medium">
          Unregistered node? <Link to="/register" className="font-bold text-zinc-900 dark:text-white hover:text-brand-orange dark:hover:text-brand-orange-light transition-colors inline-flex items-center gap-1.5 focus-ring rounded-sm">Establish Vector <ArrowRight className="size-3.5" /></Link>
        </footer>
      </motion.div>
    </main>
  );
}
