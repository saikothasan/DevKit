import React from 'react';
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
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '../Logo';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { 
    name: 'Card Tools', 
    children: [
      { name: 'Bin Checker', href: '/bin-checker', icon: Search },
      { name: 'Bin Extractor', href: '/bin-extractor', icon: Scissors },
      { name: 'Card Checker', href: '/card-checker', icon: ShieldCheck },
      { name: 'Test Cards', href: '/test-cards', icon: CreditCard },
    ]
  },
  { 
    name: 'Network & Info', 
    children: [
      { name: 'IP Check', href: '/ip-check', icon: Globe },
      { name: 'Fake Address', href: '/fake-address', icon: MapPin },
    ]
  },
  { name: 'Community', href: '/forum', icon: MessageSquare },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-white/5 bg-neutral-950/50 backdrop-blur-xl lg:flex">
      <div className="flex h-16 items-center px-6 border-b border-white/5">
        <Logo className="h-8 w-auto" />
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-none">
        {navigation.map((item) => (
          <div key={item.name} className="space-y-1">
            {item.children ? (
              <>
                <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  {item.name}
                </h3>
                <div className="mt-2 space-y-1">
                  {item.children.map((child) => (
                    <SidebarItem key={child.name} item={child} isActive={location.pathname === child.href} />
                  ))}
                </div>
              </>
            ) : (
              <SidebarItem item={item} isActive={location.pathname === item.href} />
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 bg-neutral-900/20">
        <a 
          href="https://t.me/drkingbd" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2 text-sm text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors group"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Join Community</span>
          <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-all" />
        </a>
      </div>
    </aside>
  );
};

const SidebarItem = ({ item, isActive }: { item: any, isActive: boolean }) => (
  <NavLink
    to={item.href}
    className={cn(
      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 group",
      isActive 
        ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
        : "text-neutral-400 hover:text-white hover:bg-white/5"
    )}
  >
    <item.icon className={cn(
      "w-4 h-4 transition-colors",
      isActive ? "text-blue-400" : "group-hover:text-neutral-200"
    )} />
    {item.name}
    {isActive && (
      <div className="ml-auto w-1 h-4 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
    )}
  </NavLink>
);
