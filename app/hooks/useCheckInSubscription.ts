'use client';

import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { DailyCheckIn } from '../types';
import { isDemoModeActive } from '../constants/demo';

const isCheckInApiEnabled = process.env.NEXT_PUBLIC_ENABLE_CHECKINS === 'true';

export function useCheckInSubscription(dateKey?: string): void {
  const isTestEnv = typeof process !== 'undefined' && process.env?.VITEST === 'true';
  const userId = useStore((state) => state.user?.id);
  const setCheckInForDate = useStore((state) => state.setCheckInForDate);
  const isDemoMode = isDemoModeActive();

  useEffect(() => {
    if (!isCheckInApiEnabled || isTestEnv || isDemoMode || !userId || !dateKey) {
      return undefined;
    }

    let isActive = true;

    const fetchCheckIn = async () => {
      try {
        const response = await fetch(`/api/checkin/${dateKey}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            if (isActive) setCheckInForDate(dateKey, null);
          } else if (response.status === 401) {
            if (isActive) setCheckInForDate(dateKey, null);
          }
          return;
        }

        const data = await response.json();
        if (isActive) {
          setCheckInForDate(dateKey, data as DailyCheckIn);
        }
      } catch (error) {
        console.warn('Error fetching check-in:', error);
      }
    };

    fetchCheckIn();

    // Poll for updates every 30 seconds
    const intervalId = setInterval(fetchCheckIn, 30000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [isTestEnv, isDemoMode, userId, dateKey, setCheckInForDate]);
}


