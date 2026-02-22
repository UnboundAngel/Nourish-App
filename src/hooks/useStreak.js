import { useEffect, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

export function useStreak({ user, loading, profileData, getEntriesForDate, setDailyStreak }) {
  // Use a ref so the dep array stays a fixed size across renders
  const getEntriesRef = useRef(getEntriesForDate);
  useEffect(() => { getEntriesRef.current = getEntriesForDate; }, [getEntriesForDate]);

  useEffect(() => {
    if (!user || loading || !profileData || !getEntriesRef.current) return;

    const checkStreak = async () => {
        // Count consecutive days with entries, starting from today and going backward
        let streak = 0;
        const now = new Date();
        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(now);
            checkDate.setDate(now.getDate() - i);
            const dayEntries = getEntriesRef.current(checkDate, '', 'newest', []);
            if (dayEntries.length > 0) {
                streak++;
            } else {
                // If today has no entries yet, still check yesterday onward
                if (i === 0) continue;
                break;
            }
        }

        // Only write to Firestore if streak changed
        const currentStreak = profileData.dailyStreak || 0;
        if (streak !== currentStreak && streak > 0) {
            const todayStr = now.toISOString().split('T')[0];
            const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
            await setDoc(docRef, {
                lastLogin: todayStr,
                dailyStreak: streak,
            }, { merge: true });
        }
        setDailyStreak(streak > 0 ? streak : (currentStreak || 0));
    };
    
    checkStreak(); 
  }, [user, loading, profileData, setDailyStreak]);
}
