import { useEffect, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { getRandomMessage } from '../utils/notificationMessages';

/**
 * Client-side notification scheduler - workaround for Vercel free tier cron limitations.
 * Runs every 30 minutes when the app is open and sends push notifications via FCM.
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
  const lastCheckRef = useRef({ type: null, date: null });

  useEffect(() => {
    if (!user || user.isAnonymous || !pushNotifications || !mealReminders) return;

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

        // Check today's entries
        const todayEntries = entries.filter(e => {
          const entryDate = new Date(e.createdAt).toISOString().split('T')[0];
          return entryDate === todayStr;
        });

        const hasBreakfast = todayEntries.some(e => e.type === 'Breakfast');
        const hasLunch = todayEntries.some(e => e.type === 'Lunch');
        const hasDinner = todayEntries.some(e => e.type === 'Dinner');

        let notificationType = null;
        let title = null;

        // Good morning message
        if (goodmorningMessages && currentMinutes >= wakeMinutes && currentMinutes < wakeMinutes + 30) {
          if (lastCheckRef.current.type !== 'goodmorning') {
            notificationType = 'goodmorning';
            title = 'Good Morning! ☀️';
          }
        }
        // Breakfast reminder
        else if (currentMinutes >= breakfastMinutes && currentMinutes < breakfastMinutes + 30 && !hasBreakfast) {
          if (lastCheckRef.current.type !== 'breakfast') {
            notificationType = 'breakfast';
            title = 'Breakfast Time! 🍳';
          }
        }
        // Lunch reminder (skip if breakfast was ignored)
        else if (currentMinutes >= lunchMinutes && currentMinutes < lunchMinutes + 30 && !hasLunch) {
          if (lastCheckRef.current.type !== 'lunch' && (hasBreakfast || lastCheckRef.current.type !== 'breakfast')) {
            notificationType = 'lunch';
            title = 'Lunch Break! 🥗';
          }
        }
        // Dinner reminder
        else if (currentMinutes >= dinnerMinutes && currentMinutes < dinnerMinutes + 30 && !hasDinner) {
          if (lastCheckRef.current.type !== 'dinner') {
            notificationType = 'dinner';
            title = 'Dinner Time! 🍽️';
          }
        }
        // Goodnight message
        else if (goodnightMessages && currentMinutes >= sleepMinutes - 30 && currentMinutes < sleepMinutes) {
          if (lastCheckRef.current.type !== 'goodnight') {
            notificationType = 'goodnight';
            title = 'Goodnight! 🌙';
          }
        }

        if (notificationType) {
          const message = getRandomMessage(notificationType);
          
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

          lastCheckRef.current = { type: notificationType, date: todayStr };

          if (showToast) {
            showToast(message, 'info');
          }
        }
      } catch (error) {
        console.error('Client scheduler error:', error);
      }
    };

    // Check immediately
    checkAndSendReminder();

    // Then check every 30 minutes
    const interval = setInterval(checkAndSendReminder, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, pushNotifications, mealReminders, goodnightMessages, goodmorningMessages, reminderTimes, wakeTime, sleepTime, timezone, entries, showToast]);
}
