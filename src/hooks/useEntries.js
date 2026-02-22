import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { collection, addDoc, deleteDoc, doc, query, updateDoc, getDocs, where, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, appId, storage } from '../config/firebase';
import { saveEntries, loadEntries } from '../storage.js';
import { compressImage } from '../utils/helpers';

// Find duplicate entry IDs: same name + same calories + same createdAt (keep the first, mark rest as dupes)
function findDuplicateIds(entries) {
  const seen = new Map();
  const dupeIds = [];
  for (const entry of entries) {
    const key = `${(entry.name || '').toLowerCase().trim()}|${entry.calories || 0}|${entry.createdAt || 0}`;
    if (seen.has(key)) {
      dupeIds.push(entry.id);
    } else {
      seen.set(key, entry.id);
    }
  }
  return dupeIds;
}

// Remove duplicates from a local entries array (same name + calories + createdAt)
function deduplicateEntries(entries) {
  const seen = new Set();
  return entries.filter(entry => {
    const key = `${(entry.name || '').toLowerCase().trim()}|${entry.calories || 0}|${entry.createdAt || 0}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Helper: Strip expired blob URLs from loaded entries
function sanitizeEntries(entries) {
  return entries.map(entry => {
    // Blob URLs are session-specific and expire on reload. 
    // If we see one in storage, it's dead. Remove it to prevent 404s.
    if (entry.imageUrl && entry.imageUrl.startsWith('blob:')) {
      return { ...entry, imageUrl: null };
    }
    return entry;
  });
}

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!user || user.isAnonymous) {
      const localEntries = loadEntries();
      // Deduplicate AND sanitize (remove expired blob URLs)
      setEntries(deduplicateEntries(sanitizeEntries(localEntries)));
      return;
    }
    if (syncInProgress.current) return;
    syncInProgress.current = true;

    try {
      // Sync local entries to Firestore ONCE, then clear localStorage immediately
      const localEntries = loadEntries();
      if (localEntries.length > 0) {
        // Clear local storage FIRST to prevent re-upload on next refresh
        saveEntries([]);
        const collectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'journal_entries');
        for (const entry of localEntries) {
          const { id: _id, ...entryWithoutId } = entry;
          // If syncing a local entry with a blob URL to Firestore, we can't upload the blob anymore 
          // (it's likely expired if reload happened). If it's base64, it might be too large for Firestore 
          // but we'll try. Ideally, we should upload base64 to Storage, but for now let's just 
          // omit the image if it's a blob URL.
          if (entryWithoutId.imageUrl && entryWithoutId.imageUrl.startsWith('blob:')) {
             entryWithoutId.imageUrl = null;
          }
          await addDoc(collectionRef, entryWithoutId);
        }
      }

      // Fetch last 30 days of entries (one-time read, no persistent listener)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const q = query(
        collection(db, 'artifacts', appId, 'users', user.uid, 'journal_entries'),
        where('createdAt', '>=', thirtyDaysAgo),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      // Deduplicate: remove entries with same name + calories + createdAt (keep first)
      const dupeIds = findDuplicateIds(data);
      if (dupeIds.length > 0) {
        // Delete duplicates from Firestore in background
        for (const dupeId of dupeIds) {
          deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'journal_entries', dupeId)).catch(() => {});
        }
        data = data.filter(e => !dupeIds.includes(e.id));
      }

      setEntries(data);
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
    if (isSubmitting) return;
    setIsSubmitting(true);

    const entryData = { 
        ...formData,
        calories: Number(formData.calories) || 0,
        protein: Number(formData.protein) || 0,
        carbs: Number(formData.carbs) || 0,
        fats: Number(formData.fats) || 0,
        createdAt: editingId ? (entries.find(e => e.id === editingId)?.createdAt ?? 0) : Date.now(),
    };

    // Remove the file object before saving to Firestore/localStorage
    delete entryData.imageFile;

    if (user && !user.isAnonymous) {
      try {
        // Upload image if present
        if (formData.imageFile) {
            try {
                const compressedBlob = await compressImage(formData.imageFile);
                const filename = `meal_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
                const storageRef = ref(storage, `users/${user.uid}/meal_photos/${filename}`);
                await uploadBytes(storageRef, compressedBlob);
                const downloadURL = await getDownloadURL(storageRef);
                entryData.imageUrl = downloadURL;

                // If editing and replacing an old image, try to delete the old one
                if (editingId) {
                    const oldEntry = entries.find(e => e.id === editingId);
                    if (oldEntry?.imageUrl) {
                        try {
                            const oldRef = ref(storage, oldEntry.imageUrl);
                            await deleteObject(oldRef);
                        } catch (e) {
                            console.warn('Failed to delete old image:', e);
                        }
                    }
                }
            } catch (uploadError) {
                console.error('Image upload failed:', uploadError);
                if (showToast) showToast('Failed to upload image. Saving meal without it.', 'error');
            }
        }

        if (editingId) {
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'journal_entries', editingId), entryData);
        } else {
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'journal_entries'), entryData);
            setShowStreakCelebration(true);
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
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Device-only mode: Convert image to Base64 for localStorage
      let localImageUrl = formData.imageUrl || (editingId ? entries.find(e => e.id === editingId)?.imageUrl : null);

      if (formData.imageFile) {
          try {
              // Compress aggressively (800px, 0.6 quality) to save localStorage space
              const compressedBlob = await compressImage(formData.imageFile, 800, 0.6);
              
              // Convert Blob to Base64 Data URL
              localImageUrl = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result);
                  reader.onerror = reject;
                  reader.readAsDataURL(compressedBlob);
              });
          } catch (e) {
              console.error("Failed to process local image", e);
              if (showToast) showToast('Failed to save image locally', 'error');
          }
      }
      
      const newEntry = {
        ...entryData,
        id: editingId || `local_${Date.now()}`,
        imageUrl: localImageUrl
      };
      
      if (!editingId) {
          setShowStreakCelebration(true);
      }

      const updatedEntries = editingId 
        ? entries.map(entry => entry.id === editingId ? newEntry : entry)
        : [...entries, newEntry];

      setEntries(updatedEntries);
      const saved = saveEntries(updatedEntries);
      if (!saved && showToast) {
        showToast('Storage full! Image could not be saved locally.', 'warning');
      } else if (showToast) {
        showToast(editingId ? 'Meal updated! 🌱' : 'Meal logged! 🌱', 'success');
      }
      setIsSubmitting(false);
    }
    
    setIsModalOpen(false);
    setEditingId(null);
  }, [user, editingId, entries, fetchEntries, isSubmitting]);

  const handleDelete = useCallback(async (e, id) => {
    e.stopPropagation();
    
    const updatedEntries = entries.filter(entry => entry.id !== id);
    setEntries(updatedEntries);
    saveEntries(updatedEntries);

    if (user && !user.isAnonymous) {
      try {
        // Try to delete associated image if exists
        const entryToDelete = entries.find(e => e.id === id);
        if (entryToDelete?.imageUrl) {
            try {
                const imageRef = ref(storage, entryToDelete.imageUrl);
                await deleteObject(imageRef);
            } catch (imgError) {
                console.warn('Failed to delete image from storage:', imgError);
            }
        }

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
    isSubmitting,
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
