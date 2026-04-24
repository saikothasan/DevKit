import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { Footer } from './Footer';

// Fallback loader to prevent layout shifts during chunk fetching
const RouteFallback = () => (
  <div className="flex-1 w-full h-full flex items-center justify-center min-h-[50vh]">
    <div className="size-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
  </div>
);

export function Layout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen w-full bg-zinc-50/30 dark:bg-[#0a0a0a] overflow-hidden selection:bg-orange-500/30">
      {/* Desktop Navigation Landmark */}
      <Sidebar />
      
      {/* Primary Application Surface */}
      <div className="flex flex-col flex-1 w-full md:pl-64 lg:pl-72 transition-all duration-300 h-screen overflow-y-auto custom-scrollbar relative bg-grid-zinc-100 dark:bg-grid-zinc-900/10">
        <MobileHeader />
        
        {/* Route Transition Engine optimized for Edge delivery */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.main 
            key={location.pathname}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pt-6 flex flex-col will-change-[opacity,transform]"
            role="main"
          >
            <Suspense fallback={<RouteFallback />}>
              <Outlet />
            </Suspense>
          </motion.main>
        </AnimatePresence>
        
        <Footer />
      </div>
    </div>
  );
}
