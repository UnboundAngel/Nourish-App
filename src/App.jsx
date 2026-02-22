import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Activity } from 'lucide-react';
import { THEMES, GlobalStyles } from './components/ThemeStyles';
const CustomCalendar = lazy(() => import('./components/Calendar').then(m => ({ default: m.CustomCalendar })));
import { Modal, WelcomeScreen, StreakCelebration } from './components/Modals';
import { MealForm } from './components/MealForm';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MainContent } from './components/MainContent';
import { FAB } from './components/FAB';
const SettingsModal = lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));
import { MobileBottomNav } from './components/MobileBottomNav';
import { TrendsPage } from './components/TrendsPage';
import { NourishGarden } from './components/NourishGarden';
import { ToastContainer } from './components/ToastContainer';
import { useSettings } from './hooks/useSettings';
import { useAuth } from './hooks/useAuth';
import { useEntries } from './hooks/useEntries';
import { useStreak } from './hooks/useStreak';
import { useHydration } from './hooks/useHydration';
import { useNotifications } from './hooks/useNotifications';
import { useWhisper } from './hooks/useWhisper';
import { useInsights } from './hooks/useInsights';
import { useUpdateCheck } from './hooks/useUpdateCheck';
import { useToast } from './hooks/useToast';
import { usePushNotifications } from './hooks/usePushNotifications';
import { useClientScheduler } from './hooks/useClientScheduler';
import { formatTime } from './utils/helpers';

