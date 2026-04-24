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
    const baseClass = "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all font-semibold text-sm relative z-10 focus-ring group";

    if (external) {
      return (
        <a 
          href={to} 
          target="_blank" 
          rel="noopener noreferrer" 
          aria-label={`${label} (opens in new tab)`}
          className={cn(baseClass, "text-[#2AABEE] bg-[#2AABEE]/5 hover:bg-[#2AABEE]/10 border border-[#2AABEE]/20 shadow-sm mt-2")}
        >
          <Icon className="size-4 shrink-0 transition-transform group-hover:scale-110" /> 
          <span className="flex-1">{label}</span>
          <ExternalLink className="size-3.5 opacity-50" />
        </a>
      );
    }

    return (
      <NavLink 
        to={to} 
        className={({ isActive }) => cn(
          baseClass, 
          isActive 
            ? "text-orange-600 dark:text-orange-400" 
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100"
        )}
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <motion.div 
                layoutId="sidebar-active" 
                className="absolute inset-0 bg-orange-500/10 border border-orange-500/20 rounded-xl shadow-sm -z-10" 
                transition={{ type: "spring", stiffness: 300, damping: 30 }} 
              />
            )}
            <Icon className={cn("size-4 shrink-0 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} /> 
            <span>{label}</span>
          </>
        )}
      </NavLink>
    );
  };

  return (
    <aside 
      aria-label="Main Navigation"
      className={cn(
        "flex flex-col h-full bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-zinc-200 dark:border-zinc-800/80 transform-gpu",
        !isMobile && "fixed inset-y-0 left-0 z-50 w-64 lg:w-72 border-r hidden md:flex"
      )}
    >
      {/* Identity Node Header */}
      <div className="flex h-16 items-center border-b border-zinc-200 dark:border-zinc-800/80 px-6 shrink-0">
        <NavLink to="/" aria-label="DevKit Pro Home" className="flex items-center gap-3 font-black text-lg hover:opacity-80 transition-opacity tracking-tight text-zinc-900 dark:text-white focus-ring rounded-md">
          <Logo className="size-7 text-orange-500 drop-shadow-sm" />
          DevKit Pro
        </NavLink>
      </div>
      
      {/* Navigation Vectors */}
      <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
        <nav className="space-y-8" aria-label="Sidebar Menu">
          <div>
            <h2 id="nav-utilities" className="px-3 mb-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest select-none">Execution Utilities</h2>
            <div className="space-y-1 relative" aria-labelledby="nav-utilities">
              {utilities.map((item) => <NavItemRender key={item.to} item={item} />)}
            </div>
          </div>
          
          <div>
            <h2 id="nav-community" className="px-3 mb-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest select-none">Comm-Link Grid</h2>
            <div className="space-y-1 relative" aria-labelledby="nav-community">
              {community.map((item) => <NavItemRender key={item.to} item={item} />)}
            </div>
          </div>
        </nav>

        {user && !user.isVip && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 px-1">
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-800 dark:to-zinc-900 p-4 rounded-2xl border border-zinc-700/50 shadow-xl relative overflow-hidden group">
              <div className="absolute -top-4 -right-4 p-2 opacity-10 group-hover:opacity-20 transition-opacity duration-500 transform group-hover:rotate-12">
                <Crown className="size-24 text-orange-500" />
              </div>
              <h4 className="text-white font-black text-sm mb-1 flex items-center gap-1.5 z-10 relative"><Zap className="size-3.5 text-amber-400" /> Unlock Elite Node</h4>
              <p className="text-zinc-400 text-xs mb-3 z-10 relative leading-relaxed">Acquire lifetime priority bypassing execution.</p>
              <Link to="/vip" className="block w-full text-center bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold py-2.5 rounded-lg transition-all z-10 relative shadow-md active:scale-[0.98] focus-ring">
                Deploy VIP Protocol
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      {/* Persistent Authentication State Footer */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20 shrink-0">
        {isLoading ? (
          <div className="h-14 w-full animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800/80" role="status" aria-label="Loading user data" />
        ) : user ? (
          <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-[#0a0a0a] shadow-sm">
            <Link to={`/profile/${user.username}`} aria-label={`View profile for ${user.username}`} className="flex items-center gap-3 overflow-hidden hover:opacity-80 transition-opacity flex-1 focus-ring rounded-lg">
              <div className="relative">
                <div className={cn("flex size-10 items-center justify-center rounded-full shrink-0 shadow-inner border-2", user.isVip ? "bg-orange-500/10 border-orange-500/50 text-orange-500" : "bg-zinc-100 border-zinc-50 dark:bg-zinc-800 dark:border-zinc-900 text-zinc-900 dark:text-zinc-100")}>
                  {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : <User className="size-5" />}
                </div>
                {user.isVip && <div className="absolute -top-1 -right-1 bg-zinc-900 border border-zinc-800 rounded-full p-0.5"><Crown className="size-3 text-orange-400" /></div>}
              </div>
              <div className="flex flex-col truncate pr-2">
                <span className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">{user.username}</span>
                <span className="text-[11px] font-bold text-orange-500 flex items-center gap-1 uppercase tracking-wider"><Flame className="size-3" /> {user.points} pts</span>
              </div>
            </Link>
            <button onClick={handleLogout} aria-label="Log out" className="text-zinc-400 hover:text-red-500 transition-colors p-2.5 rounded-xl hover:bg-red-500/10 focus-ring" title="Terminate Session">
              <LogOut className="size-4" />
            </button>
          </div>
        ) : (
          <NavLink to="/login" className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3.5 text-sm font-bold text-zinc-50 hover:bg-orange-500 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-orange-500 dark:hover:text-white transition-all shadow-md active:scale-[0.98] focus-ring">
            <LogIn className="size-4" /> Initialize Connection
          </NavLink>
        )}
      </div>
    </aside>
  );
}
