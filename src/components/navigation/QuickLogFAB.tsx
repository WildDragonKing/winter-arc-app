import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';

/**
 * Floating Action Button for Quick Logging
 *
 * One-handed reachable bottom-right position
 * Opens quick log menu for pushups, water, protein
 */
export function QuickLogFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const tracking = useStore((state) => state.tracking);
  const setTracking = useStore((state) => state.setTracking);

  const today = new Date().toISOString().split('T')[0];
  const todayData = tracking[today] || {};

  const quickActions = [
    {
      id: 'pushups',
      label: '+10 Pushups',
      icon: '💪',
      action: () => {
        const current = todayData.pushups?.total || 0;
        setTracking({
          ...tracking,
          [today]: {
            ...todayData,
            pushups: { total: current + 10 },
          },
        });
      },
    },
    {
      id: 'water',
      label: '+250ml Water',
      icon: '💧',
      action: () => {
        const current = todayData.water || 0;
        setTracking({
          ...tracking,
          [today]: {
            ...todayData,
            water: current + 250,
          },
        });
      },
    },
    {
      id: 'protein',
      label: '+20g Protein',
      icon: '🥩',
      action: () => {
        const current = todayData.protein || 0;
        setTracking({
          ...tracking,
          [today]: {
            ...todayData,
            protein: current + 20,
          },
        });
      },
    },
  ];

  const handleActionClick = (action: () => void) => {
    action();
    setIsOpen(false);
    // Haptic feedback simulation
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <>
      {/* Quick Action Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[var(--z-fab)]"
              onClick={() => setIsOpen(false)}
            />

            {/* Action Buttons */}
            <div className="fixed right-4 bottom-24 z-[var(--z-fab)] flex flex-col gap-3">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, scale: 0, x: 20 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: 0,
                    transition: {
                      delay: index * 0.05,
                      type: 'spring',
                      stiffness: 260,
                      damping: 20,
                    },
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0,
                    x: 20,
                    transition: { delay: (quickActions.length - index) * 0.03 },
                  }}
                  onClick={() => handleActionClick(action.action)}
                  className="
                    touch-target flex items-center gap-3 px-4 py-3
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                    rounded-full shadow-lg
                    hover:scale-105 active:scale-95 transition-transform
                  "
                  style={{ paddingBottom: 'calc(12px + var(--safe-area-bottom))' }}
                >
                  <span className="text-2xl">{action.icon}</span>
                  <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="
          fixed right-4 bottom-20 z-[var(--z-fab)]
          w-14 h-14 rounded-full
          bg-gradient-to-br from-blue-500 to-blue-600
          text-white text-2xl
          shadow-lg hover:shadow-xl
          flex items-center justify-center
          transition-shadow
        "
        style={{ marginBottom: 'var(--safe-area-bottom)' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        aria-label={isOpen ? 'Close quick log' : 'Open quick log'}
        aria-expanded={isOpen}
      >
        <motion.span
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          +
        </motion.span>
      </motion.button>
    </>
  );
}
