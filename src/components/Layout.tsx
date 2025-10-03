import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomNav } from './navigation/BottomNav';
import { QuickLogFAB } from './navigation/QuickLogFAB';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Main Layout Component
 *
 * Mobile-first layout with bottom navigation and FAB
 * Screen transitions with framer-motion
 * Respects prefers-reduced-motion
 */
function Layout({ children }: LayoutProps) {
  const location = useLocation();

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Page transition variants
  const pageVariants = {
    initial: {
      opacity: prefersReducedMotion ? 1 : 0,
      y: prefersReducedMotion ? 0 : 20,
    },
    animate: {
      opacity: 1,
      y: 0,
    },
    exit: {
      opacity: prefersReducedMotion ? 1 : 0,
      y: prefersReducedMotion ? 0 : -20,
    },
  };

  return (
    <div className="flex flex-col min-h-screen-mobile app-bg">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Floating Action Button */}
      <QuickLogFAB />
    </div>
  );
}

export default Layout;
