import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Coffee, 
  Sun, 
  Moon, 
  Apple,
  Leaf,
  X,
  Check,
  Circle,
  CheckCircle,
  Lightbulb,
  Droplet,
  Calendar as CalendarIcon,
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Settings,
  Bell,
  LogOut,
  LogIn,
  Star,
  Clock,
  Mail,
  User as UserIcon,
  Palette,
  Flame,
  ChevronDown
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query,
  setDoc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { saveEntries, loadEntries } from './storage.js';
import { THEMES, GlobalStyles } from './components/ThemeStyles';
import { Widget, WaterBottle, WellnessTrends } from './components/Widgets';
import { CustomCalendar } from './components/Calendar';
import { SortDropdown } from './components/SortDropdown';
import { Modal, WelcomeScreen, StreakCelebration } from './components/Modals';

const firebaseConfig = {
  apiKey: "AIzaSyAfMuQpKXVlbKQRqJ8r4nO-FXn6VerohUo",
  authDomain: "nourish-d2113.firebaseapp.com",
  projectId: "nourish-d2113",
  storageBucket: "nourish-d2113.appspot.com",
  messagingSenderId: "695002156720",
  appId: "1:695002156720:web:0e91a6340cd822abd97575"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'default-app-id';

// --- Calorie Constants ---
const CALORIE_MAP = {
    protein: 4,
    carbs: 4,
    fats: 9
};

// --- Main App ---
const SIDEBAR_WIDTH_MD = 'w-64'; // Adjusted from w-1/4
const SIDEBAR_WIDTH_LG = 'lg:w-[15%]'; // Use responsive width for better scaling

export default function NourishApp() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Theme State
  const [currentThemeId, setCurrentThemeId] = useState('Autumn');
  const theme = THEMES[currentThemeId];

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false); // New state for streak pop-up
  const [greetingTime, setGreetingTime] = useState('Good Morning');
  
  // Feature State
  const [viewDate, setViewDate] = useState(new Date()); 
  const [waterOz, setWaterOz] = useState(0); 
  const [customWaterInput, setCustomWaterInput] = useState('');
  const [dailyStreak, setDailyStreak] = useState(0);

  // --- Data Sync ---
  useEffect(() => {
    if (!user || user.isAnonymous) {
      // If there is no user or the user is anonymous, load from local storage
      const localEntries = loadEntries();
      setEntries(localEntries);
      return;
    }

    // If there is a user and they are not anonymous, sync local entries and then fetch from Firestore
    const syncAndFetch = async () => {
      const localEntries = loadEntries();
      if (localEntries.length > 0) {
        const collectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'journal_entries');
        for (const entry of localEntries) {
          await addDoc(collectionRef, entry);
        }
        saveEntries([]); // Clear local storage after sync
      }

      const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'journal_entries'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEntries(data);
        saveEntries(data); // Also save to local storage for offline access
      });

      return unsubscribe;
    };

    const unsubscribePromise = syncAndFetch();

    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, [user]);

  // Time Preference State (Default: 12h)
  const [use24HourTime, setUse24HourTime] = useState(false);
  
  // Notification Settings
  const [userEmail, setUserEmail] = useState('');
  const [dailySummary, setDailySummary] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [hydrationReminders, setHydrationReminders] = useState(true);
  const [mealReminders, setMealReminders] = useState(true);

  // Notifications State
  const [notifications, setNotifications] = useState([
      { id: 1, text: "Welcome to Nourish! 🌱", isRead: false, timestamp: Date.now() },
      { id: 2, text: "Your daily insights are ready.", isRead: false, timestamp: Date.now() - 3600000 }
  ]);

  // Auth State
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Form State
  const [editingId, setEditingId] = useState(null); 
  const [newItem, setNewItem] = useState({
    name: '', calories: 0, protein: 0, carbs: 0, fats: 0, type: 'Breakfast',
    time: '', finished: true, feeling: 'good', note: '', tags: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTags, setActiveTags] = useState([]);
  const [sortBy, setSortBy] = useState('newest');

  // --- Computed ---
  const getEntriesForDate = (date, currentSearchTerm, currentSortBy, currentActiveTags) => {
      let result = entries.filter(e => {
          const dateOnly = new Date(new Date(e.createdAt).setHours(0,0,0,0)).getTime();
          const viewDateOnly = new Date(new Date(date).setHours(0,0,0,0)).getTime();
          return dateOnly === viewDateOnly;
      });

      if (currentSearchTerm) {
        result = result.filter(e => e.name.toLowerCase().includes(currentSearchTerm.toLowerCase()));
      }

      if (currentActiveTags && currentActiveTags.length > 0) {
        result = result.filter(e => {
            if (!e.tags) return false;
            const entryTags = e.tags.split(',').map(t => t.trim());
            return currentActiveTags.every(activeTag => entryTags.includes(activeTag));
        });
      }

      switch (currentSortBy) {
        case 'oldest':
            result.sort((a, b) => a.createdAt - b.createdAt);
            break;
        case 'calories_asc':
            result.sort((a, b) => a.calories - b.calories);
            break;
        case 'calories_desc':
            result.sort((a, b) => b.calories - a.calories);
            break;
        case 'newest':
        default:
            result.sort((a, b) => b.createdAt - a.createdAt);
            break;
      }

      return result;
  };

  const todaysEntries = useMemo(() => getEntriesForDate(new Date(), searchTerm, sortBy, activeTags), [entries, searchTerm, sortBy, activeTags]);
  const todaysTotals = todaysEntries.reduce((acc, curr) => ({
      calories: acc.calories + (curr.calories || 0),
      protein: acc.protein + (curr.protein || 0),
      carbs: acc.carbs + (curr.carbs || 0),
      fats: acc.fats + (curr.fats || 0),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const allTags = useMemo(() => {
    const tags = new Set();
    entries.forEach(entry => {
      if (entry.tags) {
        entry.tags.split(',').forEach(tag => {
          const trimmedTag = tag.trim();
          if (trimmedTag) {
            tags.add(trimmedTag);
          }
        });
      }
    });
    return Array.from(tags);
  }, [entries]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  // --- Auth & Init ---
  useEffect(() => {
    const initAuth = async () => {
        try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token);
            } else {
                await signInAnonymously(auth);
            }
        } catch (error) { console.error("Auth failed", error); }
    }
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
        setUser(u);
        if (u) {
            try {
                const docRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'main');
                const docSnap = await getDoc(docRef);
                const data = docSnap.exists() ? docSnap.data() : {};
                
                if (data.displayName) setUserName(data.displayName);
                else setShowWelcome(true); // Show welcome screen if new user
                
                if (data.theme) setCurrentThemeId(data.theme);
                if (data.use24HourTime !== undefined) setUse24HourTime(data.use24HourTime);
                if (data.email) setUserEmail(data.email);
                if (data.dailySummary !== undefined) setDailySummary(data.dailySummary);
                if (data.weeklySummary !== undefined) setWeeklySummary(data.weeklySummary);
                if (data.dailyStreak !== undefined) setDailyStreak(data.dailyStreak);

            } catch (e) { console.log("Profile fetch error", e) }
        }
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);


  
  // --- Streak Logic ---
  useEffect(() => {
    if (!user || loading) return;

    const checkStreak = async () => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Get user metadata
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
        const docSnap = await getDoc(docRef);
        const data = docSnap.exists() ? docSnap.data() : {};
        
        const lastLoginStr = data.lastLogin || '';
        const currentStreak = data.dailyStreak || 0;
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        let newStreak = currentStreak;

        // Check if user has logged in/opened app today
        if (lastLoginStr !== todayStr) {
            // Check if last login was yesterday (for continuity)
            if (lastLoginStr === yesterdayStr) {
                // Check if they logged any food yesterday to count the streak
                const yesterdayEntries = getEntriesForDate(yesterday, '', 'newest', []);
                if (yesterdayEntries.length > 0) {
                    newStreak += 1; // Increment streak
                } else {
                    newStreak = 0; // Reset streak if they missed logging food yesterday
                }
            } else if (lastLoginStr && lastLoginStr !== yesterdayStr) {
                // If last login was more than 1 day ago, reset streak
                newStreak = 0;
            }
            // If it's the very first login, streak remains 0 (or 1 if they log food today)

            // Update profile with new streak and today's login date
            await setDoc(docRef, {
                lastLogin: todayStr,
                dailyStreak: newStreak,
            }, { merge: true });
            setDailyStreak(newStreak);
        }
    };
    
    // We run the streak check only once on load after auth
    checkStreak(); 
  }, [user, loading, entries]); // Re-run if entries change to potentially update the streak count instantly

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreetingTime('Good Morning');
    else if (hour >= 12 && hour < 17) setGreetingTime('Good Afternoon');
    else if (hour >= 17 && hour < 22) setGreetingTime('Good Evening');
    else setGreetingTime('Late Night');
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') return;

    const mealInterval = mealReminders ? setInterval(() => {
      const hour = new Date().getHours();
      const todaysBreakfast = todaysEntries.some(e => e.type === 'Breakfast');
      const todaysLunch = todaysEntries.some(e => e.type === 'Lunch');
      const todaysDinner = todaysEntries.some(e => e.type === 'Dinner');

      if (hour >= 8 && hour < 11 && !todaysBreakfast) {
        new Notification("Nourish Reminder", { body: "Don't forget to log your breakfast!", icon: '/Nourish-192.png' });
      } else if (hour >= 12 && hour < 15 && !todaysLunch) {
        new Notification("Nourish Reminder", { body: "Time for lunch! Don't forget to log it.", icon: '/Nourish-192.png' });
      } else if (hour >= 18 && hour < 21 && !todaysDinner) {
        new Notification("Nourish Reminder", { body: "Dinner time! What are you having?", icon: '/Nourish-192.png' });
      }
    }, 30 * 60 * 1000) : null; // every 30 minutes

    const hydrationInterval = hydrationReminders ? setInterval(() => {
      new Notification("Nourish Reminder", { body: "Stay hydrated! Time for a glass of water.", icon: '/Nourish-192.png' });
    }, 2 * 60 * 60 * 1000) : null; // every 2 hours

    return () => {
      if (mealInterval) clearInterval(mealInterval);
      if (hydrationInterval) clearInterval(hydrationInterval);
    };
  }, [mealReminders, hydrationReminders, todaysEntries]);

  // --- Helpers ---
  const formatTime = (timeString) => {
      if (!timeString) return '';
      if (use24HourTime) return timeString;
      
      const [hours, minutes] = timeString.split(':');
      const h = parseInt(hours, 10);
      const suffix = h >= 12 ? 'PM' : 'AM';
      const formattedH = h % 12 || 12;
      return `${formattedH}:${minutes} ${suffix}`;
  };
  
  // Format current time once when modal opens
  const getCurrentFormattedTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      return formatTime(timeString);
  };

  const calculateCaloriesFromMacros = (item) => {
    return (
        (Number(item.protein) * CALORIE_MAP.protein) +
        (Number(item.carbs) * CALORIE_MAP.carbs) +
        (Number(item.fats) * CALORIE_MAP.fats)
    );
  };
  
  const handleMacroChange = (e, macro) => {
    const value = e.target.value;
    const updatedItem = { ...newItem, [macro]: value };

    // Update calories based on new macro calculation
    const newCalories = calculateCaloriesFromMacros(updatedItem);
    
    setNewItem({ ...updatedItem, calories: newCalories.toString() });
  };

  const handleIncrementMacro = (macro) => {
    setNewItem(prev => {
      const updatedItem = { ...prev, [macro]: Number(prev[macro]) + 1 };
      const newCalories = calculateCaloriesFromMacros(updatedItem);
      return { ...updatedItem, calories: newCalories.toString() };
    });
  };

  const handleDecrementMacro = (macro) => {
    setNewItem(prev => {
      const updatedItem = { ...prev, [macro]: Math.max(0, Number(prev[macro]) - 1) };
      const newCalories = calculateCaloriesFromMacros(updatedItem);
      return { ...updatedItem, calories: newCalories.toString() };
    });
  };


  // --- Handlers ---
  const handleSaveProfile = async (name, newEmail) => {
      if (!user) return;
      const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
      await setDoc(docRef, { displayName: capitalizedName, email: newEmail }, { merge: true });
      setUserName(capitalizedName);
      setUserEmail(newEmail);
      setShowWelcome(false);
  };
  
  const handleThemeChange = async (newTheme) => {
      setCurrentThemeId(newTheme);
      if (user) {
          await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
              theme: newTheme
          }, { merge: true });
      }
  };

  const handleTimeFormatChange = async (val) => {
      setUse24HourTime(val);
      if (user) {
          await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
              use24HourTime: val
          }, { merge: true });
      }
  };
  
  const handleEmailSettingsSave = async () => {
      if (!user) return;
      // In a real application, this would also push settings to a backend server
      // to handle the actual email sending.
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
          email: userEmail,
          dailySummary,
          weeklySummary
      }, { merge: true });
      alert("Email preferences saved!");
  };

  const handleMarkAllAsRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (id) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const requestNotificationPermission = async () => {
      if (!("Notification" in window)) {
          alert("This browser does not support desktop notification");
      } else if (Notification.permission === "granted") {
          new Notification("Notifications are already enabled!");
      } else if (Notification.permission !== "denied") {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
              // In a real app, you would send a token to a server here.
              new Notification("Notifications enabled! Welcome to Nourish.");
          }
      }
  };

  const handleAuth = async (e) => {
      e.preventDefault();
      try {
          if (authMode === 'login') {
              await signInWithEmailAndPassword(auth, email, password);
          } else {
              await createUserWithEmailAndPassword(auth, email, password);
          }
          setIsSettingsOpen(false); 
      } catch (error) {
          alert(error.message);
      }
  };

  const handleGoogleLogin = async () => {
      try {
          const provider = new GoogleAuthProvider();
          await signInWithPopup(auth, provider);
          setIsSettingsOpen(false);
      } catch (error) {
          console.error(error);
          alert("Google Sign In failed.");
      }
  };
  
  const openNewEntryModal = () => {
      // Set the time stamp immediately when opening the modal
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      setEditingId(null);
      setNewItem({ 
          name: '', calories: 0, protein: 0, carbs: 0, fats: 0, type: 'Breakfast',
          time: timeString, // Auto-set the current system time
          finished: true, 
          feeling: 'good', 
          note: '',
          tags: ''
      });
      setIsModalOpen(true);
  }

  const handleSaveEntry = useCallback(async (e) => {
    e.preventDefault();
    if (!newItem.name) return;

    const entryData = { 
        ...newItem,
        calories: Number(newItem.calories) || 0,
        protein: Number(newItem.protein) || 0,
        carbs: Number(newItem.carbs) || 0,
        fats: Number(newItem.fats) || 0,
        createdAt: editingId ? entries.find(e => e.id === editingId)?.createdAt : Date.now(),
        time: newItem.time, 
    };

    if (user && !user.isAnonymous) {
      try {
        if (editingId) {
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'journal_entries', editingId), entryData);
        } else {
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'journal_entries'), entryData);
            const today = new Date().toISOString().split('T')[0];
            const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
            const docSnap = await getDoc(docRef);
            const data = docSnap.exists() ? docSnap.data() : {};
            if (data.lastMealDate !== today) {
                const newStreak = (data.dailyStreak || 0) + 1;
                await setDoc(docRef, { lastMealDate: today, dailyStreak: newStreak }, { merge: true });
                setDailyStreak(newStreak);
                setShowStreakCelebration(true);
            }
        }
      } catch (error) { console.error(error); }
    } else {
      const newEntry = {
        ...entryData,
        id: editingId || `local_${Date.now()}`,
      };
      const updatedEntries = editingId 
        ? entries.map(entry => entry.id === editingId ? newEntry : entry)
        : [...entries, newEntry];

      setEntries(updatedEntries);
      saveEntries(updatedEntries);
    }
    
    setIsModalOpen(false);
    setEditingId(null);
    setNewItem(prev => ({ ...prev, name: '', calories: 0, protein: 0, carbs: 0, fats: 0, note: '', tags: '' }));
  }, [user, newItem, editingId, appId, entries]);

  const handleDelete = useCallback(async (e, id) => {
    e.stopPropagation();
    
    const updatedEntries = entries.filter(entry => entry.id !== id);
    setEntries(updatedEntries);
    saveEntries(updatedEntries);

    if (user && !user.isAnonymous) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'journal_entries', id));
      } catch (error) {
        console.error("Error deleting document: ", error);
      }
    }
  }, [user, appId, entries]);

  const handleToggleFinish = useCallback(async (e, entry) => {
    e.stopPropagation();
    
    const updatedFinishedState = !entry.finished;

    if (user && !user.isAnonymous) {
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'journal_entries', entry.id), {
          finished: updatedFinishedState
        });
      } catch (error) {
        console.error("Error updating finish state in Firestore:", error);
      }
    } else {
      const updatedEntries = entries.map(e => 
        e.id === entry.id ? { ...e, finished: updatedFinishedState } : e
      );
      setEntries(updatedEntries);
      saveEntries(updatedEntries);
    }
  }, [user, appId, entries]);

  const handleAddWater = (amount) => {
      setWaterOz(prev => prev + amount);
      setCustomWaterInput(''); 
  };

  const handleCustomWaterSubmit = (e) => {
    e.preventDefault();
    const amount = parseInt(customWaterInput);
    if (!isNaN(amount) && amount > 0) {
      handleAddWater(amount);
    }
  };

  if (loading) return <div className={`min-h-screen flex items-center justify-center ${theme.bg}`}><Activity className="animate-spin text-[#2D5A27]" /></div>;

  return (
    <div className={`min-h-screen flex ${theme.bg} transition-colors duration-500 font-sans text-slate-800`}>
      <GlobalStyles />
      
      {/* --- Welcome Screen --- */}
      {showWelcome && (
        <WelcomeScreen 
            onSave={handleSaveProfile} 
            theme={theme}
            defaultName={user?.displayName || ''}
            defaultEmail={user?.email || ''}
        />
      )}

      {/* --- Fixed Left Sidebar (Desktop View) --- */}
      <aside className={`hidden md:flex flex-col ${SIDEBAR_WIDTH_MD} ${SIDEBAR_WIDTH_LG} min-h-screen ${theme.sidebar} p-5 border-r ${theme.border} theme-transition shadow-lg relative backdrop-blur-sm`}>
        
        {/* Logo and Title */}
        <div className={`mb-6 ${theme.primaryText} theme-transition`}>
            <Leaf size={28} className={`mb-1 ${theme.primaryText.replace('text-', 'text-')}`} />
            <h1 className="text-2xl font-black tracking-tight">Nourish</h1>
        </div>
        
        {/* Greeting & Date */}
        <div className="mb-6">
            <p className={`text-xs font-bold ${theme.accent} uppercase tracking-wider mb-0.5 theme-transition`}>
                {greetingTime}, {userName || 'Friend'}
            </p>
            <h2 className={`text-lg font-bold ${theme.textMain} theme-transition`}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h2>
        </div>

        {/* Navigation/Actions */}
        <nav className="flex-grow space-y-3">
            
            {/* Today + Prev 2 Days (Vertical Navigation) */}
            <div className="flex flex-col gap-1 border-l-2 border-dashed border-black/10 pl-3 py-1 theme-transition">
                {[2, 1, 0].map((offset) => {
                    const d = new Date();
                    d.setDate(d.getDate() - offset);
                    const isToday = offset === 0;
                    return (
                        <button
                            key={offset}
                            onClick={() => {
                                if (!isToday) {
                                    setViewDate(d);
                                    setIsHistoryOpen(true);
                                }
                            }}
                            className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-all ${
                                isToday 
                                ? `${theme.primary} text-white shadow-md cursor-default` 
                                : `hover:bg-black/5 ${theme.textMain} opacity-80 clickable`
                            } theme-transition`}
                        >
                            <span className={`text-sm font-bold uppercase ${isToday ? 'text-white' : theme.accent.replace('text-', 'text-')} w-8 text-left`}>
                                {d.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                            <span className="text-base font-bold">{d.getDate()}</span>
                        </button>
                    );
                })}
            </div>

            {/* Calendar Button */}
            <button 
                onClick={() => setIsCalendarOpen(true)}
                className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 ${theme.card} ${theme.accent.replace('text-', 'text-')} border ${theme.border} hover:brightness-95 transition-all opacity-80 hover:opacity-100 theme-transition clickable`}
            >
                <CalendarIcon size={20} /> Open Full Calendar
            </button>
            
             {/* Daily Streak Summary */}
            <div className="pt-3 border-t border-dashed border-black/10 theme-transition">
                <p className={`text-xs font-bold ${theme.accent} uppercase tracking-wider mb-1 theme-transition`}>My Status</p>
                <div className={`flex items-center gap-2 ${theme.textMain} theme-transition`}>
                    <Flame size={18} className='text-orange-500'/>
                    <span className="font-black text-sm">{dailyStreak} Days Streak</span>
                </div>
            </div>

        </nav>

        {/* Settings and Notifications (Bottom) */}
        <div className="mt-6 space-y-2">
            
             {/* Notifications */}
            <div className="relative">
                <button onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); if(!isNotificationsOpen) handleMarkAllAsRead(); }} className={`w-full flex items-center justify-between p-2.5 rounded-lg ${theme.inputBg} hover:bg-black/10 transition-colors ${theme.textMain} theme-transition clickable`}>
                    <span className='font-bold text-sm'>Notifications</span>
                    <div className='relative'>
                        <Bell size={18} className='opacity-70' />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                </button>
                 {isNotificationsOpen && (
                        <div className={`absolute left-full ml-4 bottom-0 w-72 ${theme.card} rounded-2xl shadow-xl border ${theme.border} p-2 z-50 animate-in fade-in zoom-in-95 theme-transition`}>
                            <h4 className={`text-xs font-bold ${theme.textMain} uppercase tracking-wide px-3 py-2 opacity-60 theme-transition`}>Notifications</h4>
                            {notifications.length === 0 ? (
                                <p className="text-center text-sm py-4 opacity-50">All caught up!</p>
                            ) : (
                                <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                                    {notifications.map(n => (
                                        <div key={n.id} className={`flex justify-between items-start p-3 rounded-xl transition-colors ${!n.isRead ? `${theme.wellnessBg} border ${theme.wellnessBorder}` : 'hover:bg-black/10'}`}>
                                            <p className={`text-sm font-medium ${!n.isRead ? theme.wellnessText : theme.textMain} ${n.isRead ? 'opacity-60' : ''}`}>{n.text}</p>
                                            <button 
                                                onClick={() => handleNotificationClick(n.id)}
                                                className={`p-1 ${theme.accent} opacity-70 hover:opacity-100`}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
            </div>

            {/* Settings Toggle */}
            <button onClick={() => setIsSettingsOpen(true)} className={`w-full flex items-center justify-between p-2.5 rounded-lg ${theme.inputBg} hover:bg-black/10 transition-colors ${theme.textMain} theme-transition clickable`}>
                <span className='font-bold text-sm'>Settings</span>
                <Settings size={18} className='opacity-70'/>
            </button>
        </div>
      </aside>
      
      {/* --- Main Content Area --- */}
      <main className="flex-1 min-h-screen p-4 md:p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            
            {/* Mobile Header (Shown on Small Screens only) */}
            <header className="md:hidden flex flex-col gap-2 p-4 rounded-xl shadow-md border" >
                <div className="flex justify-between items-center">
                    <h1 className={`text-2xl font-black ${theme.primaryText} tracking-tight theme-transition`}>Nourish</h1>
                    <div className="flex gap-2">
                        <button onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); if(!isNotificationsOpen) handleMarkAllAsRead(); }} className={`p-2 rounded-full ${theme.card} shadow-sm border ${theme.border}`}><Bell size={18} /></button>
                        <button onClick={() => setIsSettingsOpen(true)} className={`p-2 rounded-full ${theme.card} shadow-sm border ${theme.border}`}><Settings size={18} /></button>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                     <p className={`text-[10px] font-bold ${theme.accent} uppercase tracking-wider`}>
                        {greetingTime}, {userName || 'Friend'}
                    </p>
                    <button 
                        onClick={() => setIsCalendarOpen(true)}
                        className={`py-1 px-3 rounded-lg ${theme.card} ${theme.accent} border border-transparent hover:border-current transition-all opacity-80 hover:opacity-100 theme-transition text-xs font-bold flex items-center gap-1`}
                    >
                        <CalendarIcon size={12} /> Calendar
                    </button>
                </div>
            </header>


            {/* --- 1. Daily Insight (Theme Aware) --- */}
            <div className={`rounded-3xl p-5 shadow-lg relative overflow-hidden transition-all duration-500 ${currentThemeId === 'Dark' ? 'bg-indigo-900 text-white shadow-indigo-900/20' : `${theme.primary} text-white shadow-xl`} theme-transition`}>
                {currentThemeId === 'Dark' ? (
                    <div className="absolute -right-2 -top-2 opacity-20 text-yellow-100">
                        <Moon size={100} className="moon-glow" />
                        <div className="absolute top-10 left-[-20px] w-1 h-1 bg-white rounded-full animate-pulse"></div>
                        <div className="absolute top-20 left-[-40px] w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-75"></div>
                    </div>
                ) : (
                    <Leaf className="absolute -right-4 -top-4 text-white/10 w-32 h-32" />
                )}

                <div className="relative z-10 flex items-start gap-4">
                    <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                        {currentThemeId === 'Dark' ? <Star size={20} className="text-yellow-300" /> : <Lightbulb size={20} className="text-yellow-300" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm opacity-90 uppercase tracking-wide mb-1 theme-transition">Daily Whisper</h3>
                        <p className="font-medium text-lg leading-snug theme-transition">
                           {todaysTotals.protein > 80 ? `You're crushing your protein goals, ${userName}!` : "Remember to pause and enjoy your meals."}
                        </p>
                    </div>
                </div>
            </div>

            {/* --- 2. Hydration Widget (Improved Layout) --- */}
            <Widget title="Hydration" icon={Droplet} theme={theme} className="flex justify-center">
                 <div className="flex items-center gap-8 w-full px-2">
                    <WaterBottle currentOz={waterOz} goalOz={80} onAdd={handleAddWater} />
                    
                    <div className="flex-1 space-y-4">
                        <div className="space-y-1">
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-bold opacity-60 uppercase theme-transition">Current</span>
                                <span className={`text-3xl font-black ${theme.primaryText} theme-transition`}>{waterOz}<span className="text-base font-normal opacity-50 ml-1">oz</span></span>
                            </div>
                            <div className="w-full h-px bg-black/10"></div>
                            <div className="flex justify-between items-center text-xs opacity-60 font-medium theme-transition">
                                <span>Goal</span>
                                <span>80 oz</span>
                            </div>
                        </div>
                        
                        {/* Custom Add */}
                        <form onSubmit={handleCustomWaterSubmit} className="flex gap-2">
                                                                                    <input
                                                                                        type="number"
                                                                                        placeholder="Add..."
                                                                                        className={`no-native-spinners w-full ${theme.inputBg} rounded-xl pl-3 pr-10 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400 ${theme.textMain} theme-transition`}
                                                                                        value={customWaterInput}
                                                                                        onChange={(e) => setCustomWaterInput(e.target.value)}
                                                                                    />
                                                                                    {/* Custom Stepper Controls for water input */}
                                                                                    <div className={`absolute right-1 top-1/2 -translate-y-1/2 flex flex-col rounded-full bg-white/10 backdrop-blur-xl border border-white/25 shadow-inner group focus-within:ring-2 focus-within:ring-${theme.accent} focus-within:ring-offset-1 focus-within:ring-offset-white/5 transition-all overflow-hidden`}>
                                                                                        <button
                                                                                            type="button"
                                                                                            className="w-6 h-6 flex items-center justify-center border-b border-white/10 hover:scale-105 hover:brightness-125 active:scale-95 text-white/80 transition-all stepper-button-active-gradient clickable"
                                                                                            onClick={() => handleAddWater(Number(customWaterInput) + 1)}
                                                                                        >
                                                                                            <span className="text-xs">▲</span>
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            className="w-6 h-6 flex items-center justify-center hover:scale-105 hover:brightness-125 active:scale-95 text-white/80 transition-all stepper-button-active-gradient clickable"
                                                                                            onClick={() => handleAddWater(Math.max(0, Number(customWaterInput) - 1))}
                                                                                        >
                                                                                            <span className="text-xs">▼</span>
                                                                                        </button>
                                                                                    </div>
                                                                                    <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-xl transition-colors">
                                                                                        <Plus size={16} />
                                                                                    </button>
                        </form>
                    </div>
                 </div>
            </Widget>
            
            <WellnessTrends entries={todaysEntries} theme={theme} />

            {/* --- 3. Meal Entries --- */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className={`text-sm font-bold ${theme.textMain} uppercase tracking-widest flex items-center gap-2 theme-transition`}>
                        <Activity size={14} /> Today's Meals
                    </h3>
                </div>
              
                <div className={`p-4 rounded-2xl border ${theme.border} ${theme.card} space-y-4`}>
                    <input
                        type="text"
                        placeholder="Search meals..."
                        className={`w-full p-3 ${theme.inputBg} rounded-xl font-bold outline-none text-sm placeholder:opacity-40 ${theme.textMain} theme-transition`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className={`text-xs font-bold ${theme.accent} uppercase tracking-wider mb-2 block`}>Filter by Tag</label>
                            <div className="flex flex-wrap gap-2">
                                {allTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => {
                                            setActiveTags(prev =>
                                                prev.includes(tag)
                                                    ? prev.filter(t => t !== tag)
                                                    : [...prev, tag]
                                            );
                                        }}
                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                            activeTags.includes(tag)
                                                ? `${theme.primary} text-white`
                                                : `${theme.inputBg} ${theme.textMain} opacity-60 hover:opacity-100`
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 sm:max-w-[150px]">
                            <label className={`text-xs font-bold ${theme.accent} uppercase tracking-wider mb-2 block`}>Sort by</label>
                            <SortDropdown value={sortBy} onChange={setSortBy} theme={theme} />
                        </div>
                    </div>
                </div>

                {todaysEntries.length === 0 ? (
                    <div className={`text-center py-10 rounded-3xl border-2 border-dashed ${theme.border} opacity-60 ${theme.textMain} theme-transition`}>
                        <Leaf className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">No meals logged yet today.</p>
                    </div>
                ) : (
                    todaysEntries.map((entry) => (
                        <div 
                            key={entry.id}
                            onClick={() => { setEditingId(entry.id); setNewItem(entry); setIsModalOpen(true); }}
                            className={`group relative rounded-2xl p-4 shadow-sm hover:shadow-md border ${theme.border} ${theme.card} ${theme.textMain} transition-all cursor-pointer theme-transition clickable`}
                        >
                            <div className="flex gap-4">
                                <div className={`p-3 rounded-2xl flex flex-col items-center justify-center min-w-[3.5rem] ${theme.inputBg} theme-transition`}>
                                    {entry.type === 'Breakfast' ? <Coffee size={20} /> : 
                                     entry.type === 'Lunch' ? <Sun size={20} /> : 
                                     entry.type === 'Dinner' ? <Moon size={20} /> : 
                                     <Apple size={20} />}
                                    <span className="text-[10px] font-bold opacity-60 mt-1 whitespace-nowrap theme-transition">{formatTime(entry.time)}</span>
                                </div>
                                <div className="flex-grow">
                                    <h4 className="font-bold text-lg leading-tight mb-1 theme-transition">{entry.name}</h4>
                                    <div className="flex gap-2 mb-2 flex-wrap">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.border} opacity-70 theme-transition`}>{entry.type}</span>
                                        {!entry.finished && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Unfinished</span>}
                                        {(entry.feeling === 'sick' || entry.feeling === 'bloated') && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 capitalize">Feeling: {entry.feeling}</span>}
                                        {entry.tags && entry.tags.split(',').map(tag => (
                                            <span key={tag} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.inputBg} opacity-70 theme-transition`}>{tag.trim()}</span>
                                        ))}
                                    </div>
                                    {entry.note && (
                                        <p className="font-handwritten text-sm opacity-70 leading-snug theme-transition">"{entry.note}"</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <span className={`block text-xl font-black ${theme.primaryText} theme-transition`}>{entry.calories}</span>
                                    <span className="text-[10px] opacity-50 font-bold uppercase theme-transition">kcal</span>
                                </div>
                            </div>
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button 
                                    onClick={(e) => handleToggleFinish(e, entry)} 
                                    className={`p-2 ${entry.finished ? 'text-green-500' : 'text-slate-400'} hover:scale-110 transition-transform`}
                                    title={entry.finished ? "Mark as unfinished" : "Mark as finished"}
                                >
                                    {entry.finished ? <CheckCircle size={14} /> : <Circle size={14} />}
                                </button>
                                <button 
                                    onClick={(e) => handleDelete(e, entry.id)} 
                                    className="p-2 text-rose-400 hover:text-rose-600 hover:scale-110 transition-all"
                                    title="Delete entry"
                                >
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </main>

      {/* --- FAB (Revamped) --- */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          onClick={openNewEntryModal}
          className={`${theme.primary} text-white rounded-full w-16 h-16 shadow-xl fab-glow transform transition-transform hover:scale-110 active:scale-95 flex items-center justify-center fab`}
        >
          <div className="fab-inner">
             <Plus strokeWidth={3} size={28} />
          </div>
        </button>
      </div>

      {/* --- Modals --- */}
      
      {/* Calendar Modal */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsCalendarOpen(false)}></div>
          <div className="relative z-10 w-full max-w-sm">
            <CustomCalendar selectedDate={viewDate} onSelectDate={(d) => { setViewDate(d); setIsHistoryOpen(true); }} onClose={() => setIsCalendarOpen(false)} theme={theme} />
          </div>
        </div>
      )}

      {/* Settings Modal (Revamped) */}
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Settings" theme={theme}>
          <div className="space-y-6">
              {/* Account Card */}
              <div className={`${theme.card} p-6 rounded-3xl border ${theme.border} shadow-inner flex flex-col items-center space-y-3 theme-transition`}>
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl ${theme.inputBg} theme-transition`}>{user?.email ? '🔒' : '👤'}</div>
                  <p className={`font-bold text-lg ${theme.textMain} theme-transition`}>{user?.email || 'Anonymous User'}</p>
                  
                  {!user || user.isAnonymous ? (
                      <button onClick={() => setAuthMode('login')} className="flex items-center gap-2 text-sm font-bold text-green-500 hover:text-green-600 clickable">
                          <LogIn size={16} /> Log In / Sign Up
                      </button>
                  ) : (
                      <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-sm font-bold text-rose-500 hover:text-rose-600 clickable">
                          <LogOut size={16} /> Log Out
                      </button>
                  )}
              </div>

              {/* Authentication Form */}
              {(!user || user.isAnonymous) && (
                  <div className={`${theme.card} p-4 rounded-2xl border ${theme.border} space-y-3 theme-transition`}>
                      <h4 className={`text-xs font-bold uppercase tracking-wide opacity-50 mb-3 ${theme.textMain} theme-transition`}>Account Access</h4>
                      <div className={`flex gap-2 ${theme.inputBg} p-1 rounded-xl border ${theme.border} theme-transition`}>
                          <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${authMode === 'login' ? `${theme.primary} text-white` : `${theme.textMain} opacity-60`} theme-transition`}>Log In</button>
                          <button onClick={() => setAuthMode('signup')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${authMode === 'signup' ? `${theme.primary} text-white` : `${theme.textMain} opacity-60`} theme-transition`}>Sign Up</button>
                      </div>
                      <form onSubmit={handleAuth} className="space-y-2">
                          <input type="email" placeholder="Email" required className={`w-full p-3 rounded-xl border ${theme.border} ${theme.inputBg} text-sm ${theme.textMain} theme-transition`} value={email} onChange={e => setEmail(e.target.value)} />
                          <input type="password" placeholder="Password" required className={`w-full p-3 rounded-xl border ${theme.border} ${theme.inputBg} text-sm ${theme.textMain} theme-transition`} value={password} onChange={e => setPassword(e.target.value)} />
                          <button type="submit" className={`w-full py-3 rounded-xl ${theme.primary} text-white font-bold text-sm theme-transition`}>
                              {authMode === 'login' ? 'Log In' : 'Create Account'}
                          </button>
                      </form>
                      <button onClick={handleGoogleLogin} className={`w-full py-3 bg-white border ${theme.border} rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 ${theme.textMain} theme-transition`}>
                          <span className="text-lg">G</span> Continue with Google
                      </button>
                  </div>
              )}


              {/* Appearance & Time */}
              <Widget title="Appearance & Time" icon={Palette} theme={theme} className="p-0">
                 <div className="p-4 space-y-4">
                      <h4 className={`text-xs font-bold uppercase tracking-wide opacity-50 mb-3 ${theme.textMain} theme-transition`}>Theme</h4>
                      <div className="grid grid-cols-2 gap-2">
                          {Object.keys(THEMES).map(t => (
                              <button 
                                key={t}
                                onClick={() => handleThemeChange(t)}
                                className={`p-3 rounded-xl border ${currentThemeId === t ? `${theme.primary} text-white` : `${theme.border} ${theme.inputBg} opacity-60 hover:opacity-100`} font-bold text-sm transition-all ${currentThemeId === t ? '' : theme.textMain} theme-transition clickable`}
                              >
                                  {t}
                              </button>
                          ))}
                      </div>
                      <div className={`w-full h-px ${theme.border} theme-transition`}></div>
                      
                      <div className={`flex items-center justify-between`}>
                          <div className="flex items-center gap-2">
                              <Clock size={18} className="opacity-50" />
                              <span className="font-bold text-sm theme-transition">Time Format</span>
                          </div>
                          <button 
                            onClick={() => handleTimeFormatChange(!use24HourTime)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${theme.border} ${theme.card} hover:brightness-95 transition-colors ${theme.textMain} theme-transition clickable`}
                          >
                              {use24HourTime ? '24-Hour (14:00)' : '12-Hour (2:00 PM)'}
                          </button>
                      </div>
                 </div>
              </Widget>
              
              {/* Notification Settings */}
              <Widget title="Notifications" icon={Bell} theme={theme} className="p-0">
                  <div className="p-4 space-y-4">
                      <h4 className={`text-xs font-bold uppercase tracking-wide opacity-50 mb-3 ${theme.textMain} theme-transition`}>Email Preferences</h4>
                      
                      <form onSubmit={handleEmailSettingsSave} className="space-y-3">
                          <input 
                            type="email" 
                            placeholder="Your Email for Summaries" 
                            className={`w-full p-3 rounded-xl border ${theme.border} ${theme.inputBg} text-sm ${theme.textMain} theme-transition`}
                            value={userEmail} 
                            onChange={e => setUserEmail(e.target.value)} 
                          />
                          <div className="space-y-2">
                            <label className={`flex items-center justify-between text-sm font-medium ${theme.textMain} theme-transition`}>
                                <span>Daily Summary</span>
                                <input type="checkbox" checked={dailySummary} onChange={e => setDailySummary(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                            </label>
                            <label className={`flex items-center justify-between text-sm font-medium ${theme.textMain} theme-transition`}>
                                <span>Weekly Summary</span>
                                <input type="checkbox" checked={weeklySummary} onChange={e => setWeeklySummary(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                            </label>
                          </div>
                          <button type="submit" className={`w-full py-2 rounded-xl ${theme.secondary.replace('bg-', 'bg-')} text-white font-bold text-sm mt-2 theme-transition`}>
                              Save Email Settings
                          </button>
                      </form>
                      
                      <div className={`w-full h-px ${theme.border} theme-transition`}></div>
                      
                      <h4 className={`text-xs font-bold uppercase tracking-wide opacity-50 mt-3 mb-2 ${theme.textMain} theme-transition`}>Desktop Reminders</h4>
                        <label className={`flex items-center justify-between text-sm font-medium ${theme.textMain} theme-transition`}>
                            <span>Meal Reminders</span>
                            <input type="checkbox" checked={mealReminders} onChange={e => setMealReminders(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                        </label>
                        <label className={`flex items-center justify-between text-sm font-medium ${theme.textMain} theme-transition`}>
                            <span>Hydration Reminders</span>
                            <input type="checkbox" checked={hydrationReminders} onChange={e => setHydrationReminders(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                        </label>

                      <div className={`w-full h-px ${theme.border} theme-transition`}></div>
                      
                      {/* System Notifications */}
                      <button onClick={requestNotificationPermission} className={`w-full p-3 rounded-xl ${theme.inputBg} flex items-center justify-between group hover:bg-black/10 transition-colors theme-transition`}>
                          <span className={`font-bold text-sm ${theme.textMain} theme-transition`}>Request System Notifications</span>
                          <Bell size={16} className="opacity-50 group-hover:opacity-100" />
                      </button>
                  </div>
              </Widget>
          </div>
      </Modal>

      {/* Entry Form Modal (REVAMPED for speed and style) */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Meal" : "New Meal"} theme={theme}>
         <form onSubmit={handleSaveEntry} className="space-y-6">
            
            <div className={`p-4 rounded-xl ${theme.inputBg} flex justify-between items-center border ${theme.border} theme-transition`}>
                <div className='flex items-center gap-2'>
                    <Clock size={20} className='opacity-60'/>
                    <span className='text-sm font-bold opacity-60 theme-transition'>Time Stamped</span>
                </div>
                <span className={`text-xl font-extrabold ${theme.primaryText} theme-transition`}>{getCurrentFormattedTime()}</span>
            </div>

            {/* Meal Type Selection */}
            <div className="space-y-2">
                <h4 className={`text-xs font-bold uppercase opacity-60 ${theme.textMain} theme-transition`}>Meal Type</h4>
                <div className="grid grid-cols-4 gap-2">
                    {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(t => (
                        <button key={t} type="button" onClick={() => setNewItem({...newItem, type: t})} className={`py-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center ${newItem.type === t ? `${theme.primary} text-white shadow-md` : `${theme.inputBg} opacity-80 ${theme.textMain}`} theme-transition`}>
                            {t === 'Breakfast' ? <Coffee size={18} className='mb-1'/> : 
                             t === 'Lunch' ? <Sun size={18} className='mb-1'/> : 
                             t === 'Dinner' ? <Moon size={18} className='mb-1'/> : 
                             <Apple size={18} className='mb-1'/>}
                            {t}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Food Name & Calories */}
            <div className="space-y-4">
                <input type="text" placeholder="What did you eat?" className={`w-full p-4 ${theme.inputBg} rounded-2xl font-bold outline-none text-lg placeholder:opacity-40 ${theme.textMain} theme-transition`} value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
                
                                                {/* Calories Input */}
                
                                                <div className="flex gap-3">
                
                                                    <div className="flex-1 relative">
                
                                                        <input
                
                                                            type="number"
                
                                                            placeholder="0"
                
                                                            className={`no-native-spinners w-full p-4 pr-10 ${theme.inputBg} rounded-2xl font-black text-2xl outline-none ${theme.primaryText} theme-transition`}
                
                                                            value={newItem.calories}
                
                                                            onChange={e => setNewItem({...newItem, calories: e.target.value})}
                
                                                        />
                
                                                        <span className="absolute right-4 top-5 text-xs font-bold opacity-40">KCAL</span>
                
                                
                
                                                        {/* Custom Stepper Controls */}
                
                                                        <div className={`absolute right-1 top-1/2 -translate-y-1/2 flex flex-col rounded-full bg-white/10 backdrop-blur-xl border border-white/25 shadow-inner group focus-within:ring-2 focus-within:ring-${theme.accent} focus-within:ring-offset-1 focus-within:ring-offset-white/5 transition-all overflow-hidden`}>
                
                                                            <button
                
                                                                type="button"
                
                                                                className="w-6 h-6 flex items-center justify-center border-b border-white/10 hover:scale-105 hover:brightness-125 active:scale-95 text-white/80 transition-all stepper-button-active-gradient clickable"
                
                                                                onClick={() => setNewItem(prev => ({ ...prev, calories: Number(prev.calories) + 1 }))}
                
                                                            >
                
                                                                <span className="text-xs">▲</span>
                
                                                            </button>
                
                                                            <button
                
                                                                type="button"
                
                                                                className="w-6 h-6 flex items-center justify-center hover:scale-105 hover:brightness-125 active:scale-95 text-white/80 transition-all stepper-button-active-gradient clickable"
                
                                                                onClick={() => setNewItem(prev => ({ ...prev, calories: Math.max(0, Number(prev.calories) - 1) }))}
                
                                                            >
                
                                                                <span className="text-xs">▼</span>
                
                                                            </button>
                
                                                        </div>
                
                                                    </div>
                
                                                </div>
                                {/* Macronutrient Inputs */}
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    {['protein', 'carbs', 'fats'].map((macro) => (
                                        <div key={macro} className='relative'>
                                                                                                                    <input
                                                                                                                        type="number"
                                                                                                                        placeholder="0"
                                                                                                                        className={`no-native-spinners w-full p-3 pr-8 ${theme.inputBg} rounded-xl text-lg font-bold outline-none ${theme.textMain} theme-transition`}
                                                                                                                        value={newItem[macro]}
                                                                                                                        onChange={(e) => handleMacroChange(e, macro)}
                                                                                                                    />
                                                                                                                    <span className={`text-xs font-bold uppercase absolute -top-2 left-1/2 -translate-x-1/2 px-1 rounded-full ${theme.card} ${macro === 'protein' ? 'text-green-500' : macro === 'carbs' ? 'text-orange-500' : 'text-blue-500'}`}>{macro.substring(0, 4)} (G)</span>
                                                                        
                                                                                                                    {/* Custom Stepper Controls */}
                                                                        
                                                                                                                    <div className={`absolute right-1 top-1/2 -translate-y-1/2 flex flex-col rounded-full bg-white/10 backdrop-blur-xl border border-white/25 shadow-inner group focus-within:ring-2 focus-within:ring-${theme.accent} focus-within:ring-offset-1 focus-within:ring-offset-white/5 transition-all overflow-hidden`}>
                                                                        
                                                                                                                        <button
                                                                        
                                                                                                                            type="button"
                                                                        
                                                                                                                            className="w-5 h-5 flex items-center justify-center border-b border-white/10 hover:scale-105 hover:brightness-125 active:scale-95 text-white/80 transition-all stepper-button-active-gradient clickable"
                                                                        
                                                                                                                            onClick={() => handleIncrementMacro(macro)}
                                                                        
                                                                                                                        >
                                                                        
                                                                                                                            <span className="text-[9px]">▲</span>
                                                                        
                                                                                                                        </button>
                                                                        
                                                                                                                        <button
                                                                        
                                                                                                                            type="button"
                                                                        
                                                                                                                            className="w-5 h-5 flex items-center justify-center hover:scale-105 hover:brightness-125 active:scale-95 text-white/80 transition-all stepper-button-active-gradient clickable"
                                                                        
                                                                                                                            onClick={() => handleDecrementMacro(macro)}
                                                                        
                                                                                                                        >
                                                                        
                                                                                                                            <span className="text-[9px]">▼</span>
                                                                        
                                                                                                                        </button>
                                                                        
                                                                                                                    </div>                                        </div>
                                    ))}
                                </div>                <p className='text-xs opacity-60 text-center'>*Calories auto-calculated from macros (P/C=4, F=9).</p>
            </div>

            {/* Wellness Check (Theme Aware Fix) */}
            <div className={`${theme.wellnessBg} p-4 rounded-2xl space-y-3 border ${theme.wellnessBorder} theme-transition`}>
                <label className={`text-xs font-bold ${theme.wellnessText} uppercase tracking-wider flex items-center gap-2 theme-transition`}>Wellness Check</label>
                <div className={`flex justify-between items-center ${theme.card} p-3 rounded-xl border ${theme.wellnessBorder} shadow-sm theme-transition`}>
                    <span className={`text-sm font-bold ${theme.textMain} theme-transition`}>Finished Meal?</span>
                    <button type="button" onClick={() => setNewItem({...newItem, finished: !newItem.finished})} className={`w-12 h-6 rounded-full transition-colors relative ${newItem.finished ? 'bg-green-600' : 'bg-slate-300'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${newItem.finished ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3">
                    {['great', 'good', 'bloated', 'sick'].map(f => (
                        <button 
                            key={f} 
                            type="button" 
                            onClick={() => setNewItem({...newItem, feeling: f})} 
                            className={`p-2 rounded-xl border capitalize text-xs font-bold transition-all theme-transition ${
                                newItem.feeling === f 
                                ? `${theme.selectedBg} border-2 ${theme.selectedBorder} ${theme.selectedText}` 
                                : `border-transparent opacity-60 ${theme.textMain}`
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <textarea placeholder="Notes..." className={`w-full p-4 ${theme.inputBg} rounded-2xl text-sm font-handwritten text-lg outline-none min-h-[100px] ${theme.textMain} theme-transition`} value={newItem.note} onChange={e => setNewItem({...newItem, note: e.target.value})} />

            <input type="text" placeholder="Tags (e.g. easy, quick, tasty)" className={`w-full p-4 ${theme.inputBg} rounded-2xl font-bold outline-none text-lg placeholder:opacity-40 ${theme.textMain} theme-transition`} value={newItem.tags} onChange={e => setNewItem({...newItem, tags: e.target.value})} />

            <button type="submit" className={`w-full py-4 rounded-2xl ${theme.primary} text-white font-bold text-lg shadow-xl theme-transition clickable`}>Save Entry</button>
         </form>
      </Modal>

      {/* History Modal */}
      <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title={`History: ${viewDate.toLocaleDateString()}`} theme={theme}>
          <div className="space-y-4">
              {getEntriesForDate(viewDate, '', 'newest', []).length === 0 ? <p className={`text-center opacity-50 py-8 ${theme.textMain} theme-transition`}>No records.</p> : getEntriesForDate(viewDate, '', 'newest', []).map(e => (
                  <div key={e.id} className={`p-4 rounded-2xl border ${theme.border} ${theme.inputBg} flex justify-between ${theme.textMain} theme-transition`}>
                      <div>
                          <p className="font-bold">{e.name}</p>
                          <p className="text-xs opacity-60">{e.type} • {formatTime(e.time)}</p>
                      </div>
                      <p className="font-black text-lg">{e.calories}</p>
                  </div>
              ))}
          </div>
      </Modal>
      
      {/* --- Streak Celebration Pop-up --- */}
      {showStreakCelebration && (
        <StreakCelebration 
            currentStreak={dailyStreak} 
            onClose={() => setShowStreakCelebration(false)} 
            theme={theme} 
            userName={userName}
        />
      )}

    </div>
  );
}