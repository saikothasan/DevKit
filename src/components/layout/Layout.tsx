import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';
import { Loader2 } from 'lucide-react';

// Premium Route Fallback Loader
const RouteFallback = () => (
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }}
    className="flex-1 w-full h-full flex flex-col items-center justify-center min-h-[60vh] gap-4"
  >
    <div className="relative flex items-center justify-center">
      <div className="absolute inset-0 bg-brand-orange/20 blur-xl rounded-full" />
      <Loader2 className="size-8 text-brand-orange animate-spin relative z-10" />
    </div>
    <p className="text-sm font-medium text-zinc-500 animate-pulse tracking-wide">
      Establishing secure connection...
    </p>
  </motion.div>
);

export function Layout() {
  const location = useLocation();

  return (
    <div className="flex min-h-[100dvh] w-full bg-[var(--bg-primary)] overflow-hidden">
      {/* Ambient Background Grid */}
      <div className="fixed inset-0 pointer-events-none bg-grid-pattern z-0" />
      
      {/* Desktop Navigation Landmark */}
      <Sidebar />
      
      {/* Primary Application Surface */}
      <div className="flex flex-col flex-1 w-full md:pl-64 lg:pl-72 transition-all duration-500 ease-spring h-[100dvh] overflow-y-auto custom-scrollbar relative z-10">
        <MobileHeader />
        
        {/* Route Transition Engine */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.main 
            key={location.pathname}
            initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-6 pb-28 md:pb-12 flex flex-col will-change-[opacity,transform,filter]"
            role="main"
          >
            <Suspense fallback={<RouteFallback />}>
              <Outlet />
            </Suspense>
          </motion.main>
        </AnimatePresence>
        
        <div className="pb-20 md:pb-0 px-safe">
          <Footer />
        </div>
      </div>

      {/* Native App-like Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
