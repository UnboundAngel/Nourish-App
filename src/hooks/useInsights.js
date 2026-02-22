import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

export function useInsights(entries, user) {
  const [activeExperiment, setActiveExperiment] = useState(() => {
    const local = localStorage.getItem('nourish-active-experiment');
    try {
        return local ? JSON.parse(local) : null;
    } catch (e) {
        return null;
    }
  });

  // Sync experiment to localStorage
  useEffect(() => {
    if (activeExperiment) {
      localStorage.setItem('nourish-active-experiment', JSON.stringify(activeExperiment));
    } else {
      localStorage.removeItem('nourish-active-experiment');
    }
  }, [activeExperiment]);

  // Load experiment from Firestore once on mount
  const hasLoadedFromFirestore = useRef(false);
  useEffect(() => {
    const loadExperiment = async () => {
      if (user && !user.isAnonymous && !hasLoadedFromFirestore.current) {
        hasLoadedFromFirestore.current = true;
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'insights');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().activeExperiment) {
          const stored = docSnap.data().activeExperiment;
          if (!activeExperiment) setActiveExperiment(stored);
        }
      }
    };
    loadExperiment();
  }, [user]);

  // Debounced sync to Firestore
  const syncTimeoutRef = useRef(null);
  useEffect(() => {
    if (user && !user.isAnonymous && hasLoadedFromFirestore.current) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(async () => {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'insights');
        await setDoc(docRef, { activeExperiment }, { merge: true });
      }, 1000);
    }
  }, [activeExperiment, user]);

  // Dismissed patterns (persisted in localStorage)
  const [dismissedPatterns, setDismissedPatterns] = useState(() => {
    try {
      const stored = localStorage.getItem('nourish-dismissed-patterns');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('nourish-dismissed-patterns', JSON.stringify(dismissedPatterns));
  }, [dismissedPatterns]);

  const dismissPattern = useCallback((patternKey, reason) => {
    setDismissedPatterns(prev => [...prev, { key: patternKey, reason, at: Date.now() }]);
  }, []);

  const insights = useMemo(() => {
    if (!entries || entries.length < 10) return { patterns: [], topTrigger: null };

    const isBad = (e) => e.feeling === 'sick' || e.feeling === 'bloated';

    // ── Single-factor collectors ──
    const tagStats = {};
    const typeStats = {};
    const timeStats = {};
    const finishedStats = {};
    const macroStats = {};
    const dayOfWeekStats = {};
    const comboStats = {};

    // Baseline bad-feeling rate (used for comparison)
    const totalBad = entries.filter(isBad).length;
    const baselineRate = entries.length > 0 ? (totalBad / entries.length) * 100 : 0;

    // Helper: get time bucket for an entry
    const getTimeBucket = (entry) => {
      if (!entry.time) return null;
      const [hours] = entry.time.split(':').map(Number);
      if (hours >= 21 || hours < 5) return 'eating after 9pm';
      if (hours >= 5 && hours < 10) return 'early morning meals';
      return null;
    };

    // Helper: get macro flags for an entry
    const getMacroFlags = (entry) => {
      const flags = [];
      if ((entry.fats || 0) > 30) flags.push('high-fat meals (>30g)');
      if ((entry.calories || 0) > 800) flags.push('large meals (>800 cal)');
      if ((entry.protein || 0) < 10 && (entry.calories || 0) > 200) flags.push('low-protein meals (<10g)');
      if ((entry.carbs || 0) > 80) flags.push('high-carb meals (>80g)');
      return flags;
    };

    // Helper: get day-of-week label
    const getDayLabel = (ts) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[new Date(ts).getDay()];
    };

    // Helper: accumulate into a stats bucket
    const accum = (bucket, key, entry, bad) => {
      if (!bucket[key]) bucket[key] = { name: key, total: 0, bad: 0, examples: [] };
      bucket[key].total++;
      if (bad) {
        bucket[key].bad++;
        if (bucket[key].examples.length < 5) {
          bucket[key].examples.push({
            id: entry.id,
            name: entry.name || 'Unnamed',
            type: entry.type || 'Snack',
            feeling: entry.feeling,
            calories: entry.calories || 0,
            time: entry.time,
            date: entry.createdAt,
          });
        }
      }
    };

    entries.forEach(entry => {
      const bad = isBad(entry);
      const tags = entry.tags ? entry.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];

      // Tags
      tags.forEach(tag => accum(tagStats, tag, entry, bad));

      // Meal type
      accum(typeStats, entry.type || 'Snack', entry, bad);

      // Time of day
      const timeBucket = getTimeBucket(entry);
      if (timeBucket) accum(timeStats, timeBucket, entry, bad);

      // Unfinished meals
      if (entry.finished === false) accum(finishedStats, 'not finishing meals', entry, bad);

      // Macro-based triggers
      getMacroFlags(entry).forEach(flag => accum(macroStats, flag, entry, bad));

      // Day of week
      if (entry.createdAt) {
        const dayLabel = getDayLabel(entry.createdAt);
        accum(dayOfWeekStats, dayLabel, entry, bad);
      }

      // ── Combination patterns (2-factor) ──
      // Tag + Time
      if (timeBucket) {
        tags.forEach(tag => {
          accum(comboStats, `${tag} + ${timeBucket}`, entry, bad);
        });
      }
      // Tag + Unfinished
      if (entry.finished === false) {
        tags.forEach(tag => {
          accum(comboStats, `${tag} + not finishing`, entry, bad);
        });
      }
      // Tag + High-fat / Large meal
      getMacroFlags(entry).forEach(flag => {
        tags.forEach(tag => {
          accum(comboStats, `${tag} + ${flag.split(' ')[0]}-${flag.split(' ')[1] || ''}`.replace(/-$/, ''), entry, bad);
        });
      });
      // Type + Time
      if (timeBucket) {
        accum(comboStats, `${(entry.type || 'Snack').toLowerCase()} + ${timeBucket}`, entry, bad);
      }
    });

    // ── Score & rank patterns ──
    const calculatePatterns = (stats, category, categoryLabel) => {
      return Object.values(stats)
        .filter(s => s.total >= 5)
        .map(s => {
          const rate = Math.round((s.bad / s.total) * 100);
          const confidence = Math.min(100, Math.round((s.total / 20) * 100));
          // Lift: how much worse than baseline?
          const lift = baselineRate > 0 ? +(rate / baselineRate).toFixed(1) : 0;
          // Composite score: rate matters most, but lift and confidence add weight
          const score = (rate * 0.5) + (lift * 15) + (confidence * 0.2);
          return {
            ...s,
            category,
            categoryLabel,
            rate,
            confidence,
            lift,
            score,
            description: generateDescription(s.name, categoryLabel, rate, s.total, s.bad, lift, baselineRate),
            suggestion: generateSuggestion(s.name, categoryLabel, rate),
          };
        })
        .filter(s => s.rate >= 35 && s.lift >= 1.3) // Must be 30% above baseline
        .sort((a, b) => b.score - a.score);
    };

    const generateDescription = (name, category, rate, total, bad, lift, baseline) => {
      const liftText = lift >= 2 ? ` — that's ${lift}x your average issue rate` : lift >= 1.5 ? ` — notably above your ${Math.round(baseline)}% average` : '';
      if (category === 'Food/Ingredient') {
        return `${bad} out of ${total} meals with "${name}" left you feeling unwell (${rate}%)${liftText}.`;
      } else if (category === 'Meal Timing') {
        return `When ${name}, ${bad} of ${total} meals caused issues (${rate}%)${liftText}.`;
      } else if (category === 'Eating Habit') {
        return `${name.charAt(0).toUpperCase() + name.slice(1)} is linked to feeling unwell ${rate}% of the time (${bad}/${total})${liftText}.`;
      } else if (category === 'Nutrition') {
        return `${name.charAt(0).toUpperCase() + name.slice(1)} correlate with feeling unwell ${rate}% of the time (${bad}/${total})${liftText}.`;
      } else if (category === 'Day of Week') {
        return `You tend to feel worse on ${name}s — ${bad} of ${total} meals caused issues (${rate}%)${liftText}.`;
      } else if (category === 'Combined Pattern') {
        return `The combination "${name}" is linked to ${rate}% issue rate (${bad}/${total} meals)${liftText}.`;
      }
      return `${rate}% of "${name}" meals left you feeling unwell (${bad}/${total}).`;
    };

    const generateSuggestion = (name, category, rate) => {
      if (category === 'Food/Ingredient') {
        if (rate >= 60) return `Try eliminating "${name}" for a week to see if symptoms improve.`;
        return `Consider reducing "${name}" or pairing it with something gentler.`;
      } else if (category === 'Meal Timing') {
        if (name.includes('after 9pm')) return 'Try finishing your last meal before 9pm for a week.';
        if (name.includes('early morning')) return 'Try waiting until after 10am for your first meal.';
        return `Adjust when you eat to avoid ${name}.`;
      } else if (category === 'Nutrition') {
        if (name.includes('high-fat')) return 'Try keeping fat under 30g per meal for a week.';
        if (name.includes('large meals')) return 'Try splitting large meals into two smaller portions.';
        if (name.includes('low-protein')) return 'Add a protein source (eggs, yogurt, nuts) to these meals.';
        if (name.includes('high-carb')) return 'Try balancing high-carb meals with protein or healthy fats.';
        return 'Adjust your macros and see if symptoms improve.';
      } else if (category === 'Day of Week') {
        return `Pay extra attention to what you eat on ${name}s — social or routine eating may be a factor.`;
      } else if (category === 'Combined Pattern') {
        const parts = name.split(' + ');
        return `Try avoiding the combination of ${parts.join(' and ')} for a week.`;
      }
      return 'Start a 7-day experiment to test this pattern.';
    };

    const dismissedKeys = new Set(dismissedPatterns.map(d => d.key));

    const allPatterns = [
      ...calculatePatterns(tagStats, 'tag', 'Food/Ingredient'),
      ...calculatePatterns(typeStats, 'type', 'Meal Category'),
      ...calculatePatterns(timeStats, 'time', 'Meal Timing'),
      ...calculatePatterns(finishedStats, 'habit', 'Eating Habit'),
      ...calculatePatterns(macroStats, 'macro', 'Nutrition'),
      ...calculatePatterns(dayOfWeekStats, 'day', 'Day of Week'),
      ...calculatePatterns(comboStats, 'combo', 'Combined Pattern'),
    ]
      .filter(p => !dismissedKeys.has(p.name))
      .sort((a, b) => b.score - a.score)
      .slice(0, 15); // Cap at 15 most relevant

    return {
      patterns: allPatterns,
      topTrigger: allPatterns[0] || null,
      baselineRate: Math.round(baselineRate),
      totalMealsAnalyzed: entries.length,
    };
  }, [entries, dismissedPatterns]);

  const startExperiment = useCallback((trigger) => {
    const experiment = {
      trigger: trigger.name,
      category: trigger.category,
      categoryLabel: trigger.categoryLabel,
      description: trigger.description,
      startDate: Date.now(),
      durationDays: 7,
      status: 'active',
      baselineRate: trigger.rate,
      baselineTotal: trigger.total,
      baselineBad: trigger.bad,
    };
    setActiveExperiment(experiment);
  }, []);

  const stopExperiment = useCallback(() => {
    setActiveExperiment(null);
  }, []);

  // Calculate experiment results if active
  const experimentResults = useMemo(() => {
    if (!activeExperiment || !entries) return null;

    const startTs = activeExperiment.startDate;
    const endTs = startTs + (activeExperiment.durationDays * 24 * 60 * 60 * 1000);
    const now = Date.now();
    const actualEndTs = Math.min(now, endTs);

    const experimentPeriodEntries = entries.filter(e => e.createdAt >= startTs && e.createdAt <= actualEndTs);
    
    let compliantEntries = [];
    let nonCompliantEntries = [];
    let allMealsInExperiment = [];

    experimentPeriodEntries.forEach(e => {
        let isCompliantMeal = true;
        
        // Check for compliance based on trigger category
        if (activeExperiment.category === 'tag') {
            const tags = (e.tags || '').toLowerCase().split(',').map(t => t.trim());
            if (tags.includes(activeExperiment.trigger.toLowerCase())) {
                isCompliantMeal = false;
            }
        } else if (activeExperiment.category === 'type') {
            if ((e.type || 'Snack') === activeExperiment.trigger) {
                isCompliantMeal = false;
            }
        } else if (activeExperiment.category === 'time') {
            if (e.time) {
                const [hours] = e.time.split(':').map(Number);
                let timeOfDay;
                if (hours >= 21 || hours < 5) timeOfDay = 'eating after 9pm';
                else if (hours >= 5 && hours < 10) timeOfDay = 'eating before 10am';
                if (timeOfDay === activeExperiment.trigger) {
                    isCompliantMeal = false;
                }
            }
        } else if (activeExperiment.category === 'habit' && activeExperiment.trigger === 'not finishing meals') {
            if (e.finished === false) {
                isCompliantMeal = false;
            }
        }

        if (isCompliantMeal) {
            compliantEntries.push(e);
        } else {
            nonCompliantEntries.push(e);
        }
        allMealsInExperiment.push(e);
    });

    const getBadRate = (list) => {
        if (list.length === 0) return 0;
        const bad = list.filter(e => e.feeling === 'sick' || e.feeling === 'bloated').length;
        return Math.round((bad / list.length) * 100);
    };

    const compliantBadRate = getBadRate(compliantEntries);
    const overallBadRate = getBadRate(allMealsInExperiment); // Overall rate during experiment
    const baselineBadRate = activeExperiment.baselineRate || 0; 

    const daysElapsed = Math.floor((Date.now() - startTs) / (24 * 60 * 60 * 1000));
    const isComplete = daysElapsed >= activeExperiment.durationDays;

    // Calculate improvement
    let improvement = 0;
    if (baselineBadRate > 0) {
        improvement = Math.round(((baselineBadRate - compliantBadRate) / baselineBadRate) * 100);
    }

    const improvementText = improvement > 0 
      ? `${improvement}% fewer issues when avoiding this trigger`
      : improvement < 0
      ? `${Math.abs(improvement)}% more issues (experiment may not be working)`
      : 'No change detected yet';

    return {
        totalMeals: allMealsInExperiment.length,
        compliantMealsCount: compliantEntries.length,
        nonCompliantMealsCount: nonCompliantEntries.length,
        complianceRate: allMealsInExperiment.length > 0 
            ? Math.round((compliantEntries.length / allMealsInExperiment.length) * 100) 
            : 0,
        compliantBadRate,
        overallBadRate,
        baselineBadRate,
        improvement,
        improvementText,
        daysElapsed,
        isComplete,
        sampleSizeWarning: allMealsInExperiment.length < 7 ? 'Track more meals for reliable results' : null
    };
  }, [activeExperiment, entries]);

  return {
    patterns: insights.patterns,
    topTrigger: insights.topTrigger,
    baselineRate: insights.baselineRate,
    totalMealsAnalyzed: insights.totalMealsAnalyzed,
    activeExperiment,
    experimentResults,
    startExperiment,
    stopExperiment,
    dismissPattern,
  };
}
