import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, User, Flame, Crown, Zap, ChevronRight } from 'lucide-react';
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
    <aside
      className="fixed inset-y-0 left-0 z-50 hidden md:flex h-dvh w-64 lg:w-72 flex-col pt-safe pl-safe pb-safe"
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)' }}
    >
      {/* Ambient top accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none" />

      {/* ── Logo Header ── */}
      <div className="relative flex h-[60px] items-center shrink-0 px-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <Logo className="size-7 text-orange-500 drop-shadow-sm transition-transform group-hover:scale-105" />
            <div className="absolute -inset-1 bg-orange-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span
            className="text-[17px] font-bold tracking-tight transition-colors group-hover:text-orange-500"
            style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}
          >
            Visatk
          </span>
        </NavLink>
      </div>

      {/* ── Navigation ── */}
      <div className="relative flex-1 overflow-y-auto py-5 px-3 custom-scrollbar">
        <nav className="space-y-5">

          {/* Utilities */}
          <section>
            <div
              className="px-2 mb-2 badge-mono flex items-center gap-2"
              style={{ color: 'var(--text-muted)' }}
            >
              <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
              Utilities
              <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
            </div>
            <div className="space-y-0.5">
              {utilities.map(({ to, icon: Icon, label, external }) =>
                external ? (
                  <a key={to} href={to} target="_blank" rel="noopener noreferrer" className="nav-item nav-item-inactive">
                    <span className="flex size-7 items-center justify-center rounded-md" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                      <Icon className="size-3.5" />
                    </span>
                    <span className="flex-1">{label}</span>
                    <ChevronRight className="size-3 opacity-30" />
                  </a>
                ) : (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className="flex size-7 items-center justify-center rounded-md transition-colors"
                          style={{
                            background: isActive ? 'rgba(243,128,32,0.15)' : 'var(--surface-raised)',
                            border: `1px solid ${isActive ? 'var(--orange-border)' : 'var(--border)'}`,
                          }}
                        >
                          <Icon className="size-3.5" style={{ color: isActive ? 'var(--orange)' : 'inherit' }} />
                        </span>
                        <span className="flex-1">{label}</span>
                      </>
                    )}
                  </NavLink>
                )
              )}
            </div>
          </section>

          {/* Community */}
          <section>
            <div
              className="px-2 mb-2 badge-mono flex items-center gap-2"
              style={{ color: 'var(--text-muted)' }}
            >
              <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
              Community
              <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
            </div>
            <div className="space-y-0.5">
              {community.map(({ to, icon: Icon, label, external, badge }) =>
                external ? (
                  <a
                    key={to}
                    href={to}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-item"
                    style={{ color: '#2AABEE', background: 'rgba(42,171,238,0.06)', borderColor: 'rgba(42,171,238,0.2)' }}
                  >
                    <span className="flex size-7 items-center justify-center rounded-md" style={{ background: 'rgba(42,171,238,0.12)', border: '1px solid rgba(42,171,238,0.25)' }}>
                      <Icon className="size-3.5" />
                    </span>
                    <span className="flex-1">{label}</span>
                    <ChevronRight className="size-3 opacity-50" />
                  </a>
                ) : (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className="flex size-7 items-center justify-center rounded-md transition-colors"
                          style={{
                            background: isActive ? 'rgba(243,128,32,0.15)' : 'var(--surface-raised)',
                            border: `1px solid ${isActive ? 'var(--orange-border)' : 'var(--border)'}`,
                          }}
                        >
                          <Icon className="size-3.5" style={{ color: isActive ? 'var(--orange)' : 'inherit' }} />
                        </span>
                        <span className="flex-1">{label}</span>
                        {badge && (
                          <span className="badge-mono px-1.5 py-0.5 rounded text-emerald-500" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                )
              )}
            </div>
          </section>
        </nav>

        {/* VIP Upgrade Banner */}
        {user && !user.isVip && (
          <div className="mt-6 mx-1">
            <div
              className="relative overflow-hidden rounded-xl p-4 group"
              style={{ background: 'linear-gradient(135deg, #1A1028 0%, #0F0A1E 100%)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              {/* Glow */}
              <div className="absolute -top-6 -right-6 size-24 bg-amber-500/20 rounded-full blur-2xl group-hover:bg-amber-500/30 transition-colors" />
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-2">
                  <Crown className="size-4 text-amber-400" />
                  <span className="text-sm font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Unlock Elite</span>
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Lifetime access to locked content &amp; priority status.
                </p>
                <Link
                  to="/vip"
                  className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-bold text-white transition-all hover:gap-2.5"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #F38020)' }}
                >
                  <Zap className="size-3.5" /> Upgrade VIP
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── User Footer ── */}
      <div
        className="relative shrink-0 p-3"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        {isLoading ? (
          <div className="h-12 rounded-xl skeleton" />
        ) : user ? (
          <div
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 group"
            style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
          >
            <Link to={`/profile/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
              <div className="relative shrink-0">
                <div
                  className="size-9 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    background: user.isVip ? 'rgba(243,128,32,0.12)' : 'var(--surface)',
                    border: `2px solid ${user.isVip ? 'rgba(243,128,32,0.4)' : 'var(--border-strong)'}`,
                  }}
                >
                  {user.avatarUrl
                    ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    : <User className="size-4" style={{ color: 'var(--text-secondary)' }} />
                  }
                </div>
                {user.isVip && (
                  <div className="absolute -top-1 -right-1 rounded-full p-0.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <Crown className="size-2.5 text-amber-400" />
                  </div>
                )}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{user.username}</span>
                <span className="flex items-center gap-1 text-xs font-semibold text-orange-500">
                  <Flame className="size-3" /> {user.points} pts
                </span>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="shrink-0 p-2 rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-500"
              style={{ color: 'var(--text-muted)' }}
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        ) : (
          <NavLink
            to="/login"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all hover:gap-3 active:scale-[0.98]"
            style={{ background: 'var(--text-primary)', color: 'var(--bg)' }}
          >
            <LogIn className="size-4" /> Sign In
          </NavLink>
        )}
      </div>
    </aside>
  );
}
