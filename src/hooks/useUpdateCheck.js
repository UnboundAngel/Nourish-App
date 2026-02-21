import { useState, useEffect, useCallback } from 'react';

export function useUpdateCheck(intervalMs = 60000) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [initialHash, setInitialHash] = useState(null);

  const getPageHash = useCallback(async () => {
    try {
      const res = await fetch('/', { cache: 'no-store' });
      const text = await res.text();
      // Extract the script src hash from index.html — changes every build
      const match = text.match(/assets\/index-([^.]+)\.js/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    // Capture the current build hash on mount
    getPageHash().then(hash => {
      if (hash) setInitialHash(hash);
    });
  }, [getPageHash]);

  useEffect(() => {
    if (!initialHash) return;

    const check = async () => {
      const currentHash = await getPageHash();
      if (currentHash && currentHash !== initialHash) {
        setUpdateAvailable(true);
      }
    };

    const timer = setInterval(check, intervalMs);
    return () => clearInterval(timer);
  }, [initialHash, intervalMs, getPageHash]);

  const refresh = () => window.location.reload();

  return { updateAvailable, refresh };
}
