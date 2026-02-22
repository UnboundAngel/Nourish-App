import { useState, useCallback } from 'react';

let nextToastId = 1;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = nextToastId++;
    const newToast = {
      id,
      message,
      type,
      duration,
      timestamp: Date.now(),
    };

    setToasts(prev => [...prev, newToast].slice(-5)); // Max 5 toasts

    // Auto-dismiss after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    toasts,
    showToast,
    dismissToast,
  };
}
