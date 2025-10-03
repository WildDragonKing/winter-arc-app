import { useEffect } from 'react';
import { startOfWeek, format } from 'date-fns';
import { useStore } from '../store/useStore';
import { getGroupMembers, saveWeeklyTop3 } from '../services/firestoreService';
import type { UserWithStats } from '../types';

export function useWeeklyTop3() {
  const user = useStore((state) => state.user);

  useEffect(() => {
    const checkAndSaveWeeklyTop3 = async () => {
      if (!user?.groupCode) return;

      const now = new Date();
      const dayOfWeek = now.getDay();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Check if it's Monday (1) at 0:00
      const isMonday = dayOfWeek === 1;
      const isMidnight = hours === 0 && minutes === 0;

      if (!isMonday || !isMidnight) return;

      // Get last week's start (previous Monday)
      const lastWeekStart = startOfWeek(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 });
      const lastWeekEnd = new Date(lastWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      const weekStartKey = format(lastWeekStart, 'yyyy-MM-dd');

      // Check if we already saved this week's snapshot
      const storageKey = `top3_saved_${user.groupCode}_${weekStartKey}`;
      if (localStorage.getItem(storageKey)) {
        return; // Already saved
      }

      try {
        // Get last week's rankings
        const result = await getGroupMembers(user.groupCode, lastWeekStart, lastWeekEnd);

        if (result.success && result.data) {
          // Cast to UserWithStats (getGroupMembers returns extended user data)
          const membersWithStats = result.data as UserWithStats[];

          // Sort by total pushups and streak
          const sorted = [...membersWithStats].sort((a, b) => {
            if (b.totalPushups !== a.totalPushups) return b.totalPushups - a.totalPushups;
            return b.streak - a.streak;
          });

          // Get top 3 user IDs
          const top3UserIds = sorted.slice(0, 3).map(member => member.id);

          // Save to Firestore
          await saveWeeklyTop3(user.groupCode, weekStartKey, top3UserIds);

          // Mark as saved in localStorage
          localStorage.setItem(storageKey, 'true');
          console.log('✅ Weekly Top 3 saved:', { weekStartKey, top3UserIds });
        }
      } catch (error) {
        console.error('Error saving weekly top 3:', error);
      }
    };

    // Check immediately on mount
    checkAndSaveWeeklyTop3();

    // Set up interval to check every minute
    const interval = setInterval(checkAndSaveWeeklyTop3, 60 * 1000);

    return () => clearInterval(interval);
  }, [user?.groupCode]);
}
