import { doc, setDoc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { User, DailyTracking } from '../types';

// User operations
export async function saveUser(userId: string, userData: Omit<User, 'id'>) {
  try {
    console.log('💾 Saving user data to Firestore...', { userId });
    const userRef = doc(db, 'users', userId);
    // Remove undefined fields to avoid Firestore error
    const cleanedData = Object.fromEntries(
      Object.entries(userData).filter(([_, value]) => value !== undefined)
    );
    await setDoc(userRef, cleanedData);
    console.log('✅ User data saved successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving user:', error);
    return { success: false, error };
  }
}

export async function getUser(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return { success: true, data: { id: userId, ...userDoc.data() } as User };
    }
    return { success: false, error: 'User not found' };
  } catch (error) {
    console.error('Error getting user:', error);
    return { success: false, error };
  }
}

export async function updateUser(userId: string, updates: Partial<Omit<User, 'id'>>) {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, updates, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error };
  }
}

// Tracking operations
export async function saveDailyTracking(userId: string, date: string, tracking: DailyTracking) {
  try {
    const trackingRef = doc(db, 'tracking', userId, 'days', date);
    await setDoc(trackingRef, tracking);
    return { success: true };
  } catch (error) {
    console.error('Error saving tracking:', error);
    return { success: false, error };
  }
}

export async function getDailyTracking(userId: string, date: string) {
  try {
    const trackingRef = doc(db, 'tracking', userId, 'days', date);
    const trackingDoc = await getDoc(trackingRef);

    if (trackingDoc.exists()) {
      return { success: true, data: trackingDoc.data() as DailyTracking };
    }
    return { success: false, error: 'Tracking not found' };
  } catch (error) {
    console.error('Error getting tracking:', error);
    return { success: false, error };
  }
}

export async function getTrackingRange(userId: string, startDate: string, endDate: string) {
  try {
    const trackingRef = collection(db, 'tracking', userId, 'days');
    const q = query(
      trackingRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );

    const querySnapshot = await getDocs(q);
    const tracking: Record<string, DailyTracking> = {};

    querySnapshot.forEach((doc) => {
      tracking[doc.id] = doc.data() as DailyTracking;
    });

    return { success: true, data: tracking };
  } catch (error) {
    console.error('Error getting tracking range:', error);
    return { success: false, error };
  }
}

