import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const TOAST_ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TOAST_COLORS = {
  success: 'bg-emerald-500',
  error: 'bg-rose-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
};

export const Toast = ({ id, message, type, duration, onDismiss, theme }) => {
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);

  const Icon = TOAST_ICONS[type] || Info;
  const colorClass = TOAST_COLORS[type] || TOAST_COLORS.info;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(id), 200);
  };

  return (
    <div 
      className={`relative ${theme.card} rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-200 ${
        isExiting ? 'opacity-0 translate-x-8 scale-95' : 'opacity-100 translate-x-0 scale-100'
      } animate-in slide-in-from-right-8 fade-in duration-200`}
      style={{ minWidth: '320px', maxWidth: '420px' }}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-black/5">
        <div 
          className={`h-full ${colorClass} transition-all duration-50 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-start gap-3 p-4 pt-5">
        {/* Icon */}
        <div className={`flex-shrink-0 ${colorClass} rounded-xl p-2 text-white`}>
          <Icon size={20} />
        </div>

        {/* Message */}
        <p className={`flex-1 text-sm font-bold ${theme.textMain} leading-relaxed pt-0.5`}>
          {message}
        </p>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className={`flex-shrink-0 ${theme.textMain} opacity-40 hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-black/5`}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
