import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { collection, addDoc, deleteDoc, doc, query, updateDoc, setDoc, getDoc, getDocs, where, orderBy } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { saveEntries, loadEntries } from '../storage.js';

export function useEntries({ user }) {
  const [entries, setEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTags, setActiveTags] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [editingId, setEditingId] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '', calories: 0, protein: 0, carbs: 0, fats: 0, type: 'Breakfast',
    time: '', finished: true, feeling: 'good', note: '', tags: ''
  });
  const syncInProgress = useRef(false);

  const fetchEntries = useCallback(async () => {
    if (!user || user.isAnonymous) {
      const localEntries = loadEntries();
      setEntries(localEntries);
      return;
    }
    if (syncInProgress.current) return;
    syncInProgress.current = true;

    try {
      // Sync local entries to Firestore (handles both local_ prefixed and any entries saved while offline/local-only)
      const localEntries = loadEntries();
      if (localEntries.length > 0) {
        const collectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'journal_entries');
        for (const entry of localEntries) {
          const { id: _id, ...entryWithoutId } = entry;
          await addDoc(collectionRef, entryWithoutId);
        }
        saveEntries([]);
      }

      // Fetch last 30 days of entries (one-time read, no persistent listener)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const q = query(
        collection(db, 'artifacts', appId, 'users', user.uid, 'journal_entries'),
        where('createdAt', '>=', thirtyDaysAgo),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setEntries(data);
      saveEntries(data);
    } catch (error) {
      console.error('Error fetching entries:', error);
      // Fallback to localStorage
      const localEntries = loadEntries();
      if (localEntries.length > 0) setEntries(localEntries);
    } finally {
      syncInProgress.current = false;
    }
  }, [user]);

  // --- Data Sync ---
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // --- Computed ---
  const getEntriesForDate = useCallback((date, currentSearchTerm, currentSortBy, currentActiveTags) => {
      let result = entries.filter(e => {
          const dateOnly = new Date(new Date(e.createdAt).setHours(0,0,0,0)).getTime();
          const viewDateOnly = new Date(new Date(date).setHours(0,0,0,0)).getTime();
          return dateOnly === viewDateOnly;
      });

      if (currentSearchTerm) {
        const q = currentSearchTerm.toLowerCase();
        result = result.filter(e => 
          (e.name && e.name.toLowerCase().includes(q)) ||
          (e.note && e.note.toLowerCase().includes(q)) ||
          (e.tags && e.tags.toLowerCase().includes(q)) ||
          (e.type && e.type.toLowerCase().includes(q))
        );
      }

      if (currentActiveTags && currentActiveTags.length > 0) {
        result = result.filter(e => {
            if (!e.tags) return false;
            const entryTags = e.tags.split(',').map(t => t.trim());
            return currentActiveTags.every(activeTag => entryTags.includes(activeTag));
        });
      }

      switch (currentSortBy) {
        case 'oldest':
            result.sort((a, b) => a.createdAt - b.createdAt);
            break;
        case 'calories_asc':
            result.sort((a, b) => a.calories - b.calories);
            break;
        case 'calories_desc':
            result.sort((a, b) => b.calories - a.calories);
            break;
        case 'newest':
        default:
            result.sort((a, b) => b.createdAt - a.createdAt);
            break;
      }

      return result;
  }, [entries]);

  const todaysEntries = useMemo(() => {
    const entriesForDate = getEntriesForDate(new Date(), searchTerm, sortBy, activeTags);
    const uniqueMap = new Map();
    entriesForDate.forEach(e => {
        if (!uniqueMap.has(e.id)) uniqueMap.set(e.id, e);
    });
    return Array.from(uniqueMap.values());
  }, [searchTerm, sortBy, activeTags, getEntriesForDate]);

  const todaysTotals = useMemo(() => todaysEntries.reduce((acc, curr) => ({
      calories: acc.calories + (curr.calories || 0),
      protein: acc.protein + (curr.protein || 0),
      carbs: acc.carbs + (curr.carbs || 0),
      fats: acc.fats + (curr.fats || 0),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 }), [todaysEntries]);

  const allTags = useMemo(() => {
    const tags = new Set();
    entries.forEach(entry => {
      if (entry.tags) {
        entry.tags.split(',').forEach(tag => {
          const trimmedTag = tag.trim();
          if (trimmedTag) {
            tags.add(trimmedTag);
          }
        });
      }
    });
    return Array.from(tags);
  }, [entries]);

  // --- Handlers ---
  const openNewEntryModal = (setIsModalOpen) => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      setEditingId(null);
      setNewItem({ 
          name: '', calories: 0, protein: 0, carbs: 0, fats: 0, type: 'Breakfast',
          time: timeString,
          finished: true, 
          feeling: 'good', 
          note: '',
          tags: ''
      });
      setIsModalOpen(true);
  };

  const handleSaveEntry = useCallback(async (formData, { dailyStreak, setDailyStreak, setShowStreakCelebration, setIsModalOpen, showToast }) => {
    if (!formData.name) return;

    const entryData = { 
        ...formData,
        calories: Number(formData.calories) || 0,
        protein: Number(formData.protein) || 0,
        carbs: Number(formData.carbs) || 0,
        fats: Number(formData.fats) || 0,
        createdAt: editingId ? entries.find(e => e.id === editingId)?.createdAt : Date.now(),
    };

    if (user && !user.isAnonymous) {
      try {
        if (editingId) {
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'journal_entries', editingId), entryData);
        } else {
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'journal_entries'), entryData);
            
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
            const docSnap = await getDoc(docRef);
            const data = docSnap.exists() ? docSnap.data() : {};
            
            if (data.lastMealDate !== todayStr) {
                let newStreak = 1;
                if (data.lastMealDate === yesterdayStr) {
                    newStreak = (data.dailyStreak || 0) + 1;
                }
                await setDoc(docRef, { lastMealDate: todayStr, dailyStreak: newStreak }, { merge: true });
                setDailyStreak(newStreak);
                setShowStreakCelebration(true);
            }
        }
        // Re-fetch to sync local state with Firestore
        fetchEntries();
        if (showToast) {
          showToast(editingId ? 'Meal updated! 🌱' : 'Meal logged! 🌱', 'success');
        }
      } catch (error) { 
        console.error(error);
        if (showToast) {
          showToast('Failed to save meal. Changes saved locally.', 'error');
        }
      }
    } else {
      const newEntry = {
        ...entryData,
        id: editingId || `local_${Date.now()}`,
      };
      
      if (!editingId) {
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          const lastMealDate = localStorage.getItem('nourish-last-meal-date');
          if (lastMealDate !== todayStr) {
              let newStreak = 1;
              if (lastMealDate === yesterdayStr) {
                  newStreak = dailyStreak + 1;
              }
              setDailyStreak(newStreak);
              setShowStreakCelebration(true);
              localStorage.setItem('nourish-last-meal-date', todayStr);
          }
      }

      const updatedEntries = editingId 
        ? entries.map(entry => entry.id === editingId ? newEntry : entry)
        : [...entries, newEntry];

      setEntries(updatedEntries);
      saveEntries(updatedEntries);
      if (showToast) {
        showToast(editingId ? 'Meal updated! 🌱' : 'Meal logged! 🌱', 'success');
      }
    }
    
    setIsModalOpen(false);
    setEditingId(null);
  }, [user, editingId, entries, fetchEntries]);

  const handleDelete = useCallback(async (e, id) => {
    e.stopPropagation();
    
    const updatedEntries = entries.filter(entry => entry.id !== id);
    setEntries(updatedEntries);
    saveEntries(updatedEntries);

    if (user && !user.isAnonymous) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'journal_entries', id));
      } catch (error) {
        console.error("Error deleting document: ", error);
      }
    }
  }, [user, entries]);

  const handleToggleFinish = useCallback(async (e, entry) => {
    e.stopPropagation();
    
    const updatedFinishedState = !entry.finished;

    // Optimistically update local state
    const updatedEntries = entries.map(e => 
      e.id === entry.id ? { ...e, finished: updatedFinishedState } : e
    );
    setEntries(updatedEntries);
    saveEntries(updatedEntries);

    if (user && !user.isAnonymous) {
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'journal_entries', entry.id), {
          finished: updatedFinishedState
        });
      } catch (error) {
        console.error("Error updating finish state in Firestore:", error);
      }
    }
  }, [user, entries]);

  return {
    entries,
    searchTerm, setSearchTerm,
    activeTags, setActiveTags,
    sortBy, setSortBy,
    editingId, setEditingId,
    newItem, setNewItem,
    getEntriesForDate,
    todaysEntries,
    todaysTotals,
    allTags,
    openNewEntryModal,
    handleSaveEntry,
    handleDelete,
    handleToggleFinish,
  };
}