// Group operations
export async function createGroup(groupCode: string, creatorId: string) {
  try {
    const groupRef = doc(db, 'groups', groupCode);
    await setDoc(groupRef, {
      name: groupCode,
      members: [creatorId],
      createdAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error creating group:', error);
    return { success: false, error };
  }
}

export async function joinGroup(groupCode: string, userId: string) {
  try {
    const groupRef = doc(db, 'groups', groupCode);
    const groupDoc = await getDoc(groupRef);

    if (groupDoc.exists()) {
      const members = groupDoc.data().members || [];
      if (!members.includes(userId)) {
        members.push(userId);
        await setDoc(groupRef, { members }, { merge: true });
      }
      return { success: true };
    } else {
      // Group doesn't exist, create it
      return createGroup(groupCode, userId);
    }
  } catch (error) {
    console.error('Error joining group:', error);
    return { success: false, error };
  }
}

export async function getGroupMembers(groupCode: string, startDate?: Date, endDate?: Date) {
  try {
    const groupRef = doc(db, 'groups', groupCode);
    const groupDoc = await getDoc(groupRef);

    if (groupDoc.exists()) {
      const memberIds = groupDoc.data().members || [];
      const today = new Date().toISOString().split('T')[0];

      // Fetch all member user data and their tracking statistics
      const members = await Promise.all(
        memberIds.map(async (memberId: string) => {
          const result = await getUser(memberId);
          if (!result.success || !result.data) return null;

          // Fetch all tracking data for this member
          const trackingCollectionRef = collection(db, 'tracking', memberId, 'days');
          const trackingSnapshot = await getDocs(trackingCollectionRef);

          const allTrackingData: any = {};
          trackingSnapshot.forEach((doc) => {
            allTrackingData[doc.id] = doc.data();
          });

          // Filter tracking data by date range if provided
          let trackingData = allTrackingData;
          if (startDate && endDate) {
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            trackingData = Object.keys(allTrackingData)
              .filter(date => date >= startStr && date <= endStr)
              .reduce((filtered: any, date) => {
                filtered[date] = allTrackingData[date];
                return filtered;
              }, {});
          }

          // Calculate statistics

          // Today's pushups
          const dailyPushups = allTrackingData[today]?.pushups?.total ||
            (allTrackingData[today]?.pushups?.workout?.reps?.reduce((sum: number, reps: number) => sum + reps, 0)) || 0;

          // Total pushups in the filtered period
          const totalPushups = Object.values(trackingData).reduce(
            (sum: number, day: any) => sum + (day.pushups?.total || 0),
            0
          );

          // Sport sessions in the filtered period
          const sportSessions = Object.values(trackingData).reduce(
            (sum: number, day: any) =>
              sum + Object.values(day.sports || {}).filter(Boolean).length,
            0
          );

          // Streak calculation (always based on all-time data)
          const allTrackingDates = Object.keys(allTrackingData).sort();
          let streak = 0;
          if (allTrackingDates.length > 0) {
            streak = 1;
            const sortedDates = [...allTrackingDates].sort().reverse();
            for (let i = 0; i < sortedDates.length - 1; i++) {
              const current = new Date(sortedDates[i]);
              const next = new Date(sortedDates[i + 1]);
              const diffDays = Math.floor(
                (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)
              );
              if (diffDays === 1) {
                streak++;
              } else {
                break;
              }
            }
          }

          // Average water (only days with water > 0 in the filtered period)
          const waterEntries = Object.values(trackingData).filter((day: any) => day.water > 0);
          const avgWater = waterEntries.length > 0
            ? waterEntries.reduce((sum: number, day: any) => sum + day.water, 0) / waterEntries.length
            : 0;

          // Average protein (only days with protein > 0 in the filtered period)
          const proteinEntries = Object.values(trackingData).filter((day: any) => day.protein > 0);
          const avgProtein = proteinEntries.length > 0
            ? proteinEntries.reduce((sum: number, day: any) => sum + day.protein, 0) / proteinEntries.length
            : 0;

          return {
            ...result.data,
            dailyPushups,
            totalPushups,
            sportSessions,
            streak,
            avgWater: Math.round(avgWater),
            avgProtein: Math.round(avgProtein),
          };
        })
      );

      return { success: true, data: members.filter(Boolean) as User[] };
    }
    return { success: false, error: 'Group not found' };
  } catch (error) {
    console.error('Error getting group members:', error);
    return { success: false, error };
  }
}

// Weekly Top 3 Achievement System
interface WeeklySnapshot {
  groupCode: string;
  weekStart: string; // ISO date string for Monday of the week
  top3UserIds: string[];
  createdAt: string;
}

export async function saveWeeklyTop3(groupCode: string, weekStart: string, top3UserIds: string[]) {
  try {
    const snapshotRef = doc(db, 'weeklyTop3', `${groupCode}_${weekStart}`);
    const snapshot: WeeklySnapshot = {
      groupCode,
      weekStart,
      top3UserIds,
      createdAt: new Date().toISOString(),
    };
    await setDoc(snapshotRef, snapshot);
    return { success: true };
  } catch (error) {
    console.error('Error saving weekly top 3:', error);
    return { success: false, error };
  }
}

export async function checkUserInTop3(userId: string, groupCode: string): Promise<boolean> {
  try {
    // Query all snapshots for this group where user is in top 3
    const snapshotsRef = collection(db, 'weeklyTop3');
    const q = query(
      snapshotsRef,
      where('groupCode', '==', groupCode),
      where('top3UserIds', 'array-contains', userId),
      orderBy('weekStart', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking top 3 status:', error);
    return false;
  }
}

// Notes operations
export async function saveNotes(userId: string, notes: string) {
  try {
    const notesRef = doc(db, 'notes', userId);
    await setDoc(notesRef, { notes, updatedAt: new Date().toISOString() });
    return { success: true };
  } catch (error) {
    console.error('Error saving notes:', error);
    return { success: false, error };
  }
}

export async function getNotes(userId: string) {
  try {
    const notesRef = doc(db, 'notes', userId);
    const notesDoc = await getDoc(notesRef);

    if (notesDoc.exists()) {
      return { success: true, data: notesDoc.data().notes };
    }
    return { success: true, data: '' };
  } catch (error) {
    console.error('Error getting notes:', error);
    return { success: false, error };
  }
}
