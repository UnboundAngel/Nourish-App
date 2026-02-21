import { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

export function useHydration({ user }) {
  const [waterOz, setWaterOz] = useState(() => {
    const localWater = localStorage.getItem('nourish-water-oz');
    return localWater ? Number(localWater) : 0;
  });
  const [customWaterInput, setCustomWaterInput] = useState('');

  // Sync hydration to local storage
  useEffect(() => {
    localStorage.setItem('nourish-water-oz', waterOz.toString());
  }, [waterOz]);

  const handleAddWater = async (amount) => {
      const newAmount = waterOz + amount;
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
