import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  CreditCard,
  Scissors,
  Globe,
  MapPin,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { Logo } from '../Logo';

type NavChild = { name: string; href: string; icon: React.ElementType };
type NavGroup = { name: string; children: NavChild[] };
type NavItem = { name: string; href: string; icon: React.ElementType };

const navigation: (NavItem | NavGroup)[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  {
    name: 'Card Tools',
    children: [
      { name: 'Bin Checker',   href: '/bin-checker',   icon: Search      },
      { name: 'Bin Extractor', href: '/bin-extractor', icon: Scissors    },
      { name: 'Card Checker',  href: '/card-checker',  icon: ShieldCheck },
      { name: 'Test Cards',    href: '/test-cards',    icon: CreditCard  },
    ],
  },
  {
    name: 'Network & Info',
    children: [
      { name: 'IP Check',      href: '/ip',      icon: Globe  },
      { name: 'Fake Address',  href: '/fake-address',  icon: MapPin },
    ],
  },
  { name: 'Community', href: '/', icon: MessageSquare },
];

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return 'children' in item;
}

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-60 flex-col lg:flex"
      style={{ background: 'rgba(9,9,11,0.85)', borderRight: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <Logo className="h-7 w-auto" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6 scrollbar-none">
        {navigation.map((item) =>
          isGroup(item) ? (
            <div key={item.name}>
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
                {item.name}
              </p>
              <div className="space-y-0.5">
                {item.children.map((child) => (
                  <SidebarLink key={child.href} item={child} active={location.pathname === child.href} />
                ))}
              </div>
            </div>
          ) : (
            <div key={(item as NavItem).href} className="space-y-0.5">
              <SidebarLink item={item as NavItem} active={location.pathname === (item as NavItem).href} />
            </div>
          )
        )}
      </nav>

      {/* Footer */}
      <div className="shrink-0 px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <a
          href="https://t.me/drkingbd"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all duration-200"
          style={{ color: '#38bdf8' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(56,189,248,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <MessageSquare className="h-4 w-4 shrink-0" />
          <span className="font-medium">Join Community</span>
          <ExternalLink className="ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
        </a>
      </div>
    </aside>
  );
};

const SidebarLink = ({ item, active }: { item: NavChild | NavItem; active: boolean }) => (
  <NavLink
    to={item.href}
    className="group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium outline-none transition-all duration-150"
    style={{
      color: active ? '#fff' : '#737373',
      background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
    }}
    onMouseEnter={e => {
      if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
      if (!active) e.currentTarget.style.color = '#d4d4d4';
    }}
    onMouseLeave={e => {
      if (!active) e.currentTarget.style.background = 'transparent';
      if (!active) e.currentTarget.style.color = '#737373';
    }}
  >
    {/* Active glow bar */}
    {active && (
      <span
        className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
        style={{ background: '#3b82f6', boxShadow: '0 0 10px rgba(59,130,246,0.7)' }}
      />
    )}

    <item.icon
      className="h-4 w-4 shrink-0 transition-colors duration-150"
      style={{ color: active ? '#60a5fa' : 'inherit' }}
    />
    <span>{item.name}</span>
  </NavLink>
);
