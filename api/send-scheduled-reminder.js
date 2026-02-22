import admin from 'firebase-admin';
import { sendPushToUser } from './send-push-notification.js';

// Notification message banks (duplicated server-side since we can't import from src/)
const MESSAGES = {
  breakfast: [
    "Your macros are looking lonely without you 🥺",
    "Plot twist: You're the main character who forgot to eat",
    "Breaking news: Your stomach just filed a missing persons report",
    "Your future self called. They want their gains back.",
    "The breakfast table misses you. It told me personally.",
    "Fun fact: breakfast is the most important meal. I don't make the rules.",
    "Your metabolism just sent a formal complaint 📝",
    "Rise, shine, and feed the machine! 💪",
    "Somewhere, a pancake is crying because you haven't logged yet",
    "Good morning! Your body is literally begging for fuel right now",
    "The early bird gets the gains. Just saying.",
    "Your kitchen called. It's feeling neglected.",
    "I've been waiting all night for you to eat something 🌅",
    "Your cereal bowl is giving you the silent treatment",
    "Hot take: you should eat. Revolutionary, I know.",
    "POV: You're about to have the best breakfast of your life",
    "Your body's check engine light is on. Fuel up!",
    "Not to be dramatic, but your breakfast is the most important decision today",
  ],
  lunch: [
    "Lunchtime! Your stomach just filed a missing persons report 🔍",
    "It's noon somewhere and you haven't eaten. Suspicious.",
    "Your afternoon self will thank your lunchtime self. Trust me.",
    "Midday fuel check: are we running on empty? 🤔",
    "The lunch bell rang 20 minutes ago. Where are you??",
    "Lunch isn't just a meal, it's a lifestyle. Embrace it.",
    "Your brain needs glucose. I'm just the messenger.",
    "Halfway through the day and zero fuel? Bold strategy.",
    "The afternoon slump is coming. Lunch is your only defense.",
    "I'm not saying you HAVE to eat lunch, but... you have to eat lunch.",
    "Noon o'clock! Time to refuel the human machine 🤖",
    "Fun fact: hangry isn't a personality trait. It's a cry for lunch.",
    "Your afternoon productivity depends on what you eat NOW",
    "Breaking: Local person forgets lunch exists. More at 5.",
    "Your body is running on vibes alone right now. Feed it.",
  ],
  dinner: [
    "Dinner o'clock! Let's make it legendary 🍽️",
    "The sun is setting and so is your blood sugar. Eat!",
    "Your dinner plate called. It's feeling empty inside.",
    "Evening fuel-up time! What culinary adventure awaits?",
    "The kitchen is calling your name. Can you hear it?",
    "Dinner isn't just food, it's the season finale of your day 🎬",
    "Your stomach wrote you a love letter. It says 'feed me'.",
    "Last meal of the day! Make it count 💫",
    "The dinner table is set. The only thing missing is... you.",
    "Your evening self deserves a proper meal. Don't let them down.",
    "The fridge light is the only light you need right now",
    "Dinner time! Your taste buds have been waiting all day for this moment",
    "Hot take: dinner is the best meal. Fight me.",
    "Your body's been working hard all day. Reward it!",
    "The dinner bell tolls for thee 🔔",
  ],
  abandonment: [
    "Did you forget about me..? I'm not like those other apps.. I promise 🥺",
    "Hey... it's been a while. I've been waiting here for you 💔",
    "I'm not crying, you're crying. Okay maybe I'm crying a little. Come back?",
    "Your garden is wilting without you... 🥀",
    "Remember me? The app that actually cares about you? Still here.",
    "I've been refreshing my screen hoping you'd come back 🥺",
  ],
  goodnight: [
    "Rest well! Tomorrow's a fresh start 🌙",
    "Sweet dreams! Your garden will be here when you wake 💤",
    "Goodnight! You did great today, even if it doesn't feel like it ✨",
    "Sleep tight! Your macros are tucked in too 🛏️",
    "The moon is out and so are you. Goodnight! 🌙",
    "Logging off for the night. You crushed it today 💪",
    "Time to recharge. See you tomorrow, champion 🏆",
    "Nighty night! Tomorrow we feast again 🌟",
  ],
  goodmorning: [
    "Rise and shine! Ready to nourish? ☀️",
    "Good morning! Let's make today count 🌱",
    "The sun is up and so are your possibilities! ☀️",
    "Morning! Your garden grew a little overnight 🌿",
    "New day, new meals, new gains. Let's go! 💪",
    "Good morning! Yesterday is gone. Today is yours.",
    "Wake up! Your macros aren't going to track themselves 😤",
    "Rise and grind! ...and by grind I mean eat breakfast.",
    "The early bird gets the protein. Good morning! 🐦",
  ],
};

