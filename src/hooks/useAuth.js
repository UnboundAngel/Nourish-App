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
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, appId } from '../config/firebase';

export function useAuth({ setUserName, setCurrentThemeId, setUse24HourTime, setUserEmail, setDailySummary, setWeeklySummary, setDailyStreak, setWaterOz, setDailyTargets, setEditedTargets, setShowWelcome }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
        if (!u) {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { // eslint-disable-line no-undef
                    await signInWithCustomToken(auth, __initial_auth_token); // eslint-disable-line no-undef
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) { 
                console.error("Auth failed", error);
                setLoading(false);
            }
            return;
        }

        setUser(u);
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

        } catch (e) { console.log("Profile fetch error", e) }
        
        setLoading(false);
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveProfileFull = async (name, newEmail, explicitUid, { dailyTargets, waterOz, dailyStreak }) => {
      const targetUid = explicitUid || user?.uid;
      if (!targetUid) return;

      let finalName = name;
      if (!finalName && user?.displayName) finalName = user.displayName;
      if (!finalName) finalName = 'Friend';

      const capitalizedName = finalName.charAt(0).toUpperCase() + finalName.slice(1).toLowerCase();
      const docRef = doc(db, 'artifacts', appId, 'users', targetUid, 'profile', 'main');
      await setDoc(docRef, { 
          displayName: capitalizedName, 
          email: newEmail,
          dailyTargets: dailyTargets,
          waterOz: waterOz,
          dailyStreak: dailyStreak
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

  // Handle Google redirect result on page load
  useEffect(() => {
      getRedirectResult(auth).then((result) => {
          if (result?.user) {
              const pendingName = localStorage.getItem('nourish-pending-google-name');
              if (pendingName) {
                  localStorage.removeItem('nourish-pending-google-name');
                  const docRef = doc(db, 'artifacts', appId, 'users', result.user.uid, 'profile', 'main');
                  setDoc(docRef, { 
                      displayName: pendingName, 
                      email: result.user.email 
                  }, { merge: true });
              }
          }
      }).catch((error) => {
          console.error('Google redirect error:', error);
      });
  }, []);

  const handleGoogleLogin = async (onboardingName, isQuiet, { handleSaveProfile: saveProfile }) => {
      try {
          const provider = new GoogleAuthProvider();
          // Store name for after redirect returns
          if (onboardingName) {
              localStorage.setItem('nourish-pending-google-name', onboardingName);
          }
          await signInWithRedirect(auth, provider);
          // Page will redirect — won't reach here
          return true;
      } catch (error) {
          console.error(error);
          alert("Google Sign In failed: " + error.message);
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
