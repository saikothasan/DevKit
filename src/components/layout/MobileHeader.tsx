import { useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { User, LogIn, Menu, X, LogOut, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../Logo';
import { NAV_ITEMS } from '@/config/navigation';
import { useAuth } from '@/context/AuthContext';
import { useUIStore } from '@/store/useUIStore';
import { cn } from '@/utils/cn';

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
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 glass-nav px-4 sm:px-6 md:hidden shadow-sm shadow-zinc-200/20 dark:shadow-black/40">
        <button 
          onClick={toggleMobileMenu}
          aria-label="Toggle Mobile Menu"
          aria-expanded={isMobileMenuOpen}
          className="inline-flex items-center justify-center rounded-xl p-2.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 focus-ring transition-all active:scale-95"
        >
          <Menu className="size-5.5" />
        </button>
        
        <NavLink to="/" className="flex items-center gap-2.5 font-black text-lg hover:opacity-80 transition-opacity focus-ring rounded-lg group">
          <div className="relative">
            <div className="absolute inset-0 bg-brand-orange blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
            <Logo className="size-6 text-brand-orange drop-shadow-sm relative z-10" />
          </div>
          <span className="text-zinc-900 dark:text-zinc-100 tracking-tight">
            DevKit<span className="text-brand-orange font-normal">Pro</span>
          </span>
        </NavLink>
        
        {user && (
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-brand-orange/10 text-brand-orange-dark dark:text-brand-orange-light rounded-full text-xs font-bold border border-brand-orange/20 shadow-inner">
             <Flame className="size-3.5" /> {user.points}
          </div>
        )}
      </header>

      {/* Hardware-Accelerated Drawer Overlay & Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed inset-0 z-[70] bg-zinc-900/40 dark:bg-black/60 md:hidden will-change-[opacity]"
              onClick={closeMobileMenu}
              aria-hidden="true"
            />
            
            <motion.div 
              initial={{ x: '-100%', filter: 'drop-shadow(0px 0px 0px rgba(0,0,0,0))' }}
              animate={{ x: 0, filter: 'drop-shadow(20px 0px 40px rgba(0,0,0,0.15))' }}
              exit={{ x: '-100%', filter: 'drop-shadow(0px 0px 0px rgba(0,0,0,0))' }}
              transition={{ type: 'spring', damping: 28, stiffness: 250 }}
              className="fixed inset-y-0 left-0 z-[80] w-[85%] max-w-sm bg-white/95 dark:bg-zinc-950/95 backdrop-blur-3xl border-r border-zinc-200/80 dark:border-zinc-800/80 flex flex-col md:hidden pt-safe will-change-transform"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex h-16 items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 px-5 shrink-0 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-orange/40 to-transparent" />
                <NavLink to="/" className="flex items-center gap-2.5 font-black text-lg focus-ring rounded-lg">
                  <Logo className="size-6 text-brand-orange" />
                  <span className="text-zinc-900 dark:text-zinc-100 tracking-tight">
                    DevKit<span className="text-brand-orange font-normal">Pro</span>
                  </span>
                </NavLink>
                <button 
                  onClick={closeMobileMenu}
                  aria-label="Close Mobile Menu"
                  className="rounded-xl p-2 bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors focus-ring active:scale-95"
                >
                  <X className="size-5 text-zinc-500 dark:text-zinc-400" />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto py-6 px-4 custom-scrollbar">
                <nav className="space-y-8" aria-label="Mobile Navigation Drawer">
                  <div>
                    <h3 className="px-3.5 mb-3 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <span className="h-px bg-zinc-200 dark:bg-zinc-700 flex-1" /> Execution Utilities
                    </h3>
                    <div className="space-y-1 relative">
                      {utilities.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} className={({ isActive }) => cn(
                          "flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all text-[15px] font-semibold focus-ring",
                          isActive 
                            ? "bg-gradient-to-r from-brand-orange/10 to-transparent border-l-2 border-brand-orange text-brand-orange-dark dark:text-brand-orange-light dark:from-brand-orange/20" 
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50"
                        )}>
                          <Icon className={cn("size-5 shrink-0", isActive && "drop-shadow-sm")} /> 
                          <span className="tracking-tight">{label}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="px-3.5 mb-3 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <span className="h-px bg-zinc-200 dark:bg-zinc-700 flex-1" /> Comm-Link Grid
                    </h3>
                    <div className="space-y-1 relative">
                      {community.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} className={({ isActive }) => cn(
                          "flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all text-[15px] font-semibold focus-ring",
                          isActive 
                            ? "bg-gradient-to-r from-brand-orange/10 to-transparent border-l-2 border-brand-orange text-brand-orange-dark dark:text-brand-orange-light dark:from-brand-orange/20" 
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50"
                        )}>
                          <Icon className={cn("size-5 shrink-0", isActive && "drop-shadow-sm")} /> 
                          <span className="tracking-tight">{label}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </nav>
              </div>

              {/* Persistent Authentication Footer */}
              <div className="mt-auto border-t border-zinc-200/80 dark:border-zinc-800/80 p-4 bg-zinc-50/80 dark:bg-zinc-900/40 pb-safe backdrop-blur-md">
                {isLoading ? (
                  <div className="h-[60px] w-full animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800/80" />
                ) : user ? (
                  <div className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-white/80 px-3 py-3 dark:border-zinc-800/80 dark:bg-zinc-900/80 shadow-sm">
                    <Link to={`/profile/${user.username}`} className="flex items-center gap-3 overflow-hidden hover:opacity-80 transition-opacity flex-1 focus-ring rounded-lg">
                      <div className="flex size-10 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 shrink-0 shadow-inner">
                        {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : <User className="size-5 text-zinc-900 dark:text-zinc-100" />}
                      </div>
                      <div className="flex flex-col truncate pr-2">
                        <span className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">{user.username}</span>
                        <span className="text-[11px] font-bold text-brand-orange flex items-center gap-1 uppercase tracking-wider"><Flame className="size-3" /> {user.points} pts</span>
                      </div>
                    </Link>
                    <button onClick={handleLogout} className="text-zinc-400 hover:text-red-500 transition-colors p-2.5 rounded-xl hover:bg-red-500/10 focus-ring" title="Terminate Session">
                      <LogOut className="size-5" />
                    </button>
                  </div>
                ) : (
                  <NavLink to="/login" className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3.5 text-sm font-bold text-zinc-50 hover:bg-brand-orange dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-brand-orange dark:hover:text-white transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] active:scale-[0.98] focus-ring">
                    <LogIn className="size-5" /> Initialize Connection
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
