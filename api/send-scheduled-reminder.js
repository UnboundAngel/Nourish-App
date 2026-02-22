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
    "Breakfast skippers don't get abs. Okay I made that up. But still.",
    "I've been waiting all night for you to eat something 🌅",
    "Your cereal bowl is giving you the silent treatment",
    "Hot take: you should eat. Revolutionary, I know.",
    "POV: You're about to have the best breakfast of your life",
    "Your body's check engine light is on. Fuel up!",
    "Not to be dramatic, but your breakfast is the most important decision today",
    "Alexa, remind them to eat breakfast. Oh wait, that's my job.",
  ],
  lunch: [
    "Lunch o'clock. Your afternoon self is already dreading what you're about to do to them.",
    "The afternoon slump is coming. Lunch is the only thing standing between you and a nap at your desk.",
    "Your brain is running on fumes and vibes. Feed it something real.",
    "It's been hours. Your stomach has moved past polite requests.",
    "Lunch isn't optional. I don't know who told you it was.",
    "The vending machine is right there. Don't do it. Eat a real meal.",
    "Fun fact: hangry is not a personality trait. It's a symptom. Treat it.",
    "Your coworkers are eating. Your friends are eating. What are you doing.",
    "Midday check-in: have you eaten? No? That's what I thought.",
    "The lunch bell rang. You didn't hear it because you were ignoring it.",
  ],
  lunch_had_meals: [
    "You ate earlier, good. Now do it again.",
    "Breakfast was great. Lunch is the sequel. Don't skip the sequel.",
    "You're on a roll today. Keep it going, eat some lunch!",
    "One meal down. two to go. lets start with lunch next.",
    "Your body liked what you gave it earlier. It's asking for more.",
    "Momentum is a thing. You've got it. Don't lose it at lunch.",
    "You already did the hard part today. Lunch is easy. Go eat.",
    "Still going strong — don't let lunch be the one that gets away.",
  ],
  dinner: [
    "The day is almost over. Don't let dinner be the thing you regret.",
    "Your dinner plate is sitting there, empty, judging you silently.",
    "The season finale of your eating day is about to start. Don't miss it.",
    "Dinner time. Your body has been waiting for this since lunch.",
    "The kitchen is right there. The fridge is right there. You know what to do.",
    "Hot take: dinner is the best meal. I will die on this hill.",
    "Your future midnight-snack self is begging you to eat dinner now.",
    "End the day right. Your body worked hard. Pay it back.",
    "The dinner bell tolls. For thee. Right now. That's you. 🔔",
    "Whatever you're doing, it can wait ten minutes. Eat dinner.",
  ],
  dinner_had_meals: [
    "You've been doing great today. Finish strong — dinner time.",
    "Almost there. One more meal and today is officially a win.",
    "You fed yourself well today. Don't stop now.",
    "The final chapter of today's meals is ready to be written.",
    "You've made it to dinner. This is the victory lap.",
    "Good day of eating. Cap it off properly.",
    "Dinner is the punctuation at the end of a good day. Don't leave it as a run-on sentence.",
    "You showed up for breakfast and lunch. Show up for dinner too.",
  ],
  abandonment: [
    "Did you forget about me..? I'm not like those other apps.. I promise 🥺",
    "Hey... it's been a while. I've been waiting here for you 💔",
    "I'm not crying, you're crying. Okay maybe I'm crying a little. Come back?",
    "Your garden is wilting without you... 🥀",
    "Remember me? The app that actually cares about you? I'm still here...",
    "I've been refreshing my screen hoping you'd come back 🥺",
    "Plot twist: the app missed you more than you missed it",
    "Your streak is gone but my love for you isn't. Come back!",
  ],
  goodnight: [
    "Rest well! Tomorrow's a fresh start 🌙",
    "Sweet dreams! Your garden will be here when you wake 💤",
    "Goodnight! You did great today, even if it doesn't feel like it ✨",
    "Sleep tight! Your tummy is tucked in too 🛏️",
    "The moon is out and so should you. Goodnight! 🌙",
    "shutting down for the night. You crushed it today 💪",
    "Goodnight! Fun fact: sleep is basically free recovery. Use it wisely.",
    "Time to recharge. See you tomorrow, kiddo! ",
    "Your body repairs while you sleep. So basically, sleeping IS gains.",
    "Nighty night! Tomorrow we, FEAST again 🌟",
  ],
  goodmorning: [
    "Rise and shine! Ready to nourish? ☀️",
    "Good morning! Let's make today count 🌱",
    "The sun is up and so are your possibilities! ☀️",
    "Morning! Your garden grew a little overnight 🌿",
    "New day, new meals, new munchies. Let's go!",
    "Good morning! Yesterday is gone. Today isn't though!",
    "Wake up! Your macros aren't going to track themselves 😤",
    "Rise and shine! ...and by shine, I mean eat breakfast.",
    "The early bird gets the protein. Good morning! 🐦",
    "Another day, another opportunity to eat well. Morning! ☀️",
  ],
};

