import { useState, useEffect, useCallback, useRef } from 'react';
import { getRandomMessage } from '../utils/notificationMessages';

let nextId = 10;

export function useNotifications({ todaysEntries, mealReminders, hydrationReminders }) {
  const [notifications, setNotifications] = useState(() => [
    { id: 1, text: "Welcome to Nourish! Start logging meals to grow your garden.", isRead: false, timestamp: Date.now(), type: 'system' },
  ]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const prevEntryCountRef = useRef(0);
  const lastReminderRef = useRef({ type: null, hour: null });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const addNotification = useCallback((text, type = 'info') => {
    setNotifications(prev => [
      { id: nextId++, text, isRead: false, timestamp: Date.now(), type },
      ...prev,
    ].slice(0, 20));
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const handleNotificationClick = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
    } else if (Notification.permission === "granted") {
      addNotification("Desktop notifications are already enabled.", 'system');
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        new Notification("Notifications enabled! Welcome to Nourish.");
        addNotification("Desktop notifications enabled!", 'system');
      }
    }
  };

  // Track new entries and add contextual notifications
  useEffect(() => {
    const currentCount = todaysEntries.length;
    if (prevEntryCountRef.current > 0 && currentCount > prevEntryCountRef.current) {
      const latest = todaysEntries[0];
      if (latest) {
        addNotification(`${latest.name || 'Meal'} logged — ${latest.calories || 0} kcal`, 'meal');
      }
      if (currentCount === 3) {
        addNotification("3 meals logged today! You're on track.", 'milestone');
      }
    }
    prevEntryCountRef.current = currentCount;
  }, [todaysEntries, addNotification]);

  // Meal & hydration reminder intervals (in-app + desktop) with personality-driven messages
  useEffect(() => {
    const mealInterval = mealReminders ? setInterval(() => {
      const hour = new Date().getHours();
      const hasBreakfast = todaysEntries.some(e => e.type === 'Breakfast');
      const hasLunch = todaysEntries.some(e => e.type === 'Lunch');
      const hasDinner = todaysEntries.some(e => e.type === 'Dinner');

      // Anti-spam: don't send the same type in the same hour
      let mealType = null;
      let title = null;
      if (hour >= 8 && hour < 11 && !hasBreakfast) { mealType = 'breakfast'; title = 'Breakfast Time! 🍳'; }
      else if (hour >= 12 && hour < 15 && !hasLunch) {
        // Anti-spam: if breakfast was sent and ignored, skip lunch
        if (lastReminderRef.current.type === 'breakfast' && !hasBreakfast) return;
        mealType = 'lunch'; title = 'Lunch Break! 🥗';
      }
      else if (hour >= 18 && hour < 21 && !hasDinner) { mealType = 'dinner'; title = 'Dinner Time! 🍽️'; }

      if (mealType && lastReminderRef.current.type !== mealType) {
        const msg = getRandomMessage(mealType);
        lastReminderRef.current = { type: mealType, hour };
        addNotification(msg, 'reminder');
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body: msg, icon: '/Nourish-192.png' });
        }
      }
    }, 30 * 60 * 1000) : null;

    const hydrationInterval = hydrationReminders ? setInterval(() => {
      const msg = getRandomMessage('hydration');
      addNotification(msg, 'hydration');
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification("Hydration Check 💧", { body: msg, icon: '/Nourish-192.png' });
      }
    }, 2 * 60 * 60 * 1000) : null;

    return () => {
      if (mealInterval) clearInterval(mealInterval);
      if (hydrationInterval) clearInterval(hydrationInterval);
    };
  }, [mealReminders, hydrationReminders, todaysEntries, addNotification]);

  return {
    notifications,
    isNotificationsOpen, setIsNotificationsOpen,
    unreadCount,
    handleMarkAllAsRead,
    handleNotificationClick,
    requestNotificationPermission,
  };
}
