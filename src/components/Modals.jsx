import React, { useState, useEffect, useMemo } from 'react';
import { X, Leaf, ChevronLeft, Flame } from 'lucide-react';

// Reusable Modal Component
export const Modal = ({ isOpen, onClose, title, children, theme }) => {
  // Use a transition class for the modal content itself
  const modalClass = `${theme.card} rounded-3xl shadow-2xl transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200 border ${theme.border} max-h-[90vh] flex flex-col ${theme.textMain} theme-transition`;
  
  // Conditionally apply class to body to prevent background scrolling/interaction
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = 'auto';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Darker backdrop to fully block background visibility/interaction */}
      <div className="absolute inset-0 bg-black/80 transition-opacity" onClick={onClose} />
      
      <div className={`relative w-full max-w-md ${modalClass}`}>
        <div className={`flex justify-between items-center p-5 border-b ${theme.border} z-10 rounded-t-3xl theme-transition`}>
          <h2 className="text-xl font-bold flex items-center gap-2">{title}</h2>
          <button onClick={onClose} className={`p-2 hover:bg-black/10 rounded-full transition-colors ${theme.textMain.replace('text-', 'text-')}`}><X size={20} /></button>
        </div>
        {/* Added custom-scrollbar class for modal content scrolling */}
        <div className="p-5 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

// Full-Screen Welcome Component
export const WelcomeScreen = ({ onSave, theme, defaultName, defaultEmail }) => {
    const [name, setName] = useState(defaultName || '');
    const [email, setEmail] = useState(defaultEmail || '');
    const [step, setStep] = useState(1);
    
    // Prevent background scrolling/interaction when welcome screen is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
        return () => {
          document.body.style.overflow = 'unset';
          document.body.style.touchAction = 'auto';
        };
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (step === 1 && name.trim()) {
            setStep(2);
        } else if (step === 2) {
            // Auto capitalize the name before saving
            const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            onSave(capitalizedName, email);
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 ${theme.bg} animate-in fade-in duration-500 theme-transition`}>
            <div className={`relative w-full max-w-lg ${theme.card} rounded-3xl shadow-2xl p-8 md:p-12 ${theme.textMain} theme-transition`}>
                
                <div className='flex items-center justify-center mb-8'>
                    <Leaf size={48} className={theme.primaryText.replace('text-', 'text-')} />
                </div>
                <h2 className={`text-4xl font-black ${theme.primaryText} mb-6 text-center transition-opacity duration-500 delay-200 theme-transition`}>
                    Welcome to Nourish
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                    {step === 1 && (
                        <div className="text-center transition-all duration-300 ease-in-out">
                            <h3 className="text-2xl font-bold mb-3 theme-transition">Hi there! What's your name?</h3>
                            <p className="text-sm opacity-70 mb-6 theme-transition">We'll use this for a personalized greeting and features.</p>
                            <input 
                                type="text" 
                                placeholder="Enter your name (e.g., Susie)" 
                                className={`w-full p-5 ${theme.inputBg} rounded-2xl font-bold outline-none text-center text-xl ${theme.textMain} theme-transition`} 
                                value={name} 
                                onChange={e => setName(e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))} 
                                required
                            />
                            <button type="submit" className={`w-full py-4 rounded-xl ${theme.secondary} text-white font-bold text-lg mt-6 shadow-md hover:brightness-110 transition-all theme-transition`} disabled={!name.trim()}>Next</button>
                        </div>
                    )}
                    
                    {step === 2 && (
                         <div className="text-center transition-all duration-300 ease-in-out">
                            <h3 className="text-2xl font-bold mb-3 theme-transition">One last step...</h3>
                            <p className="text-sm opacity-70 mb-6 theme-transition">Optional: Add your email to receive weekly progress summaries.</p>
                            <input 
                                type="email" 
                                placeholder="you@example.com (Optional)" 
                                className={`w-full p-5 ${theme.inputBg} rounded-2xl font-bold outline-none text-center text-xl ${theme.textMain} theme-transition`} 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                            />
                            <button type="submit" className={`w-full py-4 rounded-xl ${theme.primary} text-white font-bold text-lg mt-6 shadow-md hover:brightness-110 transition-all theme-transition`}>Start Journaling!</button>
                             <button type="button" onClick={() => setStep(1)} className={`mt-4 w-full text-sm font-medium opacity-70 ${theme.textMain.replace('text-', 'text-')} hover:opacity-100 theme-transition`}>
                                <ChevronLeft size={14} className='inline-block mr-1'/> Back
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

// Streak Celebration Modal
export const StreakCelebration = ({ currentStreak, onClose, theme, userName }) => {
    // Determine the congratulatory message based on the streak level
    const message = useMemo(() => {
        if (currentStreak === 1) return "First log completed! Keep this streak growing!";
        if (currentStreak % 7 === 0) return `Wow, ${userName}! You've hit ${currentStreak} days—that's a week+!`;
        return `Streak boosted to ${currentStreak} days! Keep tracking those patterns.`;
    }, [currentStreak, userName]);

    useEffect(() => {
        const timer = setTimeout(onClose, 4000); // Auto-close after 4 seconds
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className={`relative ${theme.primary} text-white p-6 rounded-3xl shadow-2xl streak-animate transform origin-center flex items-start gap-4 transition-all pointer-events-auto`}>
                <div className='p-3 bg-white/20 rounded-full'>
                    <Flame size={28} className='text-orange-400 transform rotate-45'/>
                </div>
                <div className='space-y-1'>
                    <h3 className='text-3xl font-black leading-none'>{currentStreak} DAYS!</h3>
                    <p className='text-sm font-medium'>{message}</p>
                </div>
            </div>
        </div>
    );
};
