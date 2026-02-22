import { useState, useEffect, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

export function useHydration({ user }) {
  const [waterOz, setWaterOz] = useState(() => {
    const storedDate = localStorage.getItem('nourish-water-date');
    const today = getTodayDateString();
    if (storedDate !== today) {
      localStorage.setItem('nourish-water-date', today);
      localStorage.setItem('nourish-water-oz', '0');
      return 0;
    }
    const localWater = localStorage.getItem('nourish-water-oz');
    return localWater ? Number(localWater) : 0;
  });
  const [customWaterInput, setCustomWaterInput] = useState('');
  const prevWaterOzRef = useRef(waterOz);

  // Sync hydration to local storage only when value actually changes
  useEffect(() => {
    if (waterOz !== prevWaterOzRef.current) {
      prevWaterOzRef.current = waterOz;
      localStorage.setItem('nourish-water-oz', waterOz.toString());
      localStorage.setItem('nourish-water-date', getTodayDateString());
    }
  }, [waterOz]);

  const handleAddWater = async (amount) => {
      // If the stored date is not today, reset before adding
      const storedDate = localStorage.getItem('nourish-water-date');
      const today = getTodayDateString();
      const base = storedDate !== today ? 0 : waterOz;
      if (storedDate !== today) {
        localStorage.setItem('nourish-water-date', today);
      }

      const newAmount = Math.max(0, base + amount);
      setWaterOz(newAmount);
      setCustomWaterInput('');
      if (user && !user.isAnonymous) {
          await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
              waterOz: newAmount
          }, { merge: true });
      }
  };

  const handleCustomWaterSubmit = (e) => {
    e.preventDefault();
    const amount = parseInt(customWaterInput);
    if (!isNaN(amount) && amount > 0) {
      handleAddWater(amount);
    }
  };

  return {
    waterOz, setWaterOz,
    customWaterInput, setCustomWaterInput,
    handleAddWater,
    handleCustomWaterSubmit,
  };
}
