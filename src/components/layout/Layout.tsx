import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { Footer } from './Footer';

export function Layout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen w-full bg-zinc-50/30 dark:bg-[#0a0a0a] overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Content Wrapper */}
      <div className="flex flex-col flex-1 w-full md:pl-64 lg:pl-72 transition-all duration-300 h-screen overflow-y-auto custom-scrollbar relative">
        <MobileHeader />
        
        {/* Route Transition Engine */}
        <AnimatePresence mode="wait">
          <motion.main 
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pt-6 flex flex-col"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
        
        <Footer />
      </div>
    </div>
  );
}
