const LOCAL_STORAGE_KEY = 'nourish-app-entries';

/**
 * Saves the user's journal entries to localStorage.
 * @param {Array} entries The array of journal entries to save.
 */
export function saveEntries(entries) {
  try {
    const serializedEntries = JSON.stringify(entries);
    localStorage.setItem(LOCAL_STORAGE_KEY, serializedEntries);
  } catch (error) {
    console.error("Error saving entries to localStorage:", error);
  }
}

/**
 * Loads the user's journal entries from localStorage.
 * @returns {Array} The array of journal entries, or an empty array if none are found.
 */
export function loadEntries() {
  try {
    const serializedEntries = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (serializedEntries === null) {
      return [];
    }
    return JSON.parse(serializedEntries);
  } catch (error) {
    console.error("Error loading entries from localStorage:", error);
    return [];
  }
}
