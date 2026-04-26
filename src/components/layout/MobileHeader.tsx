import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { User, LogIn, Menu, X, LogOut, Flame, Crown, Zap, ChevronRight } from 'lucide-react';
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
    document.body.style.overflow = isOpen ? 'hidden' : '';
    document.body.style.touchAction = isOpen ? 'none' : '';
    return () => { document.body.style.overflow = ''; document.body.style.touchAction = ''; };
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const NavSection = ({ items, label }: { items: typeof utilities; label: string }) => (
    <div>
      <div
        className="px-3 mb-1.5 badge-mono flex items-center gap-2"
        style={{ color: 'var(--text-muted)' }}
      >
        <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
        {label}
        <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
      </div>
      <div className="space-y-0.5">
        {items.map(({ to, icon: Icon, label: itemLabel, external, badge }) =>
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
              <span className="flex-1 text-sm">{itemLabel}</span>
              <ChevronRight className="size-3.5 opacity-50" />
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
                  <span className="flex-1 text-sm">{itemLabel}</span>
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
    </div>
  );

  return (
    <>
      {/* ── Sticky Top Bar ── */}
      <header
        className="sticky top-0 z-40 flex h-14 pt-safe items-center gap-3 px-4 sm:px-5 md:hidden"
        style={{ background: 'var(--surface-glass)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', borderBottom: '1px solid var(--border)' }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center size-9 rounded-xl transition-colors active:scale-95 focus-ring"
          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          aria-label="Open menu"
        >
          <Menu className="size-4.5" />
        </button>

        <NavLink to="/" className="flex items-center gap-2 group">
          <Logo className="size-6 text-orange-500" />
          <span
            className="text-base font-bold tracking-tight transition-colors group-hover:text-orange-500"
            style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}
          >
            Visatk
          </span>
        </NavLink>

        {/* Right side user info */}
        <div className="ml-auto flex items-center gap-2">
          {!isLoading && user && (
            <>
              {user.isVip && (
                <div
                  className="flex size-7 items-center justify-center rounded-full"
                  style={{ background: 'rgba(243,128,32,0.1)', border: '1px solid rgba(243,128,32,0.3)' }}
                >
                  <Crown className="size-3.5 text-amber-400" />
                </div>
              )}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full badge-mono text-orange-500"
                style={{ background: 'rgba(243,128,32,0.1)', border: '1px solid rgba(243,128,32,0.2)' }}
              >
                <Flame className="size-3" /> {user.points}
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Backdrop ── */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* ── Side Drawer ── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[82%] max-w-[320px] h-dvh flex flex-col md:hidden transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-orange-500/80 via-amber-400/50 to-transparent" />

        {/* Drawer Header */}
        <div
          className="flex h-14 pt-safe items-center justify-between px-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}
        >
          <NavLink to="/" className="flex items-center gap-2">
            <Logo className="size-6 text-orange-500" />
            <span className="text-base font-bold" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>Visatk</span>
          </NavLink>
          <button
            onClick={() => setIsOpen(false)}
            className="flex size-8 items-center justify-center rounded-lg transition-colors active:scale-95"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Drawer Nav Content */}
        <div className="flex-1 overflow-y-auto py-5 px-3 custom-scrollbar pl-safe space-y-5">
          <NavSection items={utilities} label="Utilities" />
          <NavSection items={community} label="Community" />

          {/* VIP Banner */}
          {user && !user.isVip && (
            <div
              className="relative overflow-hidden rounded-xl p-4 group mt-2"
              style={{ background: 'linear-gradient(135deg, #1A1028 0%, #0F0A1E 100%)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              <div className="absolute -top-6 -right-6 size-24 bg-amber-500/20 rounded-full blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Crown className="size-4 text-amber-400" />
                  <span className="text-sm font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Unlock Elite</span>
                </div>
                <p className="text-xs mb-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Lifetime access to locked content &amp; priority status.
                </p>
                <Link
                  to="/vip"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg text-xs font-bold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #F38020)' }}
                >
                  <Zap className="size-3.5" /> Upgrade to VIP
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div
          className="shrink-0 p-3 pb-safe"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-raised)' }}
        >
          {isLoading ? (
            <div className="h-12 rounded-xl skeleton" />
          ) : user ? (
            <div
              className="flex items-center gap-3 rounded-xl px-3 py-2.5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <Link
                to={`/profile/${user.username}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
              >
                <div className="relative shrink-0">
                  <div
                    className="size-9 rounded-full flex items-center justify-center overflow-hidden"
                    style={{
                      background: user.isVip ? 'rgba(243,128,32,0.12)' : 'var(--surface-raised)',
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
                className="shrink-0 p-2 rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-500 active:scale-95"
                style={{ color: 'var(--text-muted)' }}
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
              style={{ background: 'var(--text-primary)', color: 'var(--bg)' }}
            >
              <LogIn className="size-4" /> Sign In
            </NavLink>
          )}
        </div>
      </div>
    </>
  );
}
