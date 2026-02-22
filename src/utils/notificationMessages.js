// Personality-driven notification messages — sarcastic, dramatic, natural

export const NOTIFICATION_MESSAGES = {
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
  // Lunch messages when user HAS eaten something today (no zero-fuel copy)
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
  // Dinner messages when user HAS eaten something today (no zero-fuel copy)
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
    "New day, new meals, new gains. Let's go! 💪",
    "Good morning! Yesterday is gone. Today is yours.",
    "Wake up! Your macros aren't going to track themselves 😤",
    "Rise and grind! ...and by grind I mean eat breakfast.",
    "The early bird gets the protein. Good morning! 🐦",
    "Another day, another opportunity to eat well. Morning! ☀️",
  ],
  hydration: [
    "Your cells are thirsty and they're not being subtle about it. 💧",
    "Water. Right now. No excuses.",
    "You are 60% water and that percentage is currently dropping. Fix it.",
    "Plot twist: the most powerful supplement is free and comes out of a tap.",
    "Your kidneys sent a strongly worded memo. Drink water.",
    "H2O o'clock. You know what to do. �",
    "Drink water or feel weird later. Those are the options.",
    "The glass is right there. It's been right there. Drink it.",
  ],
};

/**
 * Returns a random message for the given notification type.
 * extraContext can include { hasAnyMealToday } to pick the right pool
 * for lunch/dinner and avoid false "zero fuel" copy.
 */
export function getRandomMessage(type, extraContext = {}) {
  let pool;
  if (type === 'lunch') {
    pool = extraContext.hasAnyMealToday
      ? NOTIFICATION_MESSAGES.lunch_had_meals
      : NOTIFICATION_MESSAGES.lunch;
  } else if (type === 'dinner') {
    pool = extraContext.hasAnyMealToday
      ? NOTIFICATION_MESSAGES.dinner_had_meals
      : NOTIFICATION_MESSAGES.dinner;
  } else {
    pool = NOTIFICATION_MESSAGES[type];
  }
  if (!pool || pool.length === 0) return 'Time to nourish! 🌱';
  return pool[Math.floor(Math.random() * pool.length)];
}
