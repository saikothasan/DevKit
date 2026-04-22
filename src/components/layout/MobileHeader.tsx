import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { User, LogIn, Menu, X, LogOut, Flame } from 'lucide-react';
import { Logo } from '../Logo';
import { NAV_ITEMS } from '../../config/navigation';
import { useAuth } from '../../context/AuthContext';

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const utilities = NAV_ITEMS.filter(item => item.group === 'Utilities');
  const community = NAV_ITEMS.filter(item => item.group === 'Community');

  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-4 dark:border-zinc-800 dark:bg-[#0a0a0a]/95 dark:supports-[backdrop-filter]:bg-[#0a0a0a]/60 sm:h-16 sm:px-6 md:hidden">
        <button 
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center justify-center rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 focus-visible:outline-none transition-colors"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </button>
        
        <NavLink to="/" className="flex items-center gap-2 font-semibold">
          <Logo className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="text-zinc-900 dark:text-zinc-100">DevKit Pro</span>
        </NavLink>
        
        {user && (
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 text-orange-500 rounded-full text-xs font-bold border border-orange-500/20">
             <Flame className="size-3.5" /> {user.points}
          </div>
        )}
      </header>

      {/* Mobile Drawer Overlay */}
      <div 
        className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      ></div>
      
      {/* Mobile Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-[80%] max-w-sm bg-white dark:bg-[#0a0a0a] shadow-xl border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="flex h-14 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4">
          <NavLink to="/" className="flex items-center gap-2 font-semibold">
            <Logo className="h-6 w-6" />
            <span className="text-zinc-900 dark:text-zinc-100">Visatk</span>
          </NavLink>
          <button 
            onClick={() => setIsOpen(false)}
            className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
          >
            <X className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto py-4 custom-scrollbar">
          <nav className="grid gap-1 px-2 text-sm font-medium">
            <div className="px-2 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Utilities</div>
            {utilities.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${isActive ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 font-medium' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 font-medium'}`}>
                <Icon className="h-4 w-4" /> {label}
              </NavLink>
            ))}
            
            <div className="px-2 py-2 mt-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Community</div>
            {community.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${isActive ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 font-medium' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 font-medium'}`}>
                <Icon className="h-4 w-4" /> {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-zinc-200 dark:border-zinc-800 p-4">
          {isLoading ? (
            <div className="h-12 w-full animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800"></div>
          ) : user ? (
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/50 shadow-sm">
              <Link to={`/profile/${user.username}`} className="flex items-center gap-3 overflow-hidden hover:opacity-80 transition-opacity">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 shrink-0">
                  <User className="h-5 w-5 text-zinc-50 dark:text-zinc-900" />
                </div>
                <div className="flex flex-col">
                  <span className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">{user.username}</span>
                  <span className="text-xs font-bold text-orange-500 flex items-center gap-1"><Flame className="size-3" /> {user.points} pts</span>
                </div>
              </Link>
              <button onClick={handleLogout} className="text-zinc-400 hover:text-red-500 transition-colors p-2" title="Logout">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <NavLink to="/login" className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 transition-colors">
              <LogIn className="h-4 w-4" />
              Sign In
            </NavLink>
          )}
        </div>
      </div>
    </>
  );
}
