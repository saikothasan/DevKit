import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer
      className="mt-auto py-6 px-4 sm:px-6 md:px-8"
      style={{ borderTop: '1px solid var(--border)' }}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        
        <div className="flex items-center gap-2">
          <span className="badge-mono">© {new Date().getFullYear()} Visatk.us</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">All rights reserved</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link to="/privacy" className="hover:text-orange-500 transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-orange-500 transition-colors">Terms of Service</Link>
          
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full badge-mono"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981' }}
          >
            <span className="relative flex size-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500" />
            </span>
            All Systems Operational
          </div>
        </div>
      </div>
    </footer>
  );
}
