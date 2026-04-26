import { type LucideIcon } from 'lucide-react';

interface ToolPageHeaderProps {
  badge: string;
  badgeIcon: LucideIcon;
  title: string;
  description: string;
}

export function ToolPageHeader({ badge, badgeIcon: BadgeIcon, title, description }: ToolPageHeaderProps) {
  return (
    <div className="mb-8">
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full badge-mono mb-4"
        style={{ background: 'var(--orange-dim)', border: '1px solid var(--orange-border)', color: 'var(--orange)' }}
      >
        <BadgeIcon className="size-3" />
        {badge}
      </div>
      <h1
        className="text-3xl sm:text-4xl font-bold tracking-tight mb-3"
        style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}
      >
        {title}
      </h1>
      <p className="text-sm sm:text-base max-w-2xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {description}
      </p>
    </div>
  );
}

interface ToolCardProps {
  children: React.ReactNode;
  className?: string;
}

export function ToolCard({ children, className = '' }: ToolCardProps) {
  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
    >
      <div className="h-px w-full bg-gradient-to-r from-orange-500/60 via-amber-400/30 to-transparent" />
      {children}
    </div>
  );
}
