import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { User, LogIn, Menu, X, LogOut, Flame, Crown, Zap } from 'lucide-react';
import { Logo } from '../Logo';
import { NAV_ITEMS } from '@/config/navigation';
import { useAuth } from '@/context/AuthContext';

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
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl px-4 dark:border-zinc-800/80 dark:bg-[#0a0a0a]/80 sm:px-6 md:hidden">
        <button 
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center justify-center rounded-xl p-2.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50 focus-visible:outline-none transition-colors active:scale-95"
        >
          <Menu className="size-5" />
          <span className="sr-only">Expand Navigation Matrix</span>
        </button>
        
        <NavLink to="/" className="flex items-center gap-2.5 font-black text-lg tracking-tight text-zinc-900 dark:text-white">
          <Logo className="size-6 text-orange-500 drop-shadow-sm" />
          Visatk
        </NavLink>
        
        {user && (
          <div className="ml-auto flex items-center gap-2">
            {user.isVip && (
              <div className="flex items-center justify-center size-8 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-500 shadow-inner">
                <Crown className="size-4" />
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-full text-xs font-bold border border-zinc-200 dark:border-zinc-800 shadow-sm">
               <Flame className="size-3.5 text-orange-500" /> {user.points}
            </div>
          </div>
        )}
      </header>

      {/* Cryptographic Overlay */}
      <div 
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      ></div>
      
      {/* Execution Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-white dark:bg-[#0a0a0a] shadow-2xl border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="flex h-16 items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 px-5 bg-zinc-50/50 dark:bg-zinc-900/20">
          <NavLink to="/" className="flex items-center gap-3 font-black text-lg tracking-tight text-zinc-900 dark:text-white">
            <Logo className="size-6 text-orange-500 drop-shadow-sm" />
            Visatk
          </NavLink>
          <button 
            onClick={() => setIsOpen(false)}
            className="rounded-xl p-2 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors active:scale-95 focus:outline-none border border-transparent dark:hover:border-zinc-700"
          >
            <X className="size-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
          <nav className="space-y-6">
            
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Execution Utilities</div>
              <div className="space-y-1">
                {utilities.map(({ to, icon: Icon, label, external }) => (
                  external ? (
                    <a key={to} href={to} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100 font-bold text-sm">
                      <Icon className="size-4" /> {label}
                    </a>
                  ) : (
                    <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all font-bold text-sm ${isActive ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shadow-sm' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100 border border-transparent'}`}>
                      <Icon className="size-4" /> {label}
                    </NavLink>
                  )
                ))}
              </div>
            </div>
            
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Comm-Link Grid</div>
              <div className="space-y-1">
                {community.map(({ to, icon: Icon, label, external }) => (
                  external ? (
                    <a key={to} href={to} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all text-[#2AABEE] bg-[#2AABEE]/5 hover:bg-[#2AABEE]/10 font-bold border border-[#2AABEE]/20 shadow-sm text-sm mt-2">
                      <Icon className="size-4" /> {label}
                    </a>
                  ) : (
                    <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all font-bold text-sm ${isActive ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shadow-sm' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100 border border-transparent'}`}>
                      <Icon className="size-4" /> {label}
                    </NavLink>
                  )
                ))}
              </div>
            </div>
          </nav>

          {/* Dynamic VIP Upgrade Array */}
          {user && !user.isVip && (
            <div className="mt-8 px-1">
              <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-800 dark:to-zinc-900 p-5 rounded-2xl border border-zinc-700/50 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Crown className="size-20 text-orange-500" /></div>
                <h4 className="text-white font-black text-sm mb-1 flex items-center gap-1.5 z-10 relative"><Zap className="size-4 text-amber-400" /> Unlock Elite Node</h4>
                <p className="text-zinc-400 text-xs mb-4 z-10 relative leading-relaxed pr-4">Acquire lifetime priority execution and bypass all cryptographic locks.</p>
                <Link to="/vip" onClick={() => setIsOpen(false)} className="block w-full text-center bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold py-3 rounded-xl transition-colors z-10 relative shadow-md active:scale-[0.98]">Upgrade VIP</Link>
              </div>
            </div>
          )}
        </div>

        {/* Persistent Authentication Block */}
        <div className="mt-auto border-t border-zinc-200 dark:border-zinc-800/80 p-4 bg-zinc-50/50 dark:bg-zinc-900/20">
          {isLoading ? (
            <div className="h-14 w-full animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800/80"></div>
          ) : user ? (
            <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-3 py-3 dark:border-zinc-800 dark:bg-[#0a0a0a] shadow-sm">
              <Link to={`/profile/${user.username}`} onClick={() => setIsOpen(false)} className="flex items-center gap-3 overflow-hidden hover:opacity-80 transition-opacity flex-1">
                <div className="relative">
                  <div className={`flex size-10 items-center justify-center rounded-full shrink-0 shadow-inner border-2 ${user.isVip ? 'bg-orange-500/10 border-orange-500/50 text-orange-500' : 'bg-zinc-100 border-zinc-50 dark:bg-zinc-800 dark:border-zinc-900 text-zinc-900 dark:text-zinc-100'}`}>
                    {user.avatarUrl ? <img src={user.avatarUrl} alt="Visual ID" className="w-full h-full rounded-full object-cover" /> : <User className="size-5" />}
                  </div>
                  {user.isVip && <div className="absolute -top-1 -right-1 bg-zinc-900 border border-zinc-800 rounded-full p-0.5"><Crown className="size-3 text-orange-400" /></div>}
                </div>
                <div className="flex flex-col truncate pr-2">
                  <span className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">{user.username}</span>
                  <span className="text-[11px] font-bold text-orange-500 flex items-center gap-1 uppercase tracking-wider"><Flame className="size-3" /> {user.points} pts</span>
                </div>
              </Link>
              <button onClick={handleLogout} className="text-zinc-400 hover:text-red-500 transition-colors p-2.5 rounded-xl hover:bg-red-500/10 active:scale-95" title="Terminate Session">
                <LogOut className="size-5" />
              </button>
            </div>
          ) : (
            <NavLink to="/login" onClick={() => setIsOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3.5 text-sm font-bold text-zinc-50 hover:bg-orange-500 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-orange-500 dark:hover:text-white transition-all shadow-md active:scale-[0.98]">
              <LogIn className="size-4" /> Initialize Access
            </NavLink>
          )}
        </div>
      </div>
    </>
  );
}
