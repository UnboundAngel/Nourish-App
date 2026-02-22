import { useState, useEffect, useCallback, useMemo } from 'react';

const PANTRY_KEY = 'nourish-pantry';
const FOOD_HISTORY_KEY = 'nourish-food-history';

/**
 * Manages food memory: pantry (user-saved favorites) and food history (auto-learned from entries).
 * Food history tracks name, macros, type, and frequency for quick-fill and common meal suggestions.
 */
export function useFoodMemory({ entries }) {
  // Pantry: user-curated list of favorite foods
  const [pantry, setPantry] = useState(() => {
    try {
      const stored = localStorage.getItem(PANTRY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  // Food history: auto-built from entries (name -> averaged macros + frequency by type)
  const foodHistory = useMemo(() => {
    const map = {};
    for (const entry of entries) {
      const name = (entry.name || '').trim().toLowerCase();
      if (!name) continue;
      if (!map[name]) {
        map[name] = {
          name: entry.name.trim(),
          calories: 0, protein: 0, carbs: 0, fats: 0,
          count: 0,
          types: {},
          lastUsed: 0,
        };
      }
      const item = map[name];
      item.calories += Number(entry.calories) || 0;
      item.protein += Number(entry.protein) || 0;
      item.carbs += Number(entry.carbs) || 0;
      item.fats += Number(entry.fats) || 0;
      item.count += 1;
      const type = entry.type || 'Snack';
      item.types[type] = (item.types[type] || 0) + 1;
      const ts = entry.createdAt || 0;
      if (ts > item.lastUsed) item.lastUsed = ts;
    }
    // Average the macros
    return Object.values(map).map(item => ({
      name: item.name,
      calories: Math.round(item.calories / item.count),
      protein: Math.round(item.protein / item.count),
      carbs: Math.round(item.carbs / item.count),
      fats: Math.round(item.fats / item.count),
      count: item.count,
      types: item.types,
      lastUsed: item.lastUsed,
    }));
  }, [entries]);

  // Sync pantry to localStorage
  useEffect(() => {
    localStorage.setItem(PANTRY_KEY, JSON.stringify(pantry));
  }, [pantry]);

  // Add to pantry
  const addToPantry = useCallback((food) => {
    setPantry(prev => {
      const exists = prev.some(f => f.name.toLowerCase() === food.name.toLowerCase());
      if (exists) return prev;
      return [...prev, {
        name: food.name,
        calories: Number(food.calories) || 0,
        protein: Number(food.protein) || 0,
        carbs: Number(food.carbs) || 0,
        fats: Number(food.fats) || 0,
      }];
    });
  }, []);

  // Remove from pantry
  const removeFromPantry = useCallback((foodName) => {
    setPantry(prev => prev.filter(f => f.name.toLowerCase() !== foodName.toLowerCase()));
  }, []);

  // Check if food is in pantry
  const isInPantry = useCallback((foodName) => {
    return pantry.some(f => f.name.toLowerCase() === (foodName || '').toLowerCase());
  }, [pantry]);

  // Search food history + pantry by name prefix (for quick-fill autocomplete)
  const searchFoods = useCallback((query) => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const results = new Map();

    // Pantry items first (higher priority)
    for (const item of pantry) {
      if (item.name.toLowerCase().includes(q)) {
        results.set(item.name.toLowerCase(), { ...item, source: 'pantry' });
      }
    }

    // Then history items
    for (const item of foodHistory) {
      const key = item.name.toLowerCase();
      if (key.includes(q) && !results.has(key)) {
        results.set(key, { ...item, source: 'history' });
      }
    }

    // Sort: pantry first, then by frequency
    return Array.from(results.values())
      .sort((a, b) => {
        if (a.source === 'pantry' && b.source !== 'pantry') return -1;
        if (b.source === 'pantry' && a.source !== 'pantry') return 1;
        return b.count - a.count;
      })
      .slice(0, 8);
  }, [pantry, foodHistory]);

  // Get common meals for a given meal type, sorted by frequency
  const getCommonMeals = useCallback((mealType) => {
    return foodHistory
      .filter(item => item.types[mealType] && item.types[mealType] > 0)
      .sort((a, b) => (b.types[mealType] || 0) - (a.types[mealType] || 0))
      .slice(0, 6);
  }, [foodHistory]);

  // Get the most recent meal for a given type
  const getLastMeal = useCallback((mealType) => {
    // Search entries backwards
    for (let i = entries.length - 1; i >= 0; i--) {
      if ((entries[i].type || 'Snack') === mealType) {
        const entry = entries[i];
        return {
          name: entry.name,
          calories: entry.calories,
          protein: entry.protein,
          carbs: entry.carbs,
          fats: entry.fats,
          type: entry.type,
          tags: entry.tags,
          note: entry.note
        };
      }
    }
    return null;
  }, [entries]);

  return {
    pantry,
    foodHistory,
    addToPantry,
    removeFromPantry,
    isInPantry,
    searchFoods,
    getCommonMeals,
    getLastMeal,
  };
}
