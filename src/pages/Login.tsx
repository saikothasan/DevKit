import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { SeoHead } from '@/components/SeoHead';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';

function GitHubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function InputField({
  label, type, placeholder, value, onChange, icon: Icon, autoComplete
}: {
  label: string; type: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  icon: React.ElementType; autoComplete?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div>
      <label className="badge-mono block mb-2" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <div
        className="relative flex items-center rounded-xl transition-all"
        style={{
          background: 'var(--surface-raised)',
          border: `1px solid ${focused ? 'var(--orange)' : 'var(--border-strong)'}`,
          boxShadow: focused ? '0 0 0 3px var(--orange-dim)' : 'none',
        }}
      >
        <Icon className="absolute left-3.5 size-4 shrink-0 transition-colors" style={{ color: focused ? 'var(--orange)' : 'var(--text-muted)' }} />
        <input
          required
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent py-3.5 pl-11 pr-4 text-sm font-medium outline-none"
          style={{ color: 'var(--text-primary)' }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 p-1 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    </div>
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
    const err = new URLSearchParams(window.location.search).get('error');
    if (err) setError(decodeURIComponent(err.replace(/\+/g, ' ')));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) { setError('Please complete the security verification.'); return; }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, turnstileToken }),
      });
      const data = await res.json() as any;
      if (!res.ok) {
        setTurnstileToken('');
        setTurnstileKey(k => k + 1);
        throw new Error(data.error?.issues?.[0]?.message || data.error || 'Authentication failed');
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
    <main className="flex items-center justify-center min-h-[85vh] p-4 relative">
      <SeoHead title="Sign In | DevKit" description="Sign in to access the DevKit platform." />

      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] pointer-events-none -z-10 opacity-60"
        style={{ background: 'radial-gradient(ellipse, rgba(243,128,32,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }}
      />

      <div
        className="w-full max-w-[420px] rounded-2xl overflow-hidden animation-fade-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.12)' }}
      >
        {/* Top accent bar */}
        <div className="h-px w-full bg-gradient-to-r from-orange-500 via-amber-400 to-transparent" />

        <div className="p-7 sm:p-9">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-5">
              <div
                className="size-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--orange-dim)', border: '1px solid var(--orange-border)' }}
              >
                <Logo className="size-8 text-orange-500" />
              </div>
            </div>
            <h1
              className="text-2xl font-bold tracking-tight mb-1.5"
              style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}
            >
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Sign in to access your account
            </p>
          </div>

          {/* GitHub OAuth */}
          <a
            href="/api/auth/github"
            className="w-full mb-5 flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] group"
            style={{ background: '#24292e', color: '#fff' }}
          >
            <GitHubIcon className="size-4.5 group-hover:scale-110 transition-transform" />
            Continue with GitHub
          </a>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid var(--border)' }} />
            </div>
            <div className="relative flex justify-center">
              <span
                className="px-3 badge-mono"
                style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}
              >
                or continue with email
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-5 flex items-start gap-3 p-3.5 rounded-xl animation-fade-in"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-500 leading-snug">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField label="Email Address" type="email" placeholder="you@example.com" value={email} onChange={setEmail} icon={Mail} autoComplete="email" />
            <InputField label="Password" type="password" placeholder="••••••••" value={password} onChange={setPassword} icon={Lock} autoComplete="current-password" />

            {/* Turnstile */}
            <div
              className="flex justify-center py-2 rounded-xl min-h-[68px]"
              style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
            >
              <Turnstile
                key={turnstileKey}
                siteKey={siteKey}
                onSuccess={setTurnstileToken}
                onError={() => setTurnstileToken('')}
                onExpire={() => setTurnstileToken('')}
                options={{ theme: 'auto', size: 'flexible' }}
              />
            </div>

            <button
              disabled={isSubmitting || !turnstileToken}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold transition-all disabled:opacity-50 active:scale-[0.98] mt-1 group"
              style={{ background: isSubmitting ? 'var(--text-primary)' : 'var(--text-primary)', color: 'var(--bg)' }}
              onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = 'var(--orange)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--text-primary)'; }}
            >
              {isSubmitting
                ? <><Loader2 className="size-4 animate-spin" /> Signing in...</>
                : <><LogIn className="size-4" /> Sign In</>
              }
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm mt-6 pt-5" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            No account?{' '}
            <Link to="/register" className="font-bold hover:text-orange-500 transition-colors inline-flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
              Create one <ArrowRight className="size-3" />
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