function getRandom(type) {
  const msgs = MESSAGES[type];
  if (!msgs || msgs.length === 0) return 'Time to nourish! 🌱';
  return msgs[Math.floor(Math.random() * msgs.length)];
}

// Initialize Firebase Admin (Only once)
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

const db = admin.firestore();

/**
 * Convert a time string like "08:30" to minutes since midnight: 510
 */
function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Get current time in a user's timezone as minutes since midnight.
 */
function getCurrentMinutesInTimezone(timezone) {
  try {
    const now = new Date();
    const formatted = now.toLocaleTimeString('en-US', { 
      timeZone: timezone, 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const [h, m] = formatted.split(':').map(Number);
    return h * 60 + m;
  } catch {
    // Fallback to UTC
    const now = new Date();
    return now.getUTCHours() * 60 + now.getUTCMinutes();
  }
}

/**
 * Get today's date string in a user's timezone.
 */
function getTodayInTimezone(timezone) {
  try {
    const now = new Date();
    return now.toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Cron handler — runs every 30 minutes.
 * Checks each user's reminder schedule and sends push notifications.
 */
export default async function handler(req, res) {
  const { secret } = req.query;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Fetch all user profiles that have push notifications enabled
    const usersSnapshot = await db.collectionGroup('profile')
      .where('pushNotifications', '==', true)
      .get();

    const results = [];

    for (const profileDoc of usersSnapshot.docs) {
      // Extract userId from the document path: artifacts/default-app-id/users/{userId}/profile/main
      const pathParts = profileDoc.ref.path.split('/');
      const userId = pathParts[3];
      if (!userId) continue;

      const profile = profileDoc.data();
      const timezone = profile.timezone || 'America/New_York';
      const currentMinutes = getCurrentMinutesInTimezone(timezone);
      const todayStr = getTodayInTimezone(timezone);

      const wakeTime = timeToMinutes(profile.wakeTime || '07:00');
      const sleepTime = timeToMinutes(profile.sleepTime || '23:00');

      // Calculate smart reminder times based on wake/sleep schedule
      const breakfastTime = timeToMinutes(profile.reminderTimes?.breakfast) || (wakeTime + 90);  // wake + 1.5h
      const lunchTime = timeToMinutes(profile.reminderTimes?.lunch) || (breakfastTime + 270);    // breakfast + 4.5h
      const dinnerTime = timeToMinutes(profile.reminderTimes?.dinner) || (sleepTime - 210);      // sleep - 3.5h

      const lastNotif = profile.lastNotificationSent || {};
      const lastMealDate = profile.lastMealDate || '';
      
      // Check how many days since last meal log
      const daysSinceLastMeal = lastMealDate ? 
        Math.floor((new Date(todayStr) - new Date(lastMealDate)) / (1000 * 60 * 60 * 24)) : 999;

      // --- ABANDONMENT CHECK (force notification, can't disable) ---
      if (daysSinceLastMeal >= 3) {
        const lastAbandonmentDate = lastNotif.abandonmentDate || '';
        if (lastAbandonmentDate !== todayStr) {
          const msg = getRandom('abandonment');
          await sendPushToUser(userId, 'Nourish misses you 🥺', msg, { tag: 'abandonment' });
          await profileDoc.ref.set({
            lastNotificationSent: { ...lastNotif, type: 'abandonment', timestamp: Date.now(), abandonmentDate: todayStr }
          }, { merge: true });
          results.push({ userId, type: 'abandonment', sent: true });
          continue; // Don't send other notifications on abandonment day
        }
      }

      // --- ANTI-SPAM: Check if breakfast was ignored ---
      const breakfastIgnored = lastNotif.type === 'breakfast' && 
        lastNotif.date === todayStr && 
        !profile.lastMealDate?.startsWith(todayStr);

      // Window check: is current time within 30 min of the reminder time?
      const isInWindow = (targetMinutes) => {
        const diff = currentMinutes - targetMinutes;
        return diff >= 0 && diff < 30;
      };

      let notifSent = false;

      // --- GOODMORNING ---
      if (profile.goodmorningMessages && isInWindow(wakeTime)) {
        if (lastNotif.date !== todayStr || lastNotif.type !== 'goodmorning') {
          const msg = getRandom('goodmorning');
          await sendPushToUser(userId, 'Good Morning! ☀️', msg, { tag: 'goodmorning' });
          await profileDoc.ref.set({
            lastNotificationSent: { type: 'goodmorning', timestamp: Date.now(), date: todayStr }
          }, { merge: true });
          results.push({ userId, type: 'goodmorning', sent: true });
          notifSent = true;
        }
      }

      // --- BREAKFAST REMINDER ---
      if (!notifSent && profile.mealReminders !== false && isInWindow(breakfastTime)) {
        if (lastNotif.date !== todayStr || !['breakfast', 'goodmorning'].includes(lastNotif.type)) {
          // Check if user already logged breakfast today
          const todayEntries = await db.collection(`artifacts/default-app-id/users/${userId}/journal_entries`)
            .where('type', '==', 'Breakfast')
            .where('createdAt', '>=', new Date(todayStr).getTime())
            .limit(1)
            .get();

          if (todayEntries.empty) {
            const msg = getRandom('breakfast');
            await sendPushToUser(userId, 'Breakfast Time! 🍳', msg, { tag: 'breakfast' });
            await profileDoc.ref.set({
              lastNotificationSent: { type: 'breakfast', timestamp: Date.now(), date: todayStr }
            }, { merge: true });
            results.push({ userId, type: 'breakfast', sent: true });
            notifSent = true;
          }
        }
      }

      // --- LUNCH REMINDER (skip if breakfast was ignored) ---
      if (!notifSent && !breakfastIgnored && profile.mealReminders !== false && isInWindow(lunchTime)) {
        if (lastNotif.type !== 'lunch' || lastNotif.date !== todayStr) {
          const todayEntries = await db.collection(`artifacts/default-app-id/users/${userId}/journal_entries`)
            .where('type', '==', 'Lunch')
            .where('createdAt', '>=', new Date(todayStr).getTime())
            .limit(1)
            .get();

          if (todayEntries.empty) {
            const msg = getRandom('lunch');
            await sendPushToUser(userId, 'Lunch Break! 🥗', msg, { tag: 'lunch' });
            await profileDoc.ref.set({
              lastNotificationSent: { type: 'lunch', timestamp: Date.now(), date: todayStr }
            }, { merge: true });
            results.push({ userId, type: 'lunch', sent: true });
            notifSent = true;
          }
        }
      }

      // --- DINNER REMINDER ---
      if (!notifSent && profile.mealReminders !== false && isInWindow(dinnerTime)) {
        if (lastNotif.type !== 'dinner' || lastNotif.date !== todayStr) {
          const todayEntries = await db.collection(`artifacts/default-app-id/users/${userId}/journal_entries`)
            .where('type', '==', 'Dinner')
            .where('createdAt', '>=', new Date(todayStr).getTime())
            .limit(1)
            .get();

          if (todayEntries.empty) {
            const msg = getRandom('dinner');
            await sendPushToUser(userId, 'Dinner Time! 🍽️', msg, { tag: 'dinner' });
            await profileDoc.ref.set({
              lastNotificationSent: { type: 'dinner', timestamp: Date.now(), date: todayStr }
            }, { merge: true });
            results.push({ userId, type: 'dinner', sent: true });
            notifSent = true;
          }
        }
      }

      // --- GOODNIGHT (also sent if breakfast was ignored as anti-spam replacement) ---
      const goodnightTime = sleepTime - 30; // 30 min before sleep
      if (!notifSent && profile.goodnightMessages && isInWindow(goodnightTime)) {
        if (lastNotif.type !== 'goodnight' || lastNotif.date !== todayStr) {
          const msg = getRandom('goodnight');
          await sendPushToUser(userId, 'Goodnight! 🌙', msg, { tag: 'goodnight' });
          await profileDoc.ref.set({
            lastNotificationSent: { type: 'goodnight', timestamp: Date.now(), date: todayStr }
          }, { merge: true });
          results.push({ userId, type: 'goodnight', sent: true });
        }
      }
    }

    return res.status(200).json({ processed: results.length, results });
  } catch (error) {
    console.error('Scheduled reminder error:', error);
    return res.status(500).json({ error: error.message });
  }
}
