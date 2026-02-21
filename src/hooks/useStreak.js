import { useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

export function useStreak({ user, loading, entries, getEntriesForDate, setDailyStreak }) {
  useEffect(() => {
    if (!user || loading) return;

    const checkStreak = async () => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
        const docSnap = await getDoc(docRef);
        const data = docSnap.exists() ? docSnap.data() : {};
        
        const lastLoginStr = data.lastLogin || '';
        const currentStreak = data.dailyStreak || 0;
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        let newStreak = currentStreak;

        if (lastLoginStr !== todayStr) {
            if (lastLoginStr === yesterdayStr) {
                const yesterdayEntries = getEntriesForDate(yesterday, '', 'newest', []);
                if (yesterdayEntries.length > 0) {
                    newStreak += 1;
                } else {
                    newStreak = 0;
                }
            } else if (lastLoginStr && lastLoginStr !== yesterdayStr) {
                newStreak = 0;
            }

            await setDoc(docRef, {
                lastLogin: todayStr,
                dailyStreak: newStreak,
            }, { merge: true });
            setDailyStreak(newStreak);
        }
    };
    
    checkStreak(); 
  }, [user, loading, entries, getEntriesForDate, setDailyStreak]);
}