export default function NourishApp() {
  // --- Settings & UI State ---
  const settings = useSettings();
  const {
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
    pushNotifications, setPushNotifications,
    goodnightMessages, setGoodnightMessages,
    goodmorningMessages, setGoodmorningMessages,
    reminderTimes, setReminderTimes,
    wakeTime, setWakeTime,
    sleepTime, setSleepTime,
    timezone, setTimezone,
    weight, setWeight,
    weightUnit, setWeightUnit,
    dailyTargets, setDailyTargets,
    editedTargets, setEditedTargets,
    userName, setUserName,
    dailyStreak, setDailyStreak,
    handleThemeChange: rawHandleThemeChange,
    handleTimeFormatChange: rawHandleTimeFormatChange,
    handleEmailSettingsSave: rawHandleEmailSettingsSave,
    handleSaveTargets: rawHandleSaveTargets,
    handleSaveNotificationSettings: rawHandleSaveNotificationSettings,
  } = settings;

  const theme = THEMES[currentThemeId];

  // --- Mobile State ---
  const [isStreakOpen, setIsStreakOpen] = useState(false);
  const [isTrendsOpen, setIsTrendsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // --- Hydration (must be before useAuth since useAuth references it) ---
  const [tempUser, setTempUser] = useState(null);
  const hydration = useHydration({ user: tempUser });
  const { waterOz, handleAddWater } = hydration;

  // --- Auth ---
  const {
    user, profileData, loading,
    authMode, setAuthMode,
    email, setEmail,
    password, setPassword,
    showPassword, setShowPassword,
    handleSaveProfileFull,
    handleAuth: rawHandleAuth,
    handleGoogleLogin: rawHandleGoogleLogin,
    handleForgotPassword,
  } = useAuth({
    setUserName, setCurrentThemeId, setUse24HourTime, setUserEmail,
    setDailySummary, setWeeklySummary, setDailyStreak, setWaterOz: (v) => hydration.setWaterOz(v),
    setDailyTargets, setEditedTargets, setShowWelcome,
    setPushNotifications, setGoodnightMessages, setGoodmorningMessages,
    setReminderTimes, setWakeTime, setSleepTime, setTimezone,
    setWeight, setWeightUnit, setMealReminders, setHydrationReminders,
  });

  // Update hydration user reference when auth user changes
  useEffect(() => {
    setTempUser(user);
  }, [user]);

  // --- Entries ---
  const {
    entries,
    searchTerm, setSearchTerm,
    activeTags, setActiveTags,
    sortBy, setSortBy,
    editingId, setEditingId,
    setNewItem,
    getEntriesForDate,
    todaysEntries, todaysTotals, allTags,
    openNewEntryModal: rawOpenNewEntryModal,
    handleSaveEntry: rawHandleSaveEntry,
    handleDelete, handleToggleFinish,
  } = useEntries({ user });

  // --- Streak ---
  useStreak({ user, loading, profileData, getEntriesForDate, setDailyStreak });

  // --- Notifications ---
  const {
    notifications,
    isNotificationsOpen, setIsNotificationsOpen,
    unreadCount,
    handleMarkAllAsRead,
    handleNotificationClick,
    requestNotificationPermission,
  } = useNotifications({ todaysEntries, mealReminders, hydrationReminders });

  // --- Daily Whisper ---
  const { dailyWhisper } = useWhisper({ todaysEntries, todaysTotals, dailyTargets });

  // --- Insights & Experiments ---
  const insights = useInsights(entries, user);

  // --- Update Check (checks every 60s if a new deploy is available) ---
  const { updateAvailable, refresh } = useUpdateCheck();

  // --- Toast Notifications ---
  const { toasts, showToast, dismissToast } = useToast();

  // --- Push Notifications ---
  const { fcmToken, permissionStatus, requestPermission, unregisterFCMToken } = usePushNotifications({ user, showToast });

  // --- Client-Side Scheduler (workaround for Vercel free tier) ---
  useClientScheduler({
    user,
    pushNotifications,
    mealReminders,
    goodnightMessages,
    goodmorningMessages,
    reminderTimes,
    wakeTime,
    sleepTime,
    timezone,
    entries,
    showToast,
  });

  // --- Wrapped Settings Handlers (pass live user) ---
  const handleThemeChange = (newTheme) => rawHandleThemeChange(newTheme, user);
  const handleTimeFormatChange = (val) => rawHandleTimeFormatChange(val, user);
  const handleEmailSettingsSave = (e) => rawHandleEmailSettingsSave(e, user);
  const handleSaveTargets = (newTargets) => rawHandleSaveTargets(newTargets, user);

  // --- Wrapped Auth Handlers ---
  const handleSaveProfile = async (name, newEmail, weight, weightUnit, wakeTime, sleepTime, explicitUid) => {
    await handleSaveProfileFull(name, newEmail, explicitUid, { dailyTargets, waterOz, dailyStreak, weight, weightUnit, wakeTime, sleepTime });
  };

  const handleAuth = async (e, customEmail, customPassword, customMode, onboardingName, isQuiet) => {
    const result = await rawHandleAuth(e, customEmail, customPassword, customMode, onboardingName, isQuiet, { handleSaveProfile });
    if (result && !isQuiet) setIsSettingsOpen(false);
    return result;
  };

  const handleGoogleLogin = async (onboardingName, isQuiet) => {
    const result = await rawHandleGoogleLogin(onboardingName, isQuiet, { handleSaveProfile });
    if (result && !isQuiet) setIsSettingsOpen(false);
    return result;
  };

  const openNewEntryModal = () => rawOpenNewEntryModal(setIsModalOpen);

  const handleSaveEntry = async (formData) => {
    await rawHandleSaveEntry(formData, { dailyStreak, setDailyStreak, setShowStreakCelebration, setIsModalOpen, showToast });
  };

  // --- Loading Screen ---
  if (loading) return <div className={`min-h-screen flex items-center justify-center ${theme.bg}`}><Activity className="animate-spin text-[#2D5A27]" /></div>;

  return (
    <div className={`min-h-screen flex ${theme.bg} transition-colors duration-500 font-sans text-slate-800`}>
      <GlobalStyles />

      {/* Update Available Banner */}
      {updateAvailable && (
        <div className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-lg animate-in slide-in-from-top duration-500">
          <span className="text-sm font-bold mr-3">A new version of Nourish is available</span>
          <button onClick={refresh} className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-sm transition-all hover:scale-105 active:scale-95">
            Refresh
          </button>
        </div>
      )}
      
      {/* Welcome Screen */}
      {showWelcome && (
        <WelcomeScreen 
            onSave={handleSaveProfile} 
            theme={theme}
            onAuth={handleAuth}
            onGoogle={handleGoogleLogin}
            onForgotPassword={handleForgotPassword}
            currentThemeId={currentThemeId}
            onThemeChange={handleThemeChange}
            dailyTargets={dailyTargets}
            onTargetsChange={setDailyTargets}
            allThemes={THEMES}
            setShowWelcome={setShowWelcome}
        />
      )}

      {/* Desktop Sidebar */}
      {!showWelcome && <Sidebar
        theme={theme}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        setViewDate={setViewDate}
        setIsHistoryOpen={setIsHistoryOpen}
        setIsCalendarOpen={setIsCalendarOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        setIsTrendsOpen={setIsTrendsOpen}
        dailyStreak={dailyStreak}
        getEntriesForDate={getEntriesForDate}
        isNotificationsOpen={isNotificationsOpen}
        setIsNotificationsOpen={setIsNotificationsOpen}
        handleMarkAllAsRead={handleMarkAllAsRead}
        notifications={notifications}
        handleNotificationClick={handleNotificationClick}
        unreadCount={unreadCount}
      />}

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen relative overflow-y-auto custom-scrollbar">
        <Header
          theme={theme}
          userName={userName}
          greetingTime={greetingTime}
          setIsCalendarOpen={setIsCalendarOpen}
          isNotificationsOpen={isNotificationsOpen}
          setIsNotificationsOpen={setIsNotificationsOpen}
          handleMarkAllAsRead={handleMarkAllAsRead}
          notifications={notifications}
          handleNotificationClick={handleNotificationClick}
          unreadCount={unreadCount}
        />

        <MainContent
          theme={theme}
          currentThemeId={currentThemeId}
          dailyWhisper={dailyWhisper}
          todaysEntries={todaysEntries}
          todaysTotals={todaysTotals}
          waterOz={waterOz}
          handleAddWater={handleAddWater}
          dailyTargets={dailyTargets}
          setIsTargetsModalOpen={setIsTargetsModalOpen}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeTags={activeTags}
          setActiveTags={setActiveTags}
          allTags={allTags}
          sortBy={sortBy}
          setSortBy={setSortBy}
          setEditingId={setEditingId}
          setNewItem={setNewItem}
          setIsModalOpen={setIsModalOpen}
          handleDelete={handleDelete}
          handleToggleFinish={handleToggleFinish}
          use24HourTime={use24HourTime}
          dailyStreak={dailyStreak}
          getEntriesForDate={getEntriesForDate}
          setIsStreakOpen={setIsStreakOpen}
          insights={insights}
        />
      </main>

      {/* FAB */}
      {!showWelcome && <FAB
        theme={theme}
        isFabMenuOpen={isFabMenuOpen}
        setIsFabMenuOpen={setIsFabMenuOpen}
        handleAddWater={handleAddWater}
        openNewEntryModal={openNewEntryModal}
      />}

      {/* Mobile Bottom Nav */}
      {!showWelcome && <MobileBottomNav
        theme={theme}
        dailyStreak={dailyStreak}
        setIsCalendarOpen={setIsCalendarOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        setIsStreakOpen={setIsStreakOpen}
        setIsFabMenuOpen={setIsFabMenuOpen}
        setIsTrendsOpen={setIsTrendsOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />}

      {/* Garden / Streak Modal (Mobile) */}
      <Modal isOpen={isStreakOpen} onClose={() => setIsStreakOpen(false)} title="Your Nourish Garden" theme={theme}>
        <NourishGarden
          theme={theme}
          dailyStreak={dailyStreak}
          getEntriesForDate={getEntriesForDate}
        />
      </Modal>

      {/* Calendar Modal */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsCalendarOpen(false)}></div>
          <div className="relative z-10 w-full max-w-sm">
            <Suspense fallback={<div className="flex justify-center py-8"><Activity className="animate-spin opacity-30" /></div>}>
            <CustomCalendar 
                selectedDate={viewDate} 
                entries={entries}
                onSelectDate={(d) => { setViewDate(d); setIsHistoryOpen(true); }} 
                onClose={() => setIsCalendarOpen(false)} 
                theme={theme} 
            />
            </Suspense>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <Suspense fallback={null}>
      <SettingsModal
        theme={theme}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        user={user}
        authMode={authMode}
        setAuthMode={setAuthMode}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        handleAuth={handleAuth}
        handleGoogleLogin={handleGoogleLogin}
        handleForgotPassword={handleForgotPassword}
        currentThemeId={currentThemeId}
        handleThemeChange={handleThemeChange}
        use24HourTime={use24HourTime}
        handleTimeFormatChange={handleTimeFormatChange}
        userEmail={userEmail}
        setUserEmail={setUserEmail}
        dailySummary={dailySummary}
        setDailySummary={setDailySummary}
        weeklySummary={weeklySummary}
        setWeeklySummary={setWeeklySummary}
        mealReminders={mealReminders}
        setMealReminders={setMealReminders}
        hydrationReminders={hydrationReminders}
        setHydrationReminders={setHydrationReminders}
        handleEmailSettingsSave={handleEmailSettingsSave}
        requestNotificationPermission={requestNotificationPermission}
        pushNotifications={pushNotifications}
        setPushNotifications={setPushNotifications}
        goodnightMessages={goodnightMessages}
        setGoodnightMessages={setGoodnightMessages}
        goodmorningMessages={goodmorningMessages}
        setGoodmorningMessages={setGoodmorningMessages}
        reminderTimes={reminderTimes}
        setReminderTimes={setReminderTimes}
        wakeTime={wakeTime}
        setWakeTime={setWakeTime}
        sleepTime={sleepTime}
        setSleepTime={setSleepTime}
        timezone={timezone}
        setTimezone={setTimezone}
        weight={weight}
        setWeight={setWeight}
        weightUnit={weightUnit}
        setWeightUnit={setWeightUnit}
        fcmToken={fcmToken}
        permissionStatus={permissionStatus}
        requestPushPermission={requestPermission}
        showToast={showToast}
        handleSaveNotificationSettings={() => rawHandleSaveNotificationSettings(user, showToast)}
      />
      </Suspense>

      {/* Entry Form Modal */}
      <div className="meal-form-wrapper">
        <MealForm 
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingId(null); }}
          onSave={handleSaveEntry}
          theme={theme}
          editingId={editingId}
          initialData={editingId ? entries.find(e => e.id === editingId) : null}
          use24HourTime={use24HourTime}
        />
      </div>

      {/* History Modal */}
      <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title={`History: ${viewDate.toLocaleDateString()}`} theme={theme}>
          <div className="space-y-4">
              {getEntriesForDate(viewDate, '', 'newest', []).length === 0 ? (
                <p className={`text-center opacity-50 py-8 ${theme.textMain} theme-transition`}>No records.</p>
              ) : (
                getEntriesForDate(viewDate, '', 'newest', []).map(e => (
                  <div key={e.id} className={`p-4 rounded-2xl ${theme.inputBg} flex justify-between ${theme.textMain} theme-transition`}>
                      <div>
                          <p className="font-bold">{e.name}</p>
                          <p className="text-xs opacity-60">{e.type} • {formatTime(e.time, use24HourTime)}</p>
                      </div>
                      <p className="font-black text-lg">{e.calories}</p>
                  </div>
                ))
              )}
          </div>
      </Modal>

      {/* Adjust Targets Modal */}
      <Modal 
        isOpen={isTargetsModalOpen} 
        onClose={() => setIsTargetsModalOpen(false)} 
        title="Adjust Daily Goals" 
        theme={theme}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={`text-xs font-bold uppercase opacity-60 ${theme.textMain} mb-2 block`}>Calories (kcal)</label>
              <input 
                type="number" 
                className={`w-full p-4 ${theme.inputBg} rounded-2xl font-black text-2xl outline-none ${theme.primaryText} theme-transition`}
                value={editedTargets.calories}
                onChange={(e) => setEditedTargets({ ...editedTargets, calories: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className={`text-xs font-bold uppercase opacity-60 ${theme.textMain} mb-2 block`}>Protein (g)</label>
              <input 
                type="number" 
                className={`w-full p-4 ${theme.inputBg} rounded-2xl font-black text-2xl outline-none text-green-600 theme-transition`}
                value={editedTargets.protein}
                onChange={(e) => setEditedTargets({ ...editedTargets, protein: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className={`text-xs font-bold uppercase opacity-60 ${theme.textMain} mb-2 block`}>Carbs (g)</label>
              <input 
                type="number" 
                className={`w-full p-4 ${theme.inputBg} rounded-2xl font-black text-2xl outline-none text-orange-600 theme-transition`}
                value={editedTargets.carbs}
                onChange={(e) => setEditedTargets({ ...editedTargets, carbs: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className={`text-xs font-bold uppercase opacity-60 ${theme.textMain} mb-2 block`}>Fats (g)</label>
              <input 
                type="number" 
                className={`w-full p-4 ${theme.inputBg} rounded-2xl font-black text-2xl outline-none text-blue-600 theme-transition`}
                value={editedTargets.fats}
                onChange={(e) => setEditedTargets({ ...editedTargets, fats: Number(e.target.value) })}
              />
            </div>
          </div>
          <button 
            onClick={() => handleSaveTargets(editedTargets)}
            className={`w-full py-4 rounded-2xl ${theme.primary} text-white font-bold text-lg shadow-xl theme-transition clickable hover:brightness-90 active:scale-95`}
          >
            Save New Goals
          </button>
        </div>
      </Modal>

      {/* Trends Page */}
      {isTrendsOpen && (
        <TrendsPage
          entries={entries}
          theme={theme}
          dailyTargets={dailyTargets}
          onClose={() => setIsTrendsOpen(false)}
          insights={insights}
        />
      )}

      {/* Streak Celebration */}
      {showStreakCelebration && (
        <StreakCelebration 
            currentStreak={dailyStreak} 
            onClose={() => setShowStreakCelebration(false)} 
            theme={theme} 
            userName={userName}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer 
        toasts={toasts}
        onDismiss={dismissToast}
        theme={theme}
      />

    </div>
  );
}
