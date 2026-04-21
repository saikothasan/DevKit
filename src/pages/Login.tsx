import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { SeoHead } from '../components/SeoHead';
import { useAuth } from '../context/AuthContext';

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
      setError('Please complete the security check.');
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
        setTurnstileToken(''); // Force re-challenge
        let errMsg = 'Login failed';
        if (typeof data.error === 'string') errMsg = data.error;
        else if (data.error?.issues?.[0]?.message) errMsg = data.error.issues[0].message;
        throw new Error(errMsg);
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
    <div className="flex items-center justify-center min-h-[70vh] p-4 animation-fade-in relative z-10">
      <SeoHead title="Sign In" description="Sign in to DevKit Pro to participate in the community forum." />
      
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-400"></div>
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 mb-4">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Welcome Back</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">Sign in to your account to continue</p>
        </div>

        <a href="/api/auth/github" className="w-full mb-6 flex items-center justify-center gap-3 bg-[#24292e] hover:bg-[#1b1f23] text-white font-medium py-3 rounded-xl transition-colors">
          <GitHubIcon className="w-5 h-5" />
          Sign in with GitHub
        </a>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-zinc-900 text-zinc-500">Or continue with email</span></div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input required type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-zinc-400" />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-zinc-400" />
          </div>

          <div className="flex justify-center py-2 min-h-[65px]">
            <Turnstile
              siteKey={siteKey}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setTurnstileToken('')}
              onExpire={() => setTurnstileToken('')}
              options={{ theme: 'auto', size: 'flexible' }}
            />
          </div>

          <button disabled={isSubmitting || !turnstileToken} className="w-full bg-zinc-900 hover:bg-orange-500 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-orange-500 dark:hover:text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 mt-2">
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-8">
          Don't have an account? <Link to="/register" className="font-semibold text-zinc-900 dark:text-white hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
