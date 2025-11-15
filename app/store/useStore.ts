'use client';

import { create } from 'zustand';
import * as Sentry from '@sentry/react';
import {
  User,
  DailyTracking,
  BeforeInstallPromptEvent,
  SmartTrackingContribution,
  DailyCheckIn,
  DailyTrainingLoad,
  DrinkPreset,
} from '../types';
import { logger } from '../utils/logger';

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUserPresets: (presets: DrinkPreset[]) => void;

  authLoading: boolean;
  setAuthLoading: (loading: boolean) => void;

  tracking: Record<string, DailyTracking>;
  setTracking: (tracking: Record<string, DailyTracking>) => void;
  updateDayTracking: (date: string, data: Partial<DailyTracking>) => void;

  checkIns: Record<string, DailyCheckIn>;
  setCheckInForDate: (date: string, checkIn: DailyCheckIn | null) => void;

  trainingLoad: Record<string, DailyTrainingLoad>;
  setTrainingLoadForDate: (date: string, load: DailyTrainingLoad | null) => void;

  selectedDate: string;
  setSelectedDate: (date: string) => void;

  pwaInstallPrompt: BeforeInstallPromptEvent | null;
  setPwaInstallPrompt: (event: BeforeInstallPromptEvent | null) => void;

  groupCache: Record<string, { timestamp: number; data: unknown }>;
  setGroupCache: (key: string, payload: { data: unknown; timestamp?: number }) => void;
  clearGroupCache: () => void;

  darkMode: boolean;
  toggleDarkMode: () => void;

  isOnboarded: boolean;
  setIsOnboarded: (value: boolean) => void;

  smartContributions: Record<string, SmartTrackingContribution>;
  setSmartContributions: (value: Record<string, SmartTrackingContribution>) => void;
  leaderboardFilter: 'week' | 'month' | 'all';
  setLeaderboardFilter: (filter: 'week' | 'month' | 'all') => void;
}

const getTodayDate = (): string => new Date().toISOString().split('T')[0]!; // Non-null: ISO string always has 'T'

// Load dark mode preference from localStorage
const getInitialDarkMode = (): boolean => {
  try {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      return JSON.parse(stored);
    }
    // Default to system preference if no stored value
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
};

// Load leaderboard filter preference from localStorage
const getInitialLeaderboardFilter = (): 'week' | 'month' | 'all' => {
  try {
    const stored = localStorage.getItem('leaderboardFilter');
    if (stored && (stored === 'week' || stored === 'month' || stored === 'all')) {
      return stored;
    }
    return 'month'; // Default to month view
  } catch {
    return 'month';
  }
};

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateUserPresets: (presets) =>
    set((state) => {
      if (!state.user) {
        logger.warn('Cannot update presets: No user logged in');
        return state;
      }
      return {
        user: {
          ...state.user,
          hydrationPresets: presets,
        },
      };
    }),

  authLoading: false,
  setAuthLoading: (loading) => set({ authLoading: loading }),

  tracking: {},
  setTracking: (tracking) => set({ tracking }),
  updateDayTracking: (date, data) =>
    set((state) => {
      const existing = state.tracking[date] || { date, sports: {}, water: 0, protein: 0, completed: false };
      return {
        tracking: {
          ...state.tracking,
          [date]: {
            ...existing,
            ...data,
          } as DailyTracking,
        },
      };
    }),

  checkIns: {},
  setCheckInForDate: (date, checkIn) =>
    set((state) => {
      const next = { ...state.checkIns };
      if (checkIn) {
        next[date] = checkIn;
      } else {
        delete next[date];
      }
      return { checkIns: next };
    }),

  trainingLoad: {},
  setTrainingLoadForDate: (date, load) =>
    set((state) => {
      const next = { ...state.trainingLoad };
      if (load) {
        next[date] = load;
      } else {
        delete next[date];
      }
      return { trainingLoad: next };
    }),

  selectedDate: getTodayDate(),
  setSelectedDate: (date) => set({ selectedDate: date }),

  pwaInstallPrompt: null,
  setPwaInstallPrompt: (event) => set({ pwaInstallPrompt: event }),

  groupCache: {},
  setGroupCache: (key, payload) =>
    set((state) => ({
      groupCache: {
        ...state.groupCache,
        [key]: {
          data: payload.data,
          timestamp: payload.timestamp ?? Date.now(),
        },
      },
    })),
  clearGroupCache: () => set({ groupCache: {} }),

  darkMode: getInitialDarkMode(),
  toggleDarkMode: () =>
    set((state) => {
      const newDarkMode = !state.darkMode;
      try {
        localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
      } catch (error) {
        logger.error('Failed to save dark mode preference:', error);
        Sentry.captureException(error, {
          tags: { feature: 'dark-mode' },
          extra: { newDarkMode },
        });
      }
      return { darkMode: newDarkMode };
    }),

  isOnboarded: false,
  setIsOnboarded: (value) => set({ isOnboarded: value }),

  smartContributions: {},
  setSmartContributions: (value) => set({ smartContributions: value }),
  leaderboardFilter: getInitialLeaderboardFilter(),
  setLeaderboardFilter: (filter) => {
    try {
      localStorage.setItem('leaderboardFilter', filter);
    } catch (error) {
      logger.error('Failed to save leaderboard filter preference:', error);
      Sentry.captureException(error, {
        tags: { feature: 'leaderboard-filter' },
        extra: { filter },
      });
    }
    set({ leaderboardFilter: filter });
  },
}));

