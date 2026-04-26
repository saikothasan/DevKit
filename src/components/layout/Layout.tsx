import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { Footer } from './Footer';

export function Layout() {
  return (
    <div
      className="relative min-h-dvh w-full transition-colors duration-300"
      style={{ background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Global ambient lighting - GPU accelerated */}
      <div className="fixed top-[-15%] left-[-5%] w-[45%] h-[45%] rounded-full pointer-events-none z-0 will-change-transform transform-gpu hidden md:block"
        style={{ background: 'radial-gradient(circle, rgba(243,128,32,0.04) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="fixed bottom-[-15%] right-[-5%] w-[35%] h-[35%] rounded-full pointer-events-none z-0 will-change-transform transform-gpu hidden md:block"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.03) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main viewport — offset by sidebar width on md+ */}
      <div className="flex min-h-dvh flex-col md:pl-64 lg:pl-72 relative z-10 min-w-0">
        
        {/* Mobile Header */}
        <MobileHeader />

        {/* Page Content */}
        <main className="flex-1 w-full max-w-[1500px] mx-auto px-4 py-5 sm:px-5 md:px-8 md:py-8 pb-safe min-w-0 animation-fade-in">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}
