import { useEffect, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

export function useStreak({ user, loading, profileData, getEntriesForDate, setDailyStreak, entries }) {
  // Keep a stable ref to getEntriesForDate so it doesn't bloat the dep array
  const getEntriesRef = useRef(getEntriesForDate);
  useEffect(() => { getEntriesRef.current = getEntriesForDate; }, [getEntriesForDate]);

  // Seed the badge immediately from the saved Firestore value while entries load
  useEffect(() => {
    if (!profileData) return;
    const saved = profileData.dailyStreak;
    if (saved > 0) setDailyStreak(saved);
  }, [profileData, setDailyStreak]);

  // Recalculate from actual entry data whenever entries change.
  // Works for ALL user types: device-only (user===null), anonymous, and authenticated.
  // Only waits for loading to finish — does NOT require user or profileData.
  useEffect(() => {
    if (loading || !getEntriesRef.current) return;

    const checkStreak = async () => {
      let streak = 0;
      const now = new Date();
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(now);
        checkDate.setDate(now.getDate() - i);
        const dayEntries = getEntriesRef.current(checkDate, '', 'newest', []);
        if (dayEntries.length > 0) {
          streak++;
        } else {
          // Grace period: if today has no entries yet, keep checking yesterday
          if (i === 0) continue;
          break;
        }
      }

      // Always update the display with the computed value.
      // If entries haven't loaded yet (streak===0) fall back to the saved value
      // so the badge doesn't flash 0 on startup.
      const savedStreak = profileData?.dailyStreak || 0;
      const display = streak > 0 ? streak : savedStreak;
      setDailyStreak(display);

      // Persist to Firestore only for authenticated (non-anonymous) users
      if (streak > 0 && streak !== savedStreak && user && !user.isAnonymous) {
        const todayStr = now.toISOString().split('T')[0];
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
        await setDoc(docRef, { lastLogin: todayStr, dailyStreak: streak }, { merge: true });
      }
    };

    checkStreak();
  }, [user, loading, entries, setDailyStreak, profileData]);
}
