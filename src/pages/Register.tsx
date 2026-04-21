import React, { useState, useRef, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile'; 

export default function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);

  const siteKey = import.meta.env.VITE_TURNSTILE_SITEKEY || '0x4AAAAAACZdr2afC17LFhhN';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    if (!turnstileToken) {
      setError('Security verification required. Please complete the Turnstile challenge.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, turnstileToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed due to a system constraint.');
      }

      if (data.requiresVerification) {
        navigate('/verify-email', { state: { message: data.message } });
      } else {
        // Full refresh to ensure global auth state catches the new secure cookie
        window.location.href = '/'; 
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-50 p-4 sm:p-8">
      <div className="w-full max-w-md space-y-8 bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-2xl">
        
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">Create an account</h1>
          <p className="text-sm text-zinc-400">
            Enter required details below to join the developer ecosystem.
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm font-medium text-red-400 bg-red-950/50 border border-red-900/50 rounded-lg text-center">
            {error}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium text-zinc-300">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="flex w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all"
                placeholder="developer_01"
              />
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-zinc-300">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="flex w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all"
                placeholder="dev@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-zinc-300">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="flex w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Turnstile
              siteKey={siteKey}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setError('Turnstile initialization failed. Please check the site key.')}
              onExpire={() => setTurnstileToken('')}
              options={{ theme: 'dark' }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !turnstileToken}
            className="w-full inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-zinc-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : 'Register Account'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-zinc-900 px-2 text-zinc-400">Or continue with</span>
          </div>
        </div>

        <a
          href="/api/auth/github"
          className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-colors"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          GitHub Authentication
        </a>

        <div className="text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-white hover:text-zinc-300 hover:underline">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
}
