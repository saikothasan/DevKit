import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, User, Flame, Crown, Zap, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '../Logo';
import { NAV_ITEMS } from '@/config/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';

export function Sidebar({ isMobile = false }: { isMobile?: boolean }) {
  const utilities = NAV_ITEMS.filter(item => item.group === 'Utilities');
  const community = NAV_ITEMS.filter(item => item.group === 'Community');
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const NavItemRender = ({ item }: { item: typeof NAV_ITEMS[0] }) => {
    const { to, icon: Icon, label, external } = item;
    const baseClass = "flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all font-semibold text-sm relative z-10 focus-ring group select-none";

    if (external) {
      return (
        <a 
          href={to} 
          target="_blank" 
          rel="noopener noreferrer" 
          aria-label={`${label} (opens in new tab)`}
          className={cn(baseClass, "text-[#2AABEE] bg-[#2AABEE]/5 hover:bg-[#2AABEE]/15 border border-[#2AABEE]/10 shadow-sm mt-3 backdrop-blur-sm")}
        >
          <Icon className="size-4.5 shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" /> 
          <span className="flex-1">{label}</span>
          <ExternalLink className="size-3.5 opacity-60" />
        </a>
      );
    }

    return (
      <NavLink 
        to={to} 
        className={({ isActive }) => cn(
          baseClass, 
          isActive 
            ? "text-brand-orange dark:text-brand-orange-light" 
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100"
        )}
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <motion.div 
                layoutId="sidebar-active-indicator" 
                className="absolute inset-0 bg-gradient-to-r from-brand-orange/10 to-transparent border-l-2 border-brand-orange rounded-xl -z-10 dark:from-brand-orange/20" 
                transition={{ type: "spring", stiffness: 350, damping: 30 }} 
              />
            )}
            <Icon className={cn("size-4.5 shrink-0 transition-all duration-300", isActive ? "scale-110 drop-shadow-md" : "group-hover:scale-110")} /> 
            <span className="tracking-tight">{label}</span>
          </>
        )}
      </NavLink>
    );
  };

  return (
    <aside 
      aria-label="Main Navigation"
      className={cn(
        "flex flex-col h-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-3xl border-zinc-200 dark:border-zinc-800/80 transform-gpu shadow-2xl shadow-zinc-200/20 dark:shadow-none",
        !isMobile && "fixed inset-y-0 left-0 z-50 w-64 lg:w-72 border-r hidden md:flex"
      )}
    >
      {/* Identity Node Header */}
      <div className="flex h-[72px] items-center border-b border-zinc-200/80 dark:border-zinc-800/80 px-6 shrink-0 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-orange/50 to-transparent opacity-50" />
        <NavLink to="/" aria-label="DevKit Pro Home" className="flex items-center gap-3 font-black text-xl hover:opacity-80 transition-opacity tracking-tight text-zinc-900 dark:text-white focus-ring rounded-lg group">
          <div className="relative">
             <div className="absolute inset-0 bg-brand-orange blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
             <Logo className="size-8 text-brand-orange drop-shadow-md relative z-10 transform transition-transform group-hover:scale-105" />
          </div>
          DevKit<span className="text-brand-orange font-normal">Pro</span>
        </NavLink>
      </div>
      
      {/* Navigation Vectors */}
      <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
        <nav className="space-y-8" aria-label="Sidebar Menu">
          <div>
            <h2 id="nav-utilities" className="px-3.5 mb-3 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest select-none flex items-center gap-2">
              <span className="h-px bg-zinc-200 dark:bg-zinc-700 flex-1" /> Execution Utilities
            </h2>
            <div className="space-y-1 relative" aria-labelledby="nav-utilities">
              {utilities.map((item) => <NavItemRender key={item.to} item={item} />)}
            </div>
          </div>
          
          <div>
            <h2 id="nav-community" className="px-3.5 mb-3 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest select-none flex items-center gap-2">
              <span className="h-px bg-zinc-200 dark:bg-zinc-700 flex-1" /> Comm-Link Grid
            </h2>
            <div className="space-y-1 relative" aria-labelledby="nav-community">
              {community.map((item) => <NavItemRender key={item.to} item={item} />)}
            </div>
          </div>
        </nav>

        {user && !user.isVip && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, type: 'spring' }} className="mt-10 px-1">
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 dark:from-zinc-800 dark:to-zinc-900 p-5 rounded-2xl border border-zinc-700/50 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150" />
              <div className="absolute -top-6 -right-6 p-2 opacity-10 group-hover:opacity-20 transition-all duration-700 transform group-hover:rotate-12 group-hover:scale-110">
                <Crown className="size-32 text-brand-orange" />
              </div>
              <h4 className="text-white font-black text-sm mb-1.5 flex items-center gap-2 z-10 relative">
                <Zap className="size-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" /> Unlock Elite Node
              </h4>
              <p className="text-zinc-400 text-[13px] mb-4 z-10 relative leading-relaxed font-medium">Acquire lifetime priority & bypass execution limits.</p>
              <Link to="/vip" className="block w-full text-center bg-brand-orange hover:bg-brand-orange-light text-white text-[13px] font-bold py-2.5 rounded-xl transition-all z-10 relative shadow-[0_4px_14px_0_rgba(243,128,32,0.39)] hover:shadow-[0_6px_20px_rgba(243,128,32,0.23)] hover:-translate-y-0.5 active:translate-y-0 focus-ring">
                Deploy VIP Protocol
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      {/* Persistent Authentication State Footer */}
      <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 shrink-0 backdrop-blur-md">
        {isLoading ? (
          <div className="h-[60px] w-full animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800/80" role="status" aria-label="Loading user data" />
        ) : user ? (
          <div className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-white/80 px-3 py-3 dark:border-zinc-800/80 dark:bg-zinc-900/80 shadow-sm backdrop-blur-lg">
            <Link to={`/profile/${user.username}`} aria-label={`View profile for ${user.username}`} className="flex items-center gap-3 overflow-hidden hover:opacity-80 transition-opacity flex-1 focus-ring rounded-lg group">
              <div className="relative">
                <div className={cn("flex size-10 items-center justify-center rounded-full shrink-0 shadow-inner border-2 transition-colors", user.isVip ? "bg-brand-orange/10 border-brand-orange/50 text-brand-orange" : "bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100")}>
                  {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : <User className="size-5" />}
                </div>
                {user.isVip && <div className="absolute -top-1.5 -right-1.5 bg-zinc-950 border border-zinc-800 rounded-full p-0.5 shadow-lg"><Crown className="size-3.5 text-amber-400" /></div>}
              </div>
              <div className="flex flex-col truncate pr-2">
                <span className="truncate text-[13px] font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-brand-orange transition-colors">{user.username}</span>
                <span className="text-[11px] font-bold text-brand-orange flex items-center gap-1 uppercase tracking-wider"><Flame className="size-3" /> {user.points} pts</span>
              </div>
            </Link>
            <button onClick={handleLogout} aria-label="Log out" className="text-zinc-400 hover:text-red-500 transition-colors p-2.5 rounded-xl hover:bg-red-500/10 focus-ring ml-1" title="Terminate Session">
              <LogOut className="size-4.5" />
            </button>
          </div>
        ) : (
          <NavLink to="/login" className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3.5 text-[13px] font-bold text-zinc-50 hover:bg-brand-orange dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-brand-orange dark:hover:text-white transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] active:scale-[0.98] focus-ring">
            <LogIn className="size-4.5" /> Initialize Connection
          </NavLink>
        )}
      </div>
    </aside>
  );
}
