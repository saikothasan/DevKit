import { useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { User, LogIn, Menu, X, LogOut, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../Logo';
import { NAV_ITEMS } from '@/config/navigation';
import { useAuth } from '@/context/AuthContext';
import { useUIStore } from '@/store/useUIStore';

export function MobileHeader() {
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();
  const { user, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const utilities = NAV_ITEMS.filter(item => item.group === 'Utilities');
  const community = NAV_ITEMS.filter(item => item.group === 'Community');

  useEffect(() => { closeMobileMenu(); }, [location.pathname, closeMobileMenu]);

  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 glass-nav px-4 sm:h-16 sm:px-6 md:hidden">
        <button 
          onClick={toggleMobileMenu}
          className="inline-flex items-center justify-center rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 focus-ring transition-all active:scale-95"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </button>
        
        <NavLink to="/" className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity">
          <Logo className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500 drop-shadow-sm" />
          <span className="text-zinc-900 dark:text-zinc-100 tracking-tight">DevKit Pro</span>
        </NavLink>
        
        {user && (
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full text-xs font-bold border border-orange-500/20 shadow-sm">
             <Flame className="size-3.5" /> {user.points}
          </div>
        )}
      </header>

      {/* Hardware-Accelerated Drawer Overlay & Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[70] bg-zinc-900/40 dark:bg-black/80 backdrop-blur-sm md:hidden"
              onClick={closeMobileMenu}
            />
            
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[80] w-[85%] max-w-sm bg-white dark:bg-[#0a0a0a] shadow-2xl border-r border-zinc-200 dark:border-zinc-800 flex flex-col md:hidden pt-safe"
            >
              <div className="flex h-14 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-5 shrink-0">
                <NavLink to="/" className="flex items-center gap-2 font-semibold">
                  <Logo className="h-6 w-6 text-orange-500" />
                  <span className="text-zinc-900 dark:text-zinc-100 tracking-tight">DevKit Pro</span>
                </NavLink>
                <button 
                  onClick={closeMobileMenu}
                  className="rounded-xl p-2 bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors focus-ring"
                >
                  <X className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto py-6 px-3 custom-scrollbar">
                <nav className="space-y-6" aria-label="Mobile Navigation Drawer">
                  <div>
                    <h3 className="px-3 mb-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Execution Utilities</h3>
                    <div className="space-y-1">
                      {utilities.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all text-sm font-semibold ${isActive ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50'}`}>
                          <Icon className="h-4 w-4 shrink-0" /> {label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="px-3 mb-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Comm-Link Grid</h3>
                    <div className="space-y-1">
                      {community.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all text-sm font-semibold ${isActive ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50'}`}>
                          <Icon className="h-4 w-4 shrink-0" /> {label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </nav>
              </div>

              <div className="mt-auto border-t border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-900/20 pb-safe">
                {isLoading ? (
                  <div className="h-14 w-full animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800/80"></div>
                ) : user ? (
                  <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-[#0a0a0a] shadow-sm">
                    <Link to={`/profile/${user.username}`} className="flex items-center gap-3 overflow-hidden hover:opacity-80 transition-opacity flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 border border-zinc-50 dark:bg-zinc-800 dark:border-zinc-900 shrink-0">
                        {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : <User className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />}
                      </div>
                      <div className="flex flex-col truncate pr-2">
                        <span className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">{user.username}</span>
                        <span className="text-[11px] font-bold text-orange-500 flex items-center gap-1 uppercase tracking-wider"><Flame className="size-3" /> {user.points} pts</span>
                      </div>
                    </Link>
                    <button onClick={handleLogout} className="text-zinc-400 hover:text-red-500 transition-colors p-2.5 rounded-xl hover:bg-red-500/10 focus-ring" title="Logout">
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <NavLink to="/login" className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3.5 text-sm font-bold text-zinc-50 hover:bg-orange-500 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-orange-500 dark:hover:text-white transition-all shadow-md active:scale-[0.98]">
                    <LogIn className="h-4 w-4" /> Sign In
                  </NavLink>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
