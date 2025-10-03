/**
 * A/B Testing & Experiments
 *
 * Provides deterministic user bucketing for experiments
 * Uses hash-based assignment for consistent variant selection
 */

export type ExperimentVariant = 'control' | 'variant_a' | 'variant_b';

export interface Experiment {
  id: string;
  name: string;
  description: string;
  variants: {
    control: number; // percentage 0-100
    variant_a: number;
    variant_b: number;
  };
}

// Active experiments configuration
export const EXPERIMENTS: Record<string, Experiment> = {
  quoteAlgorithm: {
    id: 'quote_algorithm_v2',
    name: 'Quote Algorithm V2',
    description: 'Test new context-aware quote generation',
    variants: {
      control: 50, // 50% old algorithm
      variant_a: 50, // 50% new algorithm
      variant_b: 0,
    },
  },
  leaderboardDesign: {
    id: 'leaderboard_lite',
    name: 'Leaderboard Lite',
    description: 'Simplified leaderboard with less data',
    variants: {
      control: 70, // 70% full leaderboard
      variant_a: 30, // 30% lite version
      variant_b: 0,
    },
  },
};

/**
 * Simple hash function for string to number conversion
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get deterministic bucket (0-99) from user ID
 */
function getUserBucket(userId: string, experimentId: string): number {
  const hash = simpleHash(`${userId}_${experimentId}`);
  return hash % 100;
}

/**
 * Get variant for user based on experiment configuration
 */
export function getExperimentVariant(
  experimentId: string,
  userId?: string
): ExperimentVariant {
  const experiment = EXPERIMENTS[experimentId];
  if (!experiment) {
    console.warn(`Unknown experiment: ${experimentId}`);
    return 'control';
  }

  // Use userId or generate anonymous ID
  const id = userId || getAnonymousId();
  const bucket = getUserBucket(id, experimentId);

  // Assign variant based on bucket and percentages
  const controlThreshold = experiment.variants.control;
  const variantAThreshold = controlThreshold + experiment.variants.variant_a;

  if (bucket < controlThreshold) {
    return 'control';
  } else if (bucket < variantAThreshold) {
    return 'variant_a';
  } else {
    return 'variant_b';
  }
}

/**
 * Check if user is in experiment variant
 */
export function isInVariant(
  experimentId: string,
  variant: ExperimentVariant,
  userId?: string
): boolean {
  return getExperimentVariant(experimentId, userId) === variant;
}

/**
 * Get or create anonymous user ID for experiments
 */
function getAnonymousId(): string {
  const STORAGE_KEY = 'experiment_anon_id';

  try {
    let anonId = localStorage.getItem(STORAGE_KEY);
    if (!anonId) {
      anonId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(STORAGE_KEY, anonId);
    }
    return anonId;
  } catch {
    // Fallback if localStorage unavailable
    return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * React Hook for experiments
 */
import { useMemo } from 'react';
import { useStore } from '../store/useStore';

export function useExperiment(experimentId: string): ExperimentVariant {
  const user = useStore((state) => state.user);
  const userId = user?.id;

  return useMemo(() => {
    return getExperimentVariant(experimentId, userId);
  }, [experimentId, userId]);
}

/**
 * React Hook to check if in variant
 */
export function useIsInVariant(experimentId: string, variant: ExperimentVariant): boolean {
  const currentVariant = useExperiment(experimentId);
  return currentVariant === variant;
}

/**
 * Track experiment exposure (for analytics)
 */
export function trackExperimentExposure(
  experimentId: string,
  variant: ExperimentVariant,
  userId?: string
): void {
  // Log to console for now (replace with real analytics later)
  console.info('[Experiment]', {
    experiment: experimentId,
    variant,
    userId: userId || getAnonymousId(),
    timestamp: new Date().toISOString(),
  });

  // Future: Send to analytics service
  // window.gtag?.('event', 'experiment_exposure', { ... })
  // or window.plausible?.('Experiment', { ... })
}

/**
 * Get all active experiments for current user
 */
export function getAllExperiments(userId?: string): Record<string, ExperimentVariant> {
  const id = userId || getAnonymousId();
  const results: Record<string, ExperimentVariant> = {};

  for (const [key, experiment] of Object.entries(EXPERIMENTS)) {
    results[key] = getExperimentVariant(experiment.id, id);
  }

  return results;
}
