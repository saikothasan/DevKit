import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { SeoHead } from '@/components/SeoHead';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';

function GitHubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

// Enterprise Validation Schema
const loginSchema = z.object({
  email: z.string().email('Invalid routing address format'),
  password: z.string().min(1, 'Cryptographic key required'),
  turnstileToken: z.string().min(1, 'Security verification required')
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [turnstileKey, setTurnstileKey] = useState(0); 
  const [serverError, setServerError] = useState('');
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const siteKey = import.meta.env.VITE_TURNSTILE_SITEKEY || '0x4AAAAAACZdr2afC17LFhhN';

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', turnstileToken: '' }
  });

  const turnstileToken = watch('turnstileToken');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err) setServerError(decodeURIComponent(err.replace(/\+/g, ' ')));
  }, []);

  const onSubmit = async (data: LoginForm) => {
    setServerError('');

    try {
      const res = await fetch('/api/auth/login', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data) 
      });
      
      const resData = await res.json() as any;
      
      if (!res.ok) {
        setValue('turnstileToken', ''); 
        setTurnstileKey(prev => prev + 1); 
        throw new Error(resData.error?.issues?.[0]?.message || resData.error || 'Authentication execution failed');
      }
      
      await refreshUser();
      navigate('/');
    } catch (err: any) {
      setServerError(err.message);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-[80vh] p-4 relative z-10">
      <SeoHead title="Authenticate Node" description="Establish a secure session to access the DevKit infrastructure." />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-96 bg-orange-500/20 blur-[100px] rounded-full pointer-events-none -z-10"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[420px] bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden ring-1 ring-zinc-900/5 dark:ring-white/5"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-400"></div>
        
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 text-orange-500 mb-5 shadow-inner">
            <LogIn className="size-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Secure Authorization</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm font-medium">Initialize a session to access elite vectors.</p>
        </header>

        <a href="/api/auth/github" className="w-full mb-6 flex items-center justify-center gap-3 bg-[#24292e] hover:bg-[#1b1f23] text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98] group">
          <GitHubIcon className="size-5 group-hover:scale-110 transition-transform" />
          Authenticate via GitHub
        </a>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-3 bg-white dark:bg-[#0a0a0a] text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Or standard protocol</span></div>
        </div>

        {serverError && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 shadow-inner">
            <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400 font-bold leading-snug">{serverError}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 ml-1">Routing Address</label>
            <div className="relative group">
              <Mail className={cn("absolute left-4 top-1/2 -translate-y-1/2 size-5 transition-colors", errors.email ? "text-red-500" : "text-zinc-400 group-focus-within:text-orange-500")} />
              <input 
                {...register('email')}
                type="email" 
                placeholder="entity@domain.com" 
                className={cn("w-full bg-zinc-50 dark:bg-zinc-900/50 border rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-white outline-none transition-all shadow-inner placeholder:font-medium placeholder:text-zinc-500", errors.email ? "border-red-500/50 focus:ring-2 focus:ring-red-500/50" : "border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/50")} 
              />
            </div>
            {errors.email && <p className="text-[10px] text-red-500 font-bold px-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 ml-1">Cryptographic Key</label>
            <div className="relative group">
              <Lock className={cn("absolute left-4 top-1/2 -translate-y-1/2 size-5 transition-colors", errors.password ? "text-red-500" : "text-zinc-400 group-focus-within:text-orange-500")} />
              <input 
                {...register('password')}
                type="password" 
                placeholder="••••••••" 
                className={cn("w-full bg-zinc-50 dark:bg-zinc-900/50 border rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-white outline-none transition-all shadow-inner placeholder:font-medium placeholder:text-zinc-500", errors.password ? "border-red-500/50 focus:ring-2 focus:ring-red-500/50" : "border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/50")} 
              />
            </div>
          </div>

          <div className={cn("flex justify-center py-2 min-h-[65px] bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border", errors.turnstileToken ? "border-red-500/50" : "border-zinc-200 dark:border-zinc-800")}>
            <Turnstile
              key={turnstileKey}
              siteKey={siteKey}
              onSuccess={(token) => setValue('turnstileToken', token, { shouldValidate: true })}
              onError={() => setValue('turnstileToken', '')}
              onExpire={() => setValue('turnstileToken', '')}
              options={{ theme: 'auto', size: 'flexible' }}
            />
          </div>

          <button disabled={isSubmitting || !turnstileToken} className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-orange-500 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-orange-500 dark:hover:text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 mt-4 shadow-lg active:scale-[0.98]">
            {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <LogIn className="size-5" />}
            {isSubmitting ? 'Establishing Tunnel...' : 'Initialize Session'}
          </button>
        </form>

        <footer className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          Unregistered node? <Link to="/register" className="font-bold text-zinc-900 dark:text-white hover:text-orange-500 dark:hover:text-orange-400 transition-colors inline-flex items-center gap-1">Establish Vector <ArrowRight className="size-3" /></Link>
        </footer>
      </motion.div>
    </main>
  );
}
