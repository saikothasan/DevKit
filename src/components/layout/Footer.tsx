import { Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200/60 dark:border-zinc-800/60 py-8 px-4 md:px-8 mt-12 bg-gradient-to-b from-transparent to-zinc-50/50 dark:to-zinc-900/10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">
        
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
            <Terminal className="size-4 text-zinc-600 dark:text-zinc-300" />
          </div>
          <span>© {new Date().getFullYear()} DevKit Pro. All rights reserved.</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          <Link to="/privacy" className="hover:text-brand-orange dark:hover:text-brand-orange-light transition-colors focus-ring rounded-md px-1 py-0.5">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-brand-orange dark:hover:text-brand-orange-light transition-colors focus-ring rounded-md px-1 py-0.5">
            Terms of Service
          </Link>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide shadow-sm">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 duration-1000"></span>
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
            </span>
            Systems Operational
          </div>
        </div>
        
      </div>
    </footer>
  );
}
