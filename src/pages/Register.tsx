import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { SeoHead } from '@/components/SeoHead';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';

const registerSchema = z.object({
  username: z.string().min(3, 'Identifier must be 3+ characters').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Alphanumeric and underscores only'),
  email: z.string().email('Invalid routing address format'),
  password: z.string().min(8, 'Cryptographic strength requires 8+ characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Requires uppercase, lowercase, and numeric data'),
  turnstileToken: z.string().min(1, 'Security verification required')
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [turnstileKey, setTurnstileKey] = useState(0); 
  const [serverError, setServerError] = useState('');
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const siteKey = import.meta.env.VITE_TURNSTILE_SITEKEY || '0x4AAAAAACZdr2afC17LFhhN';

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '', turnstileToken: '' }
  });

  const turnstileToken = watch('turnstileToken');

  const onSubmit = async (data: RegisterForm) => {
    setServerError('');
    try {
      const res = await fetch('/api/auth/register', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data) 
      });
      
      const resData = await res.json() as any;
      if (!res.ok) {
        setValue('turnstileToken', ''); 
        setTurnstileKey(prev => prev + 1); 
        throw new Error(resData.error?.issues?.[0]?.message || resData.error || 'Network initialization failed');
      }
      
      if (resData.requiresVerification) {
        navigate('/verify-email');
      } else {
        await refreshUser();
        navigate('/');
      }
    } catch (err: any) {
      setServerError(err.message);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-[80vh] p-4 relative z-10">
      <SeoHead title="Establish Vector" description="Register an identity node within the DevKit network." />
      
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
            <UserPlus className="size-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Establish Vector</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm font-medium">Create a new identity node to access the grid.</p>
        </header>

        {serverError && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 shadow-inner">
            <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400 font-bold leading-snug">{serverError}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 ml-1">Network Identifier</label>
            <div className="relative group">
              <User className={cn("absolute left-4 top-1/2 -translate-y-1/2 size-5 transition-colors", errors.username ? "text-red-500" : "text-zinc-400 group-focus-within:text-orange-500")} />
              <input {...register('username')} type="text" placeholder="neo_dev_99" className={cn("w-full bg-zinc-50 dark:bg-zinc-900/50 border rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-white outline-none transition-all shadow-inner placeholder:font-medium placeholder:text-zinc-500", errors.username ? "border-red-500/50 focus:ring-2 focus:ring-red-500/50" : "border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/50")} />
            </div>
            {errors.username && <p className="text-[10px] text-red-500 font-bold px-1">{errors.username.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 ml-1">Routing Address</label>
            <div className="relative group">
              <Mail className={cn("absolute left-4 top-1/2 -translate-y-1/2 size-5 transition-colors", errors.email ? "text-red-500" : "text-zinc-400 group-focus-within:text-orange-500")} />
              <input {...register('email')} type="email" placeholder="entity@domain.com" className={cn("w-full bg-zinc-50 dark:bg-zinc-900/50 border rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-white outline-none transition-all shadow-inner placeholder:font-medium placeholder:text-zinc-500", errors.email ? "border-red-500/50 focus:ring-2 focus:ring-red-500/50" : "border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/50")} />
            </div>
            {errors.email && <p className="text-[10px] text-red-500 font-bold px-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 ml-1">Cryptographic Key</label>
            <div className="relative group">
              <Lock className={cn("absolute left-4 top-1/2 -translate-y-1/2 size-5 transition-colors", errors.password ? "text-red-500" : "text-zinc-400 group-focus-within:text-orange-500")} />
              <input {...register('password')} type="password" placeholder="••••••••" className={cn("w-full bg-zinc-50 dark:bg-zinc-900/50 border rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-white outline-none transition-all shadow-inner placeholder:font-medium placeholder:text-zinc-500", errors.password ? "border-red-500/50 focus:ring-2 focus:ring-red-500/50" : "border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/50")} />
            </div>
            {errors.password && <p className="text-[10px] text-red-500 font-bold px-1">{errors.password.message}</p>}
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
            {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <UserPlus className="size-5" />}
            {isSubmitting ? 'Compiling Node...' : 'Establish Vector'}
          </button>
        </form>

        <footer className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          Already registered? <Link to="/login" className="font-bold text-zinc-900 dark:text-white hover:text-orange-500 dark:hover:text-orange-400 transition-colors inline-flex items-center gap-1">Authenticate <ArrowRight className="size-3" /></Link>
        </footer>
      </motion.div>
    </main>
  );
}
