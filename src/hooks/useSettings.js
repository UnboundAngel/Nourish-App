import { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

export function useSettings() {
  // Theme State
  const [currentThemeId, setCurrentThemeId] = useState('Autumn');

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTargetsModalOpen, setIsTargetsModalOpen] = useState(false);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [greetingTime] = useState(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 22) return 'Good Evening';
    return 'Late Night';
  });
  const [viewDate, setViewDate] = useState(new Date());

  // Time Preference State
  const [use24HourTime, setUse24HourTime] = useState(false);

  // Notification Settings
  const [userEmail, setUserEmail] = useState('');
  const [dailySummary, setDailySummary] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [hydrationReminders, setHydrationReminders] = useState(true);
  const [mealReminders, setMealReminders] = useState(true);

  // Daily Targets
  const [dailyTargets, setDailyTargets] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fats: 70
  });
  const [editedTargets, setEditedTargets] = useState(dailyTargets);

  // User Name
  const [userName, setUserName] = useState(() => localStorage.getItem('nourish-user-name') || '');

  // Daily Streak
  const [dailyStreak, setDailyStreak] = useState(() => {
    const localStreak = localStorage.getItem('nourish-daily-streak');
    return localStreak ? Number(localStreak) : 0;
  });

  // Sync daily targets to local storage
  useEffect(() => {
    localStorage.setItem('nourish-daily-targets', JSON.stringify(dailyTargets));
  }, [dailyTargets]);

  // Sync streak to local storage
  useEffect(() => {
      localStorage.setItem('nourish-daily-streak', dailyStreak.toString());
  }, [dailyStreak]);

  // Sync name to local storage
  useEffect(() => {
      if (userName) localStorage.setItem('nourish-user-name', userName);
  }, [userName]);

  const handleThemeChange = async (newTheme, user) => {
      setCurrentThemeId(newTheme);
      if (user) {
          await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
              theme: newTheme
          }, { merge: true });
      }
  };

  const handleTimeFormatChange = async (val, user) => {
      setUse24HourTime(val);
      if (user) {
          await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
              use24HourTime: val
          }, { merge: true });
      }
  };

  const handleEmailSettingsSave = async (e, user) => {
      if (e) e.preventDefault();
      if (!user) return;
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
          email: userEmail,
          dailySummary,
          weeklySummary
      }, { merge: true });
      alert("Email preferences saved!");
  };

  const handleSaveTargets = async (newTargets, user) => {
    setDailyTargets(newTargets);
    localStorage.setItem('nourish-daily-targets', JSON.stringify(newTargets));
    if (user && !user.isAnonymous) {
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
            dailyTargets: newTargets
        }, { merge: true });
    }
    setIsTargetsModalOpen(false);
  };

  return {
    currentThemeId, setCurrentThemeId,
    isModalOpen, setIsModalOpen,
    isHistoryOpen, setIsHistoryOpen,
    isSettingsOpen, setIsSettingsOpen,
    isCalendarOpen, setIsCalendarOpen,
    isTargetsModalOpen, setIsTargetsModalOpen,
    isFabMenuOpen, setIsFabMenuOpen,
    showWelcome, setShowWelcome,
    showStreakCelebration, setShowStreakCelebration,
    isSidebarCollapsed, setIsSidebarCollapsed,
    greetingTime,
    viewDate, setViewDate,
    use24HourTime, setUse24HourTime,
    userEmail, setUserEmail,
    dailySummary, setDailySummary,
    weeklySummary, setWeeklySummary,
    hydrationReminders, setHydrationReminders,
    mealReminders, setMealReminders,
    dailyTargets, setDailyTargets,
    editedTargets, setEditedTargets,
    userName, setUserName,
    dailyStreak, setDailyStreak,
    handleThemeChange,
    handleTimeFormatChange,
    handleEmailSettingsSave,
    handleSaveTargets,
  };
}
