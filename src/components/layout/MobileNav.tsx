import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, Compass, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Dedicated mobile-only bottom tab architecture to simulate native app experience
export function MobileNav() {
  const { user } = useAuth();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200/80 bg-white/80 dark:border-zinc-800/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl pb-safe">
      <nav className="flex items-center justify-around px-2 py-2">
        <NavLink 
          to="/" 
          className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-12 gap-1 rounded-xl transition-colors ${isActive ? 'text-orange-500 font-bold' : 'text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-zinc-100'}`}
        >
          <Home className="size-5" />
          <span className="text-[10px]">Grid</span>
        </NavLink>

        <NavLink 
          to="/test-cards" 
          className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-12 gap-1 rounded-xl transition-colors ${isActive ? 'text-orange-500 font-bold' : 'text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-zinc-100'}`}
        >
          <Compass className="size-5" />
          <span className="text-[10px]">Tools</span>
        </NavLink>

        <NavLink 
          to="/messages" 
          className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-12 gap-1 rounded-xl transition-colors ${isActive ? 'text-orange-500 font-bold' : 'text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-zinc-100'}`}
        >
          <MessageCircle className="size-5" />
          <span className="text-[10px]">Comm</span>
        </NavLink>

        <NavLink 
          to={user ? `/profile/${user.username}` : "/login"} 
          className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-12 gap-1 rounded-xl transition-colors ${isActive ? 'text-orange-500 font-bold' : 'text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-zinc-100'}`}
        >
          <ShieldCheck className="size-5" />
          <span className="text-[10px]">Node</span>
        </NavLink>
      </nav>
    </div>
  );
}
