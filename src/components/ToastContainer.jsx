import React from 'react';
import { Toast } from './Toast';

export const ToastContainer = ({ toasts, onDismiss, theme }) => {
  if (toasts.length === 0) return null;

  return (
    <>
      {/* Desktop: Top-right */}
      <div className="hidden sm:block fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
        <div className="pointer-events-auto space-y-2">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              {...toast}
              onDismiss={onDismiss}
              theme={theme}
            />
          ))}
        </div>
      </div>

      {/* Mobile: Bottom-center (above nav) */}
      <div className="sm:hidden fixed bottom-20 left-4 right-4 z-[9999] space-y-2 pointer-events-none">
        <div className="pointer-events-auto space-y-2">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              {...toast}
              onDismiss={onDismiss}
              theme={theme}
            />
          ))}
        </div>
      </div>
    </>
  );
};
