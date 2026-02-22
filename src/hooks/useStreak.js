import { useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

export function useStreak({ user, loading, profileData, getEntriesForDate, setDailyStreak }) {
  useEffect(() => {
    if (!user || loading || !profileData) return;

    const checkStreak = async () => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Use cached profile data instead of re-reading from Firestore
        const lastLoginStr = profileData.lastLogin || '';
        const currentStreak = profileData.dailyStreak || 0;
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        let newStreak = currentStreak;

        if (lastLoginStr !== todayStr) {
            if (lastLoginStr === yesterdayStr) {
                // Consecutive day — check if yesterday had entries
                const yesterdayEntries = getEntriesForDate(yesterday, '', 'newest', []);
                if (yesterdayEntries.length > 0) {
                    newStreak += 1;
                } else {
                    newStreak = 1; // Reset but count today
                }
            } else if (!lastLoginStr) {
                // First ever login
                newStreak = 1;
            } else {
                // Streak broken (gap > 1 day) — reset to 1 for today
                newStreak = 1;
            }

            const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
            await setDoc(docRef, {
                lastLogin: todayStr,
                dailyStreak: newStreak,
            }, { merge: true });
            setDailyStreak(newStreak);
        }
    };
    
    checkStreak(); 
  }, [user, loading, profileData, setDailyStreak]);
}
