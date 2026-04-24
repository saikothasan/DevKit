import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, Compass, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';

// Dedicated mobile-only bottom tab architecture to simulate native app experience
export function MobileNav() {
  const { user } = useAuth();

  const NAV_ITEMS = [
    { to: '/', icon: Home, label: 'Grid' },
    { to: '/test-cards', icon: Compass, label: 'Tools' },
    { to: '/messages', icon: MessageCircle, label: 'Comm' },
    { to: user ? `/profile/${user.username}` : '/login', icon: ShieldCheck, label: 'Node' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] glass-nav pb-safe">
      <nav className="flex items-center justify-around px-2 pt-2 relative">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink 
            key={to}
            to={to} 
            className="relative flex flex-col items-center justify-center w-full h-14 gap-1 rounded-xl transition-colors focus-ring z-10"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute inset-0 bg-orange-500/10 dark:bg-orange-500/20 rounded-2xl -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                <Icon className={cn(
                  "size-5 transition-transform duration-300",
                  isActive 
                    ? "text-orange-500 scale-110" 
                    : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
                )} />
                <span className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-orange-600 dark:text-orange-400 font-bold" : "text-zinc-500 dark:text-zinc-400"
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
