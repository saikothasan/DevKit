import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, ShieldCheck, ArrowRight, Github, AlertTriangle, Loader2 } from 'lucide-react';
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';

export function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  
  const turnstileRef = useRef<TurnstileInstance>(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!turnstileToken) {
      setError('Anti-bot verification sequence incomplete.');
      return;
    }

    // Password entropy heuristic check before transmission
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      setError('Cryptographic strength insufficient. Requires 8+ chars, uppercase, lowercase, and numeric.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await register(username, email, password, turnstileToken);
      if (response.requiresVerification) {
        setRequiresVerification(true);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Node deployment failed.');
      turnstileRef.current?.reset();
    } finally {
      setIsLoading(false);
    }
  };

  if (requiresVerification) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center glass-panel p-8 rounded-3xl">
          <div className="size-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-green-500/20">
            <ShieldCheck className="size-8" />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Verification Dispatched</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 leading-relaxed">
            A cryptographic token has been transmitted to <span className="font-bold text-zinc-900 dark:text-zinc-200">{email}</span>. Acknowledge the payload to finalize node integration.
          </p>
          <button onClick={() => navigate('/login')} className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm py-3 px-8 rounded-xl hover:bg-orange-500 dark:hover:bg-orange-500 transition-all focus-ring">
            Return to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        className="w-full max-w-md"
      >
        <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col items-center mb-8 relative z-10">
            <div className="size-12 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800 mb-4 shadow-inner">
              <Logo className="size-7 text-orange-500" />
            </div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Deploy Identity Node</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Join the architecture hub</p>
          </div>

          <form onSubmit={handleExecute} className="space-y-4 relative z-10">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider ml-1">Node Alias</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-orange-500 transition-colors"><User className="size-4" /></div>
                <input type="text" required minLength={3} maxLength={30} pattern="^[a-zA-Z0-9_]+$" title="Alphanumeric and underscores only" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-zinc-50 dark:bg-[#0f0f0f] border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm focus-ring text-zinc-900 dark:text-zinc-100 shadow-sm" placeholder="ghost_protocol_99" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider ml-1">Vector Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-orange-500 transition-colors"><Mail className="size-4" /></div>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-50 dark:bg-[#0f0f0f] border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm focus-ring text-zinc-900 dark:text-zinc-100 shadow-sm" placeholder="node@network.com" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider ml-1">Cryptographic Key</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-orange-500 transition-colors"><Lock className="size-4" /></div>
                <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-zinc-50 dark:bg-[#0f0f0f] border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm focus-ring text-zinc-900 dark:text-zinc-100 shadow-sm" placeholder="••••••••••••" />
              </div>
            </div>

            <div className="flex justify-center py-2">
              <Turnstile ref={turnstileRef} siteKey="YOUR_TURNSTILE_SITE_KEY" onSuccess={(token) => setTurnstileToken(token)} theme="auto" />
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 group focus-ring disabled:opacity-70 disabled:pointer-events-none">
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : (
                <>Initialize Deployment <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></>
              )}
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
              <span className="flex-shrink-0 mx-4 text-xs font-semibold text-zinc-400 uppercase tracking-widest">External Node</span>
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
            </div>

            <button type="button" onClick={() => window.location.href = '/api/auth/github'} className="w-full bg-white dark:bg-[#141414] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-bold text-sm py-3.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 focus-ring">
              <Github className="size-4" /> Initialize via GitHub
            </button>
          </form>

          <p className="text-center mt-8 text-sm text-zinc-500">
            Node already deployed? <Link to="/login" className="text-zinc-900 dark:text-white font-bold hover:text-orange-500 dark:hover:text-orange-400 transition-colors focus-ring rounded-sm">Authenticate</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
