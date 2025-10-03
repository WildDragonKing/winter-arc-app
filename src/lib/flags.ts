/**
 * Feature Flags System
 *
 * Supports:
 * - URL overrides (?flags=quoteV2,leaderboardLite)
 * - LocalStorage persistence
 * - Type-safe flag definitions
 */

// Define all available flags
export type FeatureFlag = 'quoteV2' | 'leaderboardLite' | 'hydrationNudge';

// Flag configurations with default states
const FLAG_CONFIG: Record<FeatureFlag, { default: boolean; description: string }> = {
  quoteV2: {
    default: false,
    description: 'New quote generation algorithm with context awareness',
  },
  leaderboardLite: {
    default: false,
    description: 'Simplified leaderboard with reduced data',
  },
  hydrationNudge: {
    default: false,
    description: 'Water intake reminder notifications',
  },
};

const STORAGE_KEY = 'feature_flags';
const URL_PARAM = 'flags';

/**
 * Parse flags from URL query params
 */
function parseUrlFlags(): Partial<Record<FeatureFlag, boolean>> {
  const params = new URLSearchParams(window.location.search);
  const flagsParam = params.get(URL_PARAM);

  if (!flagsParam) return {};

  const flags: Partial<Record<FeatureFlag, boolean>> = {};
  const flagNames = flagsParam.split(',').map((f) => f.trim());

  for (const name of flagNames) {
    if (name in FLAG_CONFIG) {
      flags[name as FeatureFlag] = true;
    }
  }

  return flags;
}

/**
 * Load flags from localStorage
 */
function loadStoredFlags(): Partial<Record<FeatureFlag, boolean>> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Save flags to localStorage
 */
function saveFlags(flags: Partial<Record<FeatureFlag, boolean>>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  } catch (error) {
    console.warn('Failed to save feature flags:', error);
  }
}

/**
 * Get merged flags from all sources (defaults < localStorage < URL)
 */
function getMergedFlags(): Record<FeatureFlag, boolean> {
  const defaults = Object.entries(FLAG_CONFIG).reduce(
    (acc, [key, config]) => ({ ...acc, [key]: config.default }),
    {} as Record<FeatureFlag, boolean>
  );

  const stored = loadStoredFlags();
  const urlFlags = parseUrlFlags();

  // Merge: defaults < stored < url (url has highest priority)
  const merged = { ...defaults, ...stored, ...urlFlags };

  // If URL flags present, save them to localStorage for persistence
  if (Object.keys(urlFlags).length > 0) {
    saveFlags({ ...stored, ...urlFlags });
  }

  return merged;
}

// Initialize flags on module load
let FLAGS = getMergedFlags();

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FLAGS[flag] ?? FLAG_CONFIG[flag].default;
}

/**
 * Enable a feature flag programmatically
 */
export function enableFeature(flag: FeatureFlag): void {
  FLAGS[flag] = true;
  saveFlags(FLAGS);
}

/**
 * Disable a feature flag programmatically
 */
export function disableFeature(flag: FeatureFlag): void {
  FLAGS[flag] = false;
  saveFlags(FLAGS);
}

/**
 * Toggle a feature flag
 */
export function toggleFeature(flag: FeatureFlag): boolean {
  FLAGS[flag] = !FLAGS[flag];
  saveFlags(FLAGS);
  return FLAGS[flag];
}

/**
 * Get all flags with their current state
 */
export function getAllFlags(): Record<FeatureFlag, boolean> {
  return { ...FLAGS };
}

/**
 * Get flag descriptions
 */
export function getFlagDescription(flag: FeatureFlag): string {
  return FLAG_CONFIG[flag].description;
}

/**
 * Reset all flags to defaults
 */
export function resetFlags(): void {
  FLAGS = Object.entries(FLAG_CONFIG).reduce(
    (acc, [key, config]) => ({ ...acc, [key]: config.default }),
    {} as Record<FeatureFlag, boolean>
  );
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * React Hook for feature flags
 */
import { useState, useEffect } from 'react';

export function useFeatureFlag(flag: FeatureFlag): boolean {
  const [enabled, setEnabled] = useState(() => isFeatureEnabled(flag));

  useEffect(() => {
    // Listen for storage changes (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        FLAGS = getMergedFlags();
        setEnabled(isFeatureEnabled(flag));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [flag]);

  return enabled;
}

/**
 * React Hook for all flags
 */
export function useAllFlags(): Record<FeatureFlag, boolean> {
  const [flags, setFlags] = useState(() => getAllFlags());

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        FLAGS = getMergedFlags();
        setFlags(getAllFlags());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return flags;
}
