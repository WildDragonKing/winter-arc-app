import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

/**
 * Theme Toggle Component
 *
 * Three-state toggle: Light / Dark / System
 * Persists preference to localStorage
 */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const options = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ];

  return (
    <div className="inline-flex items-center gap-1 p-1 bg-gray-200 dark:bg-gray-800 rounded-lg">
      {options.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value;
        const isResolved = value === resolvedTheme || (value === 'system' && theme === 'system');

        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`
              relative px-3 py-2 rounded-md text-sm font-medium transition-all
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
              ${isActive
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
            aria-label={`Switch to ${label} theme`}
            aria-pressed={isActive}
          >
            <Icon className="w-4 h-4" />
            {isResolved && theme === 'system' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
