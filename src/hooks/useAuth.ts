import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { useStore } from '../store/useStore';
import type { User, DailyTracking } from '../types';

export function useAuth() {
  const setUser = useStore((state) => state.setUser);
  const setIsOnboarded = useStore((state) => state.setIsOnboarded);
  const setTracking = useStore((state) => state.setTracking);

  useEffect(() => {
    console.log('👤 Setting up auth state listener...');

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        console.log('✅ User authenticated:', {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        });

        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'>;
            setUser({
              id: firebaseUser.uid,
              ...userData,
            });
            setIsOnboarded(!!userData.birthday);
          } else {
            setUser({
              id: firebaseUser.uid,
              language: 'de',
              nickname: '',
              gender: 'male',
              height: 0,
              weight: 0,
              maxPushups: 0,
              groupCode: '',
              createdAt: new Date(),
              pushupState: { baseReps: 0, sets: 5, restTime: 90 },
            });
            setIsOnboarded(false);
          }
          // Tracking laden
          const trackingRef = collection(db, 'tracking', firebaseUser.uid, 'days');
          const trackingSnapshot = await getDocs(trackingRef);
          const trackingData: Record<string, DailyTracking> = {};
          trackingSnapshot.forEach((doc) => {
            trackingData[doc.id] = doc.data() as DailyTracking;
          });
          setTracking(trackingData);
        } catch (error) {
          setUser(null);
          setIsOnboarded(false);
        }
      } else {
        setUser(null);
        setIsOnboarded(false);
        setTracking({});
        try {
          document.cookie.split(';').forEach((c) => {
            document.cookie = c
              .replace(/^ +/, '')
              .replace(/=.*/, '=;expires=' + new Date(0).toUTCString() + ';path=/');
          });
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          // Nur im Fehlerfall loggen
          console.warn('Fehler beim Aufräumen der Session:', e);
        }
      }
    });
    return () => unsubscribe();
  }, [setUser, setIsOnboarded, setTracking]);
}
