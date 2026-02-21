import { useState, useEffect, useMemo } from 'react';

export function useWhisper({ todaysEntries, todaysTotals, dailyTargets }) {
  const [whisperMessages, setWhisperMessages] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
        try {
            const res = await fetch('/nourish-messages.json');
            const data = await res.json();
            setWhisperMessages(data);
        } catch (e) { console.error("Failed to load messages", e); }
    };
    fetchMessages();
  }, []);

  const dailyWhisper = useMemo(() => {
    if (!whisperMessages) return "Loading insights...";

    const { protein, carbs, fats } = todaysTotals;
    let category = "partial_day_logged";

    if (todaysEntries.length === 0) {
        category = "nothing_logged_yet";
    } else if (
        protein >= dailyTargets.protein && 
        carbs >= dailyTargets.carbs && 
        fats >= dailyTargets.fats
    ) {
        category = "goal_hit";
    }

    const messages = whisperMessages[category];
    if (!messages || messages.length === 0) return "Keep up the good work.";

    const day = new Date().getDate();
    const seed = day + todaysEntries.length;
    const index = seed % messages.length;
    
    return messages[index].message;
  }, [todaysEntries, todaysTotals, dailyTargets, whisperMessages]);

  return { dailyWhisper };
}
