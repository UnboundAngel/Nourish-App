import { useEffect, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { getRandomMessage } from '../utils/notificationMessages';

/**
 * Client-side notification scheduler - workaround for Vercel free tier cron limitations.
 * Fires once on mount and once every 30 minutes while the app is open.
 * Uses a ref for entries so meal-logging doesn't re-trigger the scheduler.
 */
export function useClientScheduler({ 
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
  showToast 
}) {
  // Track the last sent type+date in memory to prevent duplicates within a session
  const lastSentRef = useRef({ type: null, date: null });
  // Keep a stable ref to entries so the scheduler interval doesn't need entries as a dep
  const entriesRef = useRef(entries);
  const showToastRef = useRef(showToast);

  useEffect(() => { entriesRef.current = entries; }, [entries]);
  useEffect(() => { showToastRef.current = showToast; }, [showToast]);

  useEffect(() => {
    if (!user || user.isAnonymous || !pushNotifications) return;

    const checkAndSendReminder = async () => {
      try {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinutes = currentHour * 60 + now.getMinutes();
        const todayStr = now.toISOString().split('T')[0];

        // Parse reminder times
        const breakfastMinutes = reminderTimes?.breakfast ? 
          parseInt(reminderTimes.breakfast.split(':')[0]) * 60 + parseInt(reminderTimes.breakfast.split(':')[1]) : 
          (parseInt(wakeTime?.split(':')[0] || '7') * 60 + parseInt(wakeTime?.split(':')[1] || '0') + 90);
        
        const lunchMinutes = reminderTimes?.lunch ? 
          parseInt(reminderTimes.lunch.split(':')[0]) * 60 + parseInt(reminderTimes.lunch.split(':')[1]) : 
          breakfastMinutes + 270;
        
        const dinnerMinutes = reminderTimes?.dinner ? 
          parseInt(reminderTimes.dinner.split(':')[0]) * 60 + parseInt(reminderTimes.dinner.split(':')[1]) : 
          (parseInt(sleepTime?.split(':')[0] || '23') * 60 + parseInt(sleepTime?.split(':')[1] || '0') - 210);

        const wakeMinutes = parseInt(wakeTime?.split(':')[0] || '7') * 60 + parseInt(wakeTime?.split(':')[1] || '0');
        const sleepMinutes = parseInt(sleepTime?.split(':')[0] || '23') * 60 + parseInt(sleepTime?.split(':')[1] || '0');

        // Read entries from ref so this function doesn't need entries in deps
        const currentEntries = entriesRef.current || [];
        const todayEntries = currentEntries.filter(e => {
          const entryDate = new Date(e.createdAt).toISOString().split('T')[0];
          return entryDate === todayStr;
        });

        const hasBreakfast = todayEntries.some(e => e.type === 'Breakfast');
        const hasLunch = todayEntries.some(e => e.type === 'Lunch');
        const hasDinner = todayEntries.some(e => e.type === 'Dinner');
        const hasAnyMealToday = todayEntries.length > 0;

        let notificationType = null;
        let title = null;
        let extraContext = {};

        const alreadySentToday = (type) =>
          lastSentRef.current.type === type && lastSentRef.current.date === todayStr;

        const isInWindow = (targetMinutes) => {
          const diff = currentMinutes - targetMinutes;
          return diff >= 0 && diff < 30;
        };

        // Good morning message
        if (goodmorningMessages && isInWindow(wakeMinutes)) {
          if (!alreadySentToday('goodmorning')) {
            notificationType = 'goodmorning';
            title = 'Good Morning! ☀️';
          }
        }
        // Breakfast reminder
        else if (mealReminders && isInWindow(breakfastMinutes) && !hasBreakfast) {
          if (!alreadySentToday('breakfast')) {
            notificationType = 'breakfast';
            title = 'Breakfast Time! 🍳';
          }
        }
        // Lunch reminder — only send if no lunch logged; message copy aware of whether any meal exists
        else if (mealReminders && isInWindow(lunchMinutes) && !hasLunch) {
          if (!alreadySentToday('lunch')) {
            notificationType = 'lunch';
            title = 'Lunch Break! 🥗';
            extraContext = { hasAnyMealToday };
          }
        }
        // Dinner reminder
        else if (mealReminders && isInWindow(dinnerMinutes) && !hasDinner) {
          if (!alreadySentToday('dinner')) {
            notificationType = 'dinner';
            title = 'Dinner Time! 🍽️';
            extraContext = { hasAnyMealToday };
          }
        }
        // Goodnight message
        else if (goodnightMessages && isInWindow(sleepMinutes - 30)) {
          if (!alreadySentToday('goodnight')) {
            notificationType = 'goodnight';
            title = 'Goodnight! 🌙';
          }
        }

        if (notificationType) {
          const message = getRandomMessage(notificationType, extraContext);
          
          // Send browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
              body: message,
              icon: '/Nourish-192.png',
              badge: '/Nourish-192.png',
              tag: `nourish-${notificationType}`,
            });
          }

          // Update Firestore to track last notification
          await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
            lastNotificationSent: {
              type: notificationType,
              timestamp: Date.now(),
              date: todayStr,
            }
          }, { merge: true });

          lastSentRef.current = { type: notificationType, date: todayStr };

          const toast = showToastRef.current;
          if (toast) {
            toast(message, 'info');
          }
        }
      } catch (error) {
        console.error('Client scheduler error:', error);
      }
    };

    // Run once on mount, then every 30 minutes
    checkAndSendReminder();
    const interval = setInterval(checkAndSendReminder, 30 * 60 * 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pushNotifications, mealReminders, goodnightMessages, goodmorningMessages, reminderTimes, wakeTime, sleepTime, timezone]);
}
