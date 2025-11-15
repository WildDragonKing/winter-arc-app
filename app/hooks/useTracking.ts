'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';

/**
 * Hook that auto-saves tracking data to PostgreSQL API when it changes
 */
export function useTracking() {
  const user = useStore((state) => state.user);
  const tracking = useStore((state) => state.tracking);

  const changedDatesRef = useRef<Set<string>>(new Set());
  const lastSnapshotRef = useRef<Record<string, any>>({});

  const saveTracking = useCallback(async (date: string, data: any) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/tracking/${date}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Failed to save tracking data:', await response.text());
      }
    } catch (error) {
      console.error('Error saving tracking data:', error);
    }
  }, [user]);

  // Mark changed dates
  useEffect(() => {
    if (!user) return;
    Object.entries(tracking).forEach(([date, data]) => {
      const prev = lastSnapshotRef.current[date];
      const serialized = JSON.stringify(data);
      if (!prev || prev !== serialized) {
        changedDatesRef.current.add(date);
        lastSnapshotRef.current[date] = serialized;
      }
    });
  }, [tracking, user]);

  // Debounced flush of only changed dates
  useEffect(() => {
    if (!user) return;
    const timeoutId = setTimeout(() => {
      changedDatesRef.current.forEach((date) => {
        const data = tracking[date];
        if (data) void saveTracking(date, data);
      });
      changedDatesRef.current.clear();
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [tracking, user, saveTracking]);

  // Flush on page unload using sendBeacon
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!user) return;
      if (changedDatesRef.current.size === 0) return;
      const payload: Record<string, any> = {};
      changedDatesRef.current.forEach(date => {
        if (tracking[date]) payload[date] = tracking[date];
      });
      try {
        navigator.sendBeacon('/api/tracking/bulk', JSON.stringify(payload));
      } catch (error) {
        console.error('Failed to flush tracking updates via sendBeacon:', error);
        changedDatesRef.current.forEach(date => {
          const data = tracking[date];
          if (!data) return;
          void fetch(`/api/tracking/${date}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            keepalive: true,
          });
        });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [tracking, user, saveTracking]);
}


