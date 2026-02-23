import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithCustomToken,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { auth, db, appId } from '../config/firebase';
import { loadEntries, saveEntries } from '../storage.js';

/**
 * Migrate any localStorage entries to Firestore for a newly authenticated user.
 * Runs at most once per UID (guarded by a localStorage flag).
 */
async function migrateLocalEntriesToFirestore(uid) {
  const migrationKey = `nourish-migrated-${uid}`;
  if (localStorage.getItem(migrationKey)) return; // already done

  const localEntries = loadEntries();
  if (!localEntries || localEntries.length === 0) {
    localStorage.setItem(migrationKey, '1');
    return;
  }

  try {
    const col = collection(db, 'artifacts', appId, 'users', uid, 'journal_entries');
    await Promise.all(
      localEntries.map(entry => {
        // Strip the local id so Firestore generates a real one
        const { id: _id, ...data } = entry;
        return addDoc(col, data);
      })
    );
    // Clear localStorage entries after successful upload
    saveEntries([]);
    localStorage.setItem(migrationKey, '1');
    console.log(`Migrated ${localEntries.length} local entries to Firestore for uid ${uid}`);
  } catch (err) {
    console.error('Entry migration failed (will retry next login):', err);
  }
}

// Fire-and-forget welcome email — non-blocking, errors silently logged
const sendWelcomeEmail = async (email, name) => {
  try {
    await fetch('/api/send-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
  } catch (err) {
    console.error('Welcome email failed (non-critical):', err);
  }
};

export function useAuth({ setUserName, setCurrentThemeId, setUse24HourTime, setUserEmail, setDailySummary, setWeeklySummary, setDailyStreak, setWaterOz, setDailyTargets, setEditedTargets, setShowWelcome, setPushNotifications, setGoodnightMessages, setGoodmorningMessages, setReminderTimes, setWakeTime, setSleepTime, setTimezone, setWeight, setWeightUnit, setMealReminders, setHydrationReminders }) {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Handle redirect result from Google Sign In
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          // User successfully signed in via redirect
          const meta = result.user.metadata;
          const onboardingName = sessionStorage.getItem('nourish-onboarding-name');
          
          if (meta && meta.creationTime === meta.lastSignInTime) {
            sendWelcomeEmail(result.user.email, onboardingName || result.user.displayName || 'Friend');
          }
          
          // Save profile if onboarding name was provided
          if (onboardingName && result.user) {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const capitalizedName = onboardingName.charAt(0).toUpperCase() + onboardingName.slice(1).toLowerCase();
            const docRef = doc(db, 'artifacts', appId, 'users', result.user.uid, 'profile', 'main');
            await setDoc(docRef, { 
              displayName: capitalizedName, 
              email: result.user.email,
              timezone: timezone
            }, { merge: true });
            setUserName(capitalizedName);
            localStorage.setItem('nourish-user-name', capitalizedName);
            setUserEmail(result.user.email);
            setShowWelcome(false);
            sessionStorage.removeItem('nourish-onboarding-name');
          }
        }
      })
      .catch((error) => {
        console.error('Redirect result error:', error.code, error.message);
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
          alert('Google Sign In failed: ' + error.message);
        }
      });

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
        if (!u) {
            // Check if user previously chose "Device Only" mode
            const isDeviceOnly = localStorage.getItem('nourish-device-only') === 'true';
            const localName = localStorage.getItem('nourish-user-name');
            
            if (isDeviceOnly || !localName) {
                // Device-only mode OR first-time visitor: no Firebase auth yet
                // Anonymous auth will be created later only if user needs Firestore
                if (localName) {
                    setUserName(localName);
                    setShowWelcome(false);
                } else {
                    setShowWelcome(true);
                }
                setLoading(false);
                return;
            }
            // Returning user who previously signed in — restore auth
            try {
                const token = typeof window !== 'undefined' && window.__initial_auth_token;
                if (token) {
                    await signInWithCustomToken(auth, token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) { 
                console.error("Auth failed", error);
                // Still allow app to work in local-only mode
                const localName = localStorage.getItem('nourish-user-name');
                if (localName) {
                    setUserName(localName);
                    setShowWelcome(false);
                }
                setLoading(false);
            }
            return;
        }

        setUser(u);

        // Migrate any localStorage entries to Firestore on first real login
        if (!u.isAnonymous) {
            migrateLocalEntriesToFirestore(u.uid);
        }

        try {
            const docRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'main');
            const docSnap = await getDoc(docRef);
            const data = docSnap.exists() ? docSnap.data() : {};
            
            if (data.displayName) {
                setUserName(data.displayName);
                localStorage.setItem('nourish-user-name', data.displayName);
                setShowWelcome(false);
            }
            else {
                const localName = localStorage.getItem('nourish-user-name');
                if (localName) {
                    setUserName(localName);
                    setShowWelcome(false);
                } else {
                    setShowWelcome(true);
                }
            }
            
            if (data.theme) setCurrentThemeId(data.theme);
            if (data.use24HourTime !== undefined) setUse24HourTime(data.use24HourTime);
            if (data.email) {
                setUserEmail(data.email);
            } else if (u.email) {
                // Auto-populate notification email from auth email if none stored
                setUserEmail(u.email);
                // Also persist it to Firestore so the cron job can find it
                await setDoc(docRef, { email: u.email }, { merge: true });
            }
            if (data.dailySummary !== undefined) setDailySummary(data.dailySummary);
            if (data.weeklySummary !== undefined) setWeeklySummary(data.weeklySummary);
            if (data.dailyStreak !== undefined) setDailyStreak(data.dailyStreak);
            if (data.waterOz !== undefined) setWaterOz(data.waterOz);
            // Push notification settings
            if (data.pushNotifications !== undefined) setPushNotifications(data.pushNotifications);
            if (data.goodnightMessages !== undefined) setGoodnightMessages(data.goodnightMessages);
            if (data.goodmorningMessages !== undefined) setGoodmorningMessages(data.goodmorningMessages);
            if (data.reminderTimes) setReminderTimes(data.reminderTimes);
            if (data.wakeTime) setWakeTime(data.wakeTime);
            if (data.sleepTime) setSleepTime(data.sleepTime);
            if (data.timezone) setTimezone(data.timezone);
            if (data.weight !== undefined) setWeight(data.weight);
            if (data.weightUnit) setWeightUnit(data.weightUnit);
            if (data.mealReminders !== undefined) setMealReminders(data.mealReminders);
            if (data.hydrationReminders !== undefined) setHydrationReminders(data.hydrationReminders);
            if (data.dailyTargets) {
                setDailyTargets(data.dailyTargets);
                setEditedTargets(data.dailyTargets);
            }
            else {
                const localTargets = localStorage.getItem('nourish-daily-targets');
                if (localTargets) {
                    const parsed = JSON.parse(localTargets);
                    setDailyTargets(parsed);
                    setEditedTargets(parsed);
                }
            }

            // Cache profile data for other hooks
            setProfileData(data);
        } catch (e) { console.log("Profile fetch error", e) }
        
        // Clear device-only flag since user is now authenticated
        localStorage.removeItem('nourish-device-only');
        setLoading(false);
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveProfileFull = async (name, newEmail, explicitUid, { dailyTargets, waterOz, dailyStreak, weight, weightUnit, wakeTime, sleepTime }) => {
      const targetUid = explicitUid || user?.uid;
      if (!targetUid) return;

      let finalName = name;
      if (!finalName && user?.displayName) finalName = user.displayName;
      if (!finalName) finalName = 'Friend';

      const capitalizedName = finalName.charAt(0).toUpperCase() + finalName.slice(1).toLowerCase();
      const docRef = doc(db, 'artifacts', appId, 'users', targetUid, 'profile', 'main');
      
      // Auto-detect timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      await setDoc(docRef, { 
          displayName: capitalizedName, 
          email: newEmail,
          dailyTargets: dailyTargets,
          waterOz: waterOz,
          dailyStreak: dailyStreak,
          weight: weight ? Number(weight) : null,
          weightUnit: weightUnit || 'lbs',
          wakeTime: wakeTime || '07:00',
          sleepTime: sleepTime || '23:00',
          timezone: timezone
      }, { merge: true });
      setUserName(capitalizedName);
      localStorage.setItem('nourish-user-name', capitalizedName);
      setUserEmail(newEmail);
      setShowWelcome(false);
      localStorage.setItem('nourish-daily-targets', JSON.stringify(dailyTargets));
  };

  const handleAuth = async (e, customEmail, customPassword, customMode, onboardingName, isQuiet, { handleSaveProfile: saveProfile }) => {
      if (e) e.preventDefault();
      const targetEmail = customEmail || email;
      const targetPassword = customPassword || password;
      const mode = customMode || authMode;

      try {
          let userCredential;
          if (mode === 'login') {
              userCredential = await signInWithEmailAndPassword(auth, targetEmail, targetPassword);
          } else {
              userCredential = await createUserWithEmailAndPassword(auth, targetEmail, targetPassword);
              // Send welcome email on signup (fire-and-forget)
              sendWelcomeEmail(targetEmail, onboardingName);
          }
          
          if (onboardingName && userCredential.user) {
              await saveProfile(onboardingName, userCredential.user.email, userCredential.user.uid);
          }

          return true;
      } catch (error) {
          alert(error.message);
          return false;
      }
  };

  const handleGoogleLogin = async (onboardingName, isQuiet, { handleSaveProfile: saveProfile }) => {
      try {
          const provider = new GoogleAuthProvider();
          // Store onboarding name in sessionStorage to retrieve after redirect
          if (onboardingName) {
              sessionStorage.setItem('nourish-onboarding-name', onboardingName);
          }
          // Use redirect instead of popup to avoid COOP issues
          await signInWithRedirect(auth, provider);
          // Note: The actual sign-in completion is handled by getRedirectResult in useEffect
          return true;
      } catch (error) {
          console.error('Google Sign In error:', error.code, error.message);
          alert('Google Sign In failed: ' + error.message);
          return false;
      }
  };

  const handleForgotPassword = async (resetEmail) => {
    const targetEmail = resetEmail || email;
    if (!targetEmail) {
      alert('Please enter your email address first.');
      return false;
    }
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      alert(`Password reset email sent to ${targetEmail}. Check your inbox.`);
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  const handleSignOut = () => signOut(auth);

  return {
    user,
    profileData,
    loading,
    authMode, setAuthMode,
    email, setEmail,
    password, setPassword,
    showPassword, setShowPassword,
    handleSaveProfileFull,
    handleAuth,
    handleGoogleLogin,
    handleForgotPassword,
    handleSignOut,
  };
}
