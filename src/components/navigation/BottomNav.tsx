import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';

interface NavItem {
  path: string;
  labelKey: string;
  icon: string;
  ariaLabel: string;
}

/**
 * Bottom Navigation Component
 *
 * Mobile-first navigation with 4 main items
 * Fixed to bottom with safe-area padding
 * Glass effect with backdrop blur
 */
export function BottomNav() {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems: NavItem[] = [
    {
      path: '/',
      labelKey: 'nav.dashboard',
      icon: '🏠',
      ariaLabel: 'Dashboard'
    },
    {
      path: '/tracking/history',
      labelKey: 'nav.history',
      icon: '📊',
      ariaLabel: 'History'
    },
    {
      path: '/leaderboard',
      labelKey: 'nav.group',
      icon: '👥',
      ariaLabel: 'Leaderboard'
    },
    {
      path: '/settings',
      labelKey: 'nav.settings',
      icon: '⚙️',
      ariaLabel: 'Settings'
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[var(--z-bottom-nav)] glass backdrop-blur-lg border-t border-white/10"
      style={{ paddingBottom: 'var(--safe-area-bottom)' }}
    >
      <ul className="grid grid-cols-4 h-16 items-center max-w-7xl mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <li key={item.path} className="h-full">
              <Link
                to={item.path}
                className={`
                  touch-target h-full flex flex-col items-center justify-center gap-1
                  transition-colors duration-200
                  ${isActive
                    ? 'text-blue-500 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
                aria-label={item.ariaLabel}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Icon with scale animation */}
                <motion.span
                  className="text-2xl"
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {item.icon}
                </motion.span>

                {/* Label - hidden on small screens, visible md+ */}
                <span className={`
                  text-xs font-medium hidden sm:block
                  ${isActive ? 'opacity-100' : 'opacity-70'}
                `}>
                  {t(item.labelKey)}
                </span>

                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute bottom-1 w-1 h-1 bg-blue-500 dark:bg-blue-400 rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
