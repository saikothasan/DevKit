import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, User, Flame, Crown, Zap } from 'lucide-react';
import { Logo } from '../Logo';
import { NAV_ITEMS } from '@/config/navigation';
import { useAuth } from '@/context/AuthContext';

export function Sidebar() {
  const utilities = NAV_ITEMS.filter(item => item.group === 'Utilities');
  const community = NAV_ITEMS.filter(item => item.group === 'Community');
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden md:flex h-full w-64 lg:w-72 flex-col border-r border-zinc-200 bg-white/80 dark:border-zinc-800/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl">
      {/* Identity Node Header */}
      <div className="flex h-16 items-center border-b border-zinc-200 dark:border-zinc-800/80 px-6">
        <NavLink to="/" className="flex items-center gap-3 font-black text-lg hover:opacity-80 transition-opacity tracking-tight text-zinc-900 dark:text-white">
          <Logo className="size-7 text-orange-500 drop-shadow-sm" />
          Visatk
        </NavLink>
      </div>
      
      {/* Navigation Vectors */}
      <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
        <nav className="space-y-6">
          
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Utilities</div>
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

        {/* Dynamic VIP Upgrade Banner for Standard Nodes */}
        {user && !user.isVip && (
          <div className="mt-8 px-1">
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-800 dark:to-zinc-900 p-4 rounded-2xl border border-zinc-700/50 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Crown className="size-16 text-orange-500" /></div>
              <h4 className="text-white font-black text-sm mb-1 flex items-center gap-1.5 z-10 relative"><Zap className="size-3.5 text-amber-400" /> Unlock Elite Node</h4>
              <p className="text-zinc-400 text-xs mb-3 z-10 relative leading-relaxed">Acquire lifetime priority bypassing execution.</p>
              <Link to="/vip" className="block w-full text-center bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold py-2.5 rounded-lg transition-colors z-10 relative shadow-md">Upgrade VIP</Link>
            </div>
          </div>
        )}
      </div>

      {/* Persistent Authentication State Footer */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20">
        {isLoading ? (
          <div className="h-14 w-full animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800/80"></div>
        ) : user ? (
          <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-[#0a0a0a] shadow-sm">
            <Link to={`/profile/${user.username}`} className="flex items-center gap-3 overflow-hidden hover:opacity-80 transition-opacity flex-1">
              <div className="relative">
                <div className={`flex size-10 items-center justify-center rounded-full shrink-0 shadow-inner border-2 ${user.isVip ? 'bg-orange-500/10 border-orange-500/50 text-orange-500' : 'bg-zinc-100 border-zinc-50 dark:bg-zinc-800 dark:border-zinc-900 text-zinc-900 dark:text-zinc-100'}`}>
                  {user.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : <User className="size-5" />}
                </div>
                {user.isVip && <div className="absolute -top-1 -right-1 bg-zinc-900 border border-zinc-800 rounded-full p-0.5"><Crown className="size-3 text-orange-400" /></div>}
              </div>
              <div className="flex flex-col truncate pr-2">
                <span className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">{user.username}</span>
                <span className="text-[11px] font-bold text-orange-500 flex items-center gap-1 uppercase tracking-wider"><Flame className="size-3" /> {user.points} pts</span>
              </div>
            </Link>
            <button onClick={handleLogout} className="text-zinc-400 hover:text-red-500 transition-colors p-2.5 rounded-xl hover:bg-red-500/10" title="Terminate Session">
              <LogOut className="size-4" />
            </button>
          </div>
        ) : (
          <NavLink to="/login" className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3.5 text-sm font-bold text-zinc-50 hover:bg-orange-500 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-orange-500 dark:hover:text-white transition-all shadow-md active:scale-[0.98]">
            <LogIn className="size-4" /> Initialize Connection
          </NavLink>
        )}
      </div>
    </aside>
  );
}
