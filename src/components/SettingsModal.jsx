import React, { useState } from 'react';
import { LogIn, LogOut, Eye, EyeOff, Clock, Palette, Bell, Smartphone, Globe, Moon, Sun } from 'lucide-react';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { THEMES } from './ThemeStyles';
import { Widget } from './Widgets';
import { Modal } from './Modals';

export function SettingsModal({
  theme, isSettingsOpen, setIsSettingsOpen,
  user,
  // Auth
  authMode, setAuthMode,
  email, setEmail,
  password, setPassword,
  showPassword, setShowPassword,
  handleAuth, handleGoogleLogin, handleForgotPassword,
  // Appearance
  currentThemeId, handleThemeChange,
  use24HourTime, handleTimeFormatChange,
  // Notifications
  userEmail, setUserEmail,
  dailySummary, setDailySummary,
  weeklySummary, setWeeklySummary,
  mealReminders, setMealReminders,
  hydrationReminders, setHydrationReminders,
  handleEmailSettingsSave,
  requestNotificationPermission,
  // Push Notifications
  pushNotifications, setPushNotifications,
  goodnightMessages, setGoodnightMessages,
  goodmorningMessages, setGoodmorningMessages,
  reminderTimes, setReminderTimes,
  wakeTime, setWakeTime,
  sleepTime, setSleepTime,
  timezone, setTimezone,
  weight, setWeight,
  weightUnit, setWeightUnit,
  fcmToken, permissionStatus, requestPushPermission,
  showToast,
  handleSaveNotificationSettings,
}) {
  const [showTimezoneEdit, setShowTimezoneEdit] = useState(false);
  return (
    <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Settings" theme={theme}>
        <div className="space-y-6">
            {/* Account Card */}
            <div className={`${theme.card} p-6 rounded-3xl shadow-inner flex flex-col items-center space-y-3 theme-transition`}>
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
                <div className={`${theme.card} p-4 rounded-2xl space-y-3 theme-transition`}>
                    <h4 className={`text-xs font-bold uppercase tracking-wide opacity-50 mb-3 ${theme.textMain} theme-transition`}>Account Access</h4>
                    <div className={`flex gap-2 ${theme.inputBg} p-1 rounded-xl shadow-inner theme-transition`}>
                        <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${authMode === 'login' ? `${theme.primary} text-white` : `${theme.textMain} opacity-60 hover:brightness-90`} theme-transition`}>Log In</button>
                        <button onClick={() => setAuthMode('signup')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${authMode === 'signup' ? `${theme.primary} text-white` : `${theme.textMain} opacity-60 hover:brightness-90`} theme-transition`}>Sign Up</button>
                    </div>
                    <form onSubmit={handleAuth} className="space-y-2">
                        <input type="email" placeholder="Email" required className={`w-full p-3 rounded-xl shadow-inner ${theme.inputBg} text-sm ${theme.textMain} theme-transition`} value={email} onChange={e => setEmail(e.target.value)} />
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Password" 
                                required 
                                className={`w-full p-3 pr-10 rounded-xl shadow-inner ${theme.inputBg} text-sm ${theme.textMain} theme-transition`}
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <button type="submit" className={`w-full py-3 rounded-xl ${theme.primary} text-white font-bold text-sm theme-transition hover:brightness-90`}>
                            {authMode === 'login' ? 'Log In' : 'Create Account'}
                        </button>
                    </form>
                    <button onClick={handleGoogleLogin} className={`w-full py-3 bg-white shadow-sm rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-95 ${theme.textMain} theme-transition`}>
                        <span className="text-lg">G</span> Continue with Google
                    </button>
                    {authMode === 'login' && (
                        <button 
                            type="button" 
                            onClick={() => handleForgotPassword(email)}
                            className={`w-full text-center text-xs font-bold opacity-40 hover:opacity-100 transition-opacity py-1 ${theme.textMain}`}
                        >
                            Forgot Password?
                        </button>
                    )}
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
                              className={`p-3 rounded-xl ${currentThemeId === t ? `border ${theme.primary} text-white hover:scale-105 active:scale-95` : `${theme.inputBg} opacity-60 hover:opacity-100 hover:scale-105 active:scale-95`} font-bold text-sm transition-all ${currentThemeId === t ? '' : theme.textMain} theme-transition clickable`}
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${theme.card} hover:brightness-95 active:scale-95 transition-colors ${theme.textMain} theme-transition clickable`}
                        >
                            {use24HourTime ? '24-Hour (14:00)' : '12-Hour (2:00 PM)'}
                        </button>
                    </div>
               </div>
            </Widget>
            
            {/* Push Notification Settings */}
            <Widget title="Push Notifications" icon={Smartphone} theme={theme} className="p-0">
                <div className="p-4 space-y-4">
                    {/* Enable Push Notifications */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`font-bold text-sm ${theme.textMain}`}>Push Notifications</p>
                            <p className={`text-[10px] opacity-40 ${theme.textMain}`}>
                                {permissionStatus === 'granted' ? 'Enabled' : permissionStatus === 'denied' ? 'Blocked in browser' : 'Not enabled'}
                            </p>
                        </div>
                        <button 
                            onClick={async () => {
                                if (permissionStatus !== 'granted') {
                                    const granted = await requestPushPermission();
                                    if (granted && setPushNotifications) setPushNotifications(true);
                                } else if (setPushNotifications) {
                                    setPushNotifications(!pushNotifications);
                                }
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${pushNotifications && permissionStatus === 'granted' ? `${theme.primary} text-white` : `${theme.inputBg} ${theme.textMain} opacity-60`}`}
                        >
                            {pushNotifications && permissionStatus === 'granted' ? 'On' : 'Off'}
                        </button>
                    </div>

                    <div className={`w-full h-px ${theme.border} theme-transition`}></div>

                    {/* Meal Reminder Times */}
                    <h4 className={`text-xs font-bold uppercase tracking-wide opacity-50 ${theme.textMain}`}>Meal Reminder Times</h4>
                    
                    <label className={`flex items-center justify-between text-sm font-medium ${theme.textMain}`}>
                        <span>Meal Reminders</span>
                        <input type="checkbox" checked={mealReminders} onChange={e => setMealReminders(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    </label>

                    {mealReminders && (
                        <div className="space-y-2 pl-2">
                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold ${theme.textMain} opacity-60`}>Breakfast</span>
                                <input type="time" value={reminderTimes?.breakfast || '08:00'} onChange={e => setReminderTimes && setReminderTimes(prev => ({...prev, breakfast: e.target.value}))} className={`p-1.5 rounded-lg text-xs font-bold ${theme.inputBg} ${theme.textMain} outline-none`} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold ${theme.textMain} opacity-60`}>Lunch</span>
                                <input type="time" value={reminderTimes?.lunch || '12:00'} onChange={e => setReminderTimes && setReminderTimes(prev => ({...prev, lunch: e.target.value}))} className={`p-1.5 rounded-lg text-xs font-bold ${theme.inputBg} ${theme.textMain} outline-none`} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold ${theme.textMain} opacity-60`}>Dinner</span>
                                <input type="time" value={reminderTimes?.dinner || '18:00'} onChange={e => setReminderTimes && setReminderTimes(prev => ({...prev, dinner: e.target.value}))} className={`p-1.5 rounded-lg text-xs font-bold ${theme.inputBg} ${theme.textMain} outline-none`} />
                            </div>
                        </div>
                    )}

                    <label className={`flex items-center justify-between text-sm font-medium ${theme.textMain}`}>
                        <span>Hydration Reminders</span>
                        <input type="checkbox" checked={hydrationReminders} onChange={e => setHydrationReminders(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    </label>

                    <div className={`w-full h-px ${theme.border} theme-transition`}></div>

                    {/* Goodnight / Goodmorning */}
                    <h4 className={`text-xs font-bold uppercase tracking-wide opacity-50 ${theme.textMain}`}>Daily Messages</h4>
                    <label className={`flex items-center justify-between text-sm font-medium ${theme.textMain}`}>
                        <div className="flex items-center gap-2"><Sun size={14} className="opacity-50" /><span>Good Morning</span></div>
                        <input type="checkbox" checked={goodmorningMessages ?? true} onChange={e => setGoodmorningMessages && setGoodmorningMessages(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    </label>
                    <label className={`flex items-center justify-between text-sm font-medium ${theme.textMain}`}>
                        <div className="flex items-center gap-2"><Moon size={14} className="opacity-50" /><span>Goodnight</span></div>
                        <input type="checkbox" checked={goodnightMessages ?? true} onChange={e => setGoodnightMessages && setGoodnightMessages(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    </label>

                    <div className={`w-full h-px ${theme.border} theme-transition`}></div>

                    {/* Schedule Info */}
                    <h4 className={`text-xs font-bold uppercase tracking-wide opacity-50 ${theme.textMain}`}>Your Schedule</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className={`text-[10px] font-bold uppercase opacity-40 block mb-1 ${theme.textMain}`}>Wake Up</label>
                            <input type="time" value={wakeTime || '07:00'} onChange={e => setWakeTime && setWakeTime(e.target.value)} className={`w-full p-2 rounded-xl text-sm font-bold ${theme.inputBg} ${theme.textMain} outline-none`} />
                        </div>
                        <div>
                            <label className={`text-[10px] font-bold uppercase opacity-40 block mb-1 ${theme.textMain}`}>Sleep</label>
                            <input type="time" value={sleepTime || '23:00'} onChange={e => setSleepTime && setSleepTime(e.target.value)} className={`w-full p-2 rounded-xl text-sm font-bold ${theme.inputBg} ${theme.textMain} outline-none`} />
                        </div>
                    </div>

                    {/* Timezone */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Globe size={14} className="opacity-50" />
                            <span className={`text-xs font-bold ${theme.textMain} opacity-60`}>{timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                        </div>
                        <button onClick={() => setShowTimezoneEdit(!showTimezoneEdit)} className={`text-[10px] font-bold opacity-40 hover:opacity-100 ${theme.textMain}`}>
                            {showTimezoneEdit ? 'Done' : 'Change'}
                        </button>
                    </div>
                    {showTimezoneEdit && (
                        <input 
                            type="text" 
                            placeholder="e.g. America/New_York" 
                            value={timezone || ''} 
                            onChange={e => setTimezone && setTimezone(e.target.value)} 
                            className={`w-full p-2 rounded-xl text-xs font-bold ${theme.inputBg} ${theme.textMain} outline-none`} 
                        />
                    )}

                    {/* Save Button */}
                    {handleSaveNotificationSettings && (
                        <button 
                            onClick={handleSaveNotificationSettings}
                            className={`w-full py-2.5 rounded-xl ${theme.primary} text-white font-bold text-sm hover:brightness-90 active:scale-95 transition-all`}
                        >
                            Save Notification Settings
                        </button>
                    )}
                </div>
            </Widget>

            {/* Email Notification Settings */}
            <Widget title="Email Notifications" icon={Bell} theme={theme} className="p-0">
                <div className="p-4 space-y-4">
                    <form onSubmit={handleEmailSettingsSave} className="space-y-3">
                        <input 
                            type="email" 
                            placeholder="Your Email for Summaries" 
                            className={`w-full p-3 rounded-xl shadow-inner ${theme.inputBg} text-sm ${theme.textMain} theme-transition`}
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
                        <button type="submit" className={`w-full py-2 rounded-xl ${theme.secondary.replace('bg-', 'bg-')} text-white font-bold text-sm mt-2 theme-transition hover:brightness-90 active:scale-95`}>
                            Save Email Settings
                        </button>
                    </form>
                </div>
            </Widget>
        </div>
    </Modal>
  );
}
