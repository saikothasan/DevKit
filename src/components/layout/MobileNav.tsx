import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, Compass, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';

export function MobileNav() {
  const { user } = useAuth();

  const NAV_ITEMS = [
    { to: '/', icon: Home, label: 'Grid' },
    { to: '/test-cards', icon: Compass, label: 'Tools' },
    { to: '/messages', icon: MessageCircle, label: 'Comm' },
    { to: user ? `/profile/${user.username}` : '/login', icon: ShieldCheck, label: 'Node' },
  ];

  return (
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/85 dark:bg-zinc-950/85 backdrop-blur-2xl border-t border-zinc-200/50 dark:border-zinc-800/50 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]"
      role="navigation"
      aria-label="Bottom Navigation"
    >
      <nav className="flex items-center justify-around px-2 pt-1.5 pb-1 relative max-w-md mx-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink 
            key={to}
            to={to} 
            className="relative flex flex-col items-center justify-center w-full h-[52px] gap-1 rounded-2xl transition-colors focus-ring z-10 select-none -webkit-tap-highlight-transparent"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active-tab"
                    className="absolute inset-0 bg-brand-orange/10 dark:bg-brand-orange/15 rounded-xl border border-brand-orange/10 -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={cn(
                  "size-[22px] transition-all duration-300",
                  isActive 
                    ? "text-brand-orange scale-110 drop-shadow-sm" 
                    : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
                )} />
                <span className={cn(
                  "text-[10px] tracking-wide transition-all duration-300",
                  isActive ? "text-brand-orange-dark dark:text-brand-orange-light font-bold" : "text-zinc-500 dark:text-zinc-400 font-medium"
                )}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
