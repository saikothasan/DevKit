import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';

export function Layout() {
  return (
    // Replaced min-h-screen with min-h-dvh for accurate mobile viewport rendering
    <div className="relative min-h-dvh w-full bg-[#fafafa] dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-orange-500/30 selection:text-orange-900 dark:selection:text-orange-100 transition-colors duration-300">
      
      {/* Global Ambient Illumination (Hardware Accelerated) */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/5 blur-[120px] rounded-full pointer-events-none z-0 hidden md:block will-change-transform transform-gpu"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none z-0 hidden md:block will-change-transform transform-gpu"></div>

      {/* Desktop Navigation Node */}
      <Sidebar />
      
      {/* Primary Execution Viewport */}
      {/* min-w-0 prevents layout breakage from wide child elements */}
      <div className="flex min-h-dvh flex-col md:pl-64 lg:pl-72 transition-all duration-300 ease-in-out relative z-10 min-w-0">
        
        {/* Mobile Identity & Routing Header */}
        <MobileHeader />
        
        {/* Dynamic Payload Injection Area */}
        {/* Added pb-safe to prevent content from hiding behind iOS home indicator */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-10 pb-8 md:pb-12 pb-safe animation-fade-in relative flex flex-col min-w-0">
          <Outlet />
        </main>
        
      </div>
    </div>
  );
}