/**
 * Returns a random message for the given type.
 * hasAnyMealToday switches lunch/dinner to the "had meals" pool
 * so we never send "zero fuel" copy when the user already ate.
 */
function getRandom(type, hasAnyMealToday = false) {
  let pool;
  if (type === 'lunch') {
    pool = hasAnyMealToday ? MESSAGES.lunch_had_meals : MESSAGES.lunch;
  } else if (type === 'dinner') {
    pool = hasAnyMealToday ? MESSAGES.dinner_had_meals : MESSAGES.dinner;
  } else {
    pool = MESSAGES[type];
  }
  if (!pool || pool.length === 0) return 'Time to nourish! 🌱';
  return pool[Math.floor(Math.random() * pool.length)];
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
 * Returns true if the given timezone string is a valid IANA timezone.
 */
function isValidTimezone(tz) {
  if (!tz || typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

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
    const results = [];
    const BATCH_SIZE = 50;

    // Cursor-based pagination: process users in batches of 50 to avoid
    // timeouts as the user base grows. Uses .startAfter() on the last
    // document of each page until no more results are returned.
    let lastDoc = null;
    let hasMore = true;

    while (hasMore) {
      let query = db.collectionGroup('profile')
        .where('pushNotifications', '==', true)
        .limit(BATCH_SIZE);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const usersSnapshot = await query.get();

      if (usersSnapshot.empty) {
        hasMore = false;
        break;
      }

      lastDoc = usersSnapshot.docs[usersSnapshot.docs.length - 1];
      if (usersSnapshot.docs.length < BATCH_SIZE) {
        hasMore = false;
      }

      for (const profileDoc of usersSnapshot.docs) {
      // Extract userId from the document path: artifacts/default-app-id/users/{userId}/profile/main
      const pathParts = profileDoc.ref.path.split('/');
      const userId = pathParts[3];
      if (!userId) continue;

      const profile = profileDoc.data();
      const rawTimezone = profile.timezone;
      const timezoneKnown = isValidTimezone(rawTimezone);
      // Only use the stored timezone if it is valid; otherwise fall back to UTC
      // for meal reminders and suppress time-sensitive messages entirely.
      const timezone = timezoneKnown ? rawTimezone : 'UTC';
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

      // --- GOODMORNING (skip if timezone is unknown — wrong timezone = wrong time) ---
      if (timezoneKnown && profile.goodmorningMessages && isInWindow(wakeTime)) {
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
          const lunchEntries = await db.collection(`artifacts/default-app-id/users/${userId}/journal_entries`)
            .where('type', '==', 'Lunch')
            .where('createdAt', '>=', new Date(todayStr).getTime())
            .limit(1)
            .get();

          if (lunchEntries.empty) {
            // Check if any meal was logged today so we pick the right message pool
            const anyMealEntries = await db.collection(`artifacts/default-app-id/users/${userId}/journal_entries`)
              .where('createdAt', '>=', new Date(todayStr).getTime())
              .limit(1)
              .get();
            const hasAnyMealToday = !anyMealEntries.empty;
            const msg = getRandom('lunch', hasAnyMealToday);
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
          const dinnerEntries = await db.collection(`artifacts/default-app-id/users/${userId}/journal_entries`)
            .where('type', '==', 'Dinner')
            .where('createdAt', '>=', new Date(todayStr).getTime())
            .limit(1)
            .get();

          if (dinnerEntries.empty) {
            // Check if any meal was logged today so we pick the right message pool
            const anyMealEntries = await db.collection(`artifacts/default-app-id/users/${userId}/journal_entries`)
              .where('createdAt', '>=', new Date(todayStr).getTime())
              .limit(1)
              .get();
            const hasAnyMealToday = !anyMealEntries.empty;
            const msg = getRandom('dinner', hasAnyMealToday);
            await sendPushToUser(userId, 'Dinner Time! 🍽️', msg, { tag: 'dinner' });
            await profileDoc.ref.set({
              lastNotificationSent: { type: 'dinner', timestamp: Date.now(), date: todayStr }
            }, { merge: true });
            results.push({ userId, type: 'dinner', sent: true });
            notifSent = true;
          }
        }
      }

      // --- GOODNIGHT (skip if timezone is unknown — wrong timezone = wrong time) ---
      const goodnightTime = sleepTime - 30; // 30 min before sleep
      if (!notifSent && timezoneKnown && profile.goodnightMessages && isInWindow(goodnightTime)) {
        if (lastNotif.type !== 'goodnight' || lastNotif.date !== todayStr) {
          const msg = getRandom('goodnight');
          await sendPushToUser(userId, 'Goodnight! 🌙', msg, { tag: 'goodnight' });
          await profileDoc.ref.set({
            lastNotificationSent: { type: 'goodnight', timestamp: Date.now(), date: todayStr }
          }, { merge: true });
          results.push({ userId, type: 'goodnight', sent: true });
        }
      }
      } // end for (profileDoc of usersSnapshot.docs)
    } // end while (hasMore)

    return res.status(200).json({ processed: results.length, results });
  } catch (error) {
    console.error('Scheduled reminder error:', error);
    return res.status(500).json({ error: error.message });
  }
}
