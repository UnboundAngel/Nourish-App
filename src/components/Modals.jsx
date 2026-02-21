import React, { useState, useEffect, useMemo } from 'react';
import { X, Leaf, ChevronLeft, ChevronUp, ChevronDown, Flame, ShieldCheck, Mail, ArrowRight, Cloud, Smartphone, Palette, Target, Check, Eye, EyeOff, Apple, Coffee, Droplet, LogIn, UserPlus } from 'lucide-react';

// Reusable Modal Component
export const Modal = ({ isOpen, onClose, title, children, theme, maxWidth = 'max-w-md' }) => {
  const modalClass = `${theme.card} rounded-[3rem] shadow-2xl transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col ${theme.textMain} theme-transition overflow-hidden`;
  const [scrollInfo, setScrollInfo] = useState({ top: false, bottom: false });
  const scrollRef = React.useRef(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setScrollInfo({
      top: scrollTop > 10,
      bottom: scrollTop + clientHeight < scrollHeight - 10
    });
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      // Initial check after mount
      setTimeout(handleScroll, 100);
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
      <div className="absolute inset-0 bg-black/80 transition-opacity backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} ${modalClass}`}>
        
        {/* Header with Texture */}
        <div className={`relative flex justify-between items-center p-6 shadow-sm z-30 rounded-t-[3rem] theme-transition overflow-hidden`}>
          {/* Noise Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
          <div className={`absolute inset-0 bg-white/5 backdrop-blur-xl`}></div>
          
          <div className="w-10 relative z-10"></div> 
          <h2 className="text-sm relative z-10 font-black flex items-center gap-2 uppercase tracking-[0.4em] opacity-60 text-center flex-1 justify-center">{title}</h2>
          <button onClick={onClose} className={`relative z-10 p-2 hover:bg-black/10 rounded-xl transition-all ${theme.textMain} opacity-40 hover:opacity-100`}><X size={20} /></button>
        </div>
        
        <div className="relative flex-1 overflow-hidden flex flex-col shadow-inner">
            {/* Minimalist Scroll Indicators */}
            <div className={`absolute top-2 left-1/2 -translate-x-1/2 z-40 transition-all duration-700 pointer-events-none ${scrollInfo.top ? 'opacity-30 scale-100' : 'opacity-0 scale-50'}`}>
                <ChevronUp size={20} className={theme.textMain} />
            </div>
            
            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="p-6 overflow-y-auto no-scrollbar flex-1 relative z-10"
            >
                {children}
            </div>

            <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-700 pointer-events-none ${scrollInfo.bottom ? 'opacity-30 scale-100 animate-bounce' : 'opacity-0 scale-50'}`}>
                <ChevronDown size={20} className={theme.textMain} />
            </div>
        </div>
      </div>
    </div>
  );
};

// Full-Screen Welcome Component (Gooey Slime & Fixed Auth)
export const WelcomeScreen = ({ onSave, theme, onAuth, onGoogle, currentThemeId, onThemeChange, dailyTargets, onTargetsChange, allThemes }) => {
    const [step, setStep] = useState(0); 
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isEmailForm, setIsEmailForm] = useState(false);
    const [authMode, setAuthMode] = useState('signup'); // 'signup' or 'login'
    
    const [showIdleHint, setShowIdleHint] = useState(false);
    const [isIntroExiting, setIsIntroExiting] = useState(false);
    const [shapeIndex, setShapeIndex] = useState(0);
    const [liquidFill, setLiquidFill] = useState(0);
    
    const shapes = [
        { label: "Hydration", color: "#3b82f6", path: "M64.8,58.2 C64.8,74.1 55.8,80.6 44.6,80.6 S24.4,74.1 24.4,58.2 S44.6,16.6 44.6,16.6 S64.8,42.3 64.8,58.2 z" },
        { label: "Vitamins", color: "#ef4444", path: "M45.6,35.5 C45.7,36.2 45.7,36.8 45.8,37.5 C53.3,38.4 60.2,36.2 65.5,31.9 C66.5,31.8 67.5,31.8 68.4,31.8 C72.7,32.1 77.1,34.3 79.5,38.7 C81.4,42.0 82.5,45.6 82.5,50.0 C82.5,58.7 78.5,67.7 72.7,76.3 C68.3,82.8 59.6,85.1 51.5,82.2 L50.5,81.9 C49.6,81.6 48.7,81.6 47.7,81.9 L46.8,82.2 C38.7,85.1 30.0,82.8 25.6,76.3 C19.8,67.7 15.8,58.7 15.8,50.0 C15.8,45.7 16.8,42.2 18.6,39.0 C21.0,34.6 25.3,32.3 30.6,32.0 C35.3,31.7 40.4,33.0 44.8,35.5 Z M54.2,14.9 L54.2,12.5 C54.2,10.2 52.3,8.3 50.0,8.3 C47.7,8.3 45.8,10.2 45.8,12.5 L45.8,26.3 C41.0,24.3 35.8,23.3 30.9,23.6 C23.4,24.1 16.1,27.5 12.1,35.0 C9.7,39.4 8.3,44.3 8.3,50.0 C8.3,61.1 13.3,71.8 19.5,81.0 C26.4,91.1 39.2,93.9 50.0,90.2 C60.8,93.9 73.6,91.1 80.5,81.0 C86.7,71.8 91.7,61.1 91.7,50.0 C91.7,44.1 90.2,39.0 87.7,34.6 C84.1,28.3 78.3,25.0 72.1,23.9 C74.6,19.3 75.7,14.0 75.0,8.3 C67.0,7.3 59.5,10.0 54.2,14.9 Z" },
        { label: "Proteins", color: "#b45309", path: "M85.5,78.9 c-4.8,-5.3 -7.2,-11.8 -11.7,-17.0 a31.0,31.0 0 0 0 -1.6,-1.7 c2.1,-2.5 3.0,-5.5 5.6,-7.7 c3.1,-2.7 8.8,-4.0 11.5,-6.6 c2.5,-2.5 2.2,-6.3 4.4,-8.8 c0.8,-0.9 1.9,-1.7 3.1,-2.4 a13.2,13.2 0 0 1 -2.5,-2.0 a11.9,13.2 0 0 1 -0.7,-0.8 c-1.0,-1.3 -1.9,-2.2 -2.8,-3.0 c-1.8,-1.6 -3.5,-2.1 -5.1,-2.5 c-1.3,-0.3 -2.5,-0.6 -3.5,-1.6 c-0.4,-0.5 -0.8,-1.2 -1.1,-2.1 a21.2,21.2 0 0 0 -0.4,-1.2 c-0.7,-2.2 -1.7,-3.7 -2.6,-4.6 c-1.5,0.9 -3.1,1.7 -4.5,3.1 c-2.7,2.5 -4.4,6.8 -7.5,9.5 c-3.2,2.7 -7.9,3.8 -11.5,6.6 c-0.4,0.3 -0.8,0.7 -1.2,1.0 c-0.6,-1.2 -1.3,-2.5 -2.2,-3.6 c-3.1,-4.4 -8.0,-7.2 -10.7,-11.4 c-2.5,-4.0 -3.0,-9.6 -5.2,-13.4 c-3.0,-5.2 -4.5,-6.7 -5.9,-8.2 c-1.2,0.8 -2.9,2.1 -4.5,4.5 c-0.2,0.3 -0.6,0.8 -0.9,1.3 c-0.6,1.0 -1.3,1.6 -2.0,2.1 c-1.4,0.8 -2.8,0.8 -4.4,0.8 h-0.1 c-1.9,0 -4.0,0 -6.6,1.3 c-1.2,0.5 -2.6,1.4 -4.2,2.6 a14.2,14.2 0 0 1 -1.1,0.7 c-1.1,0.7 -2.3,1.2 -3.5,1.5 c1.1,1.2 2.1,2.4 2.7,3.8 c1.6,3.5 0,7.8 1.9,11.6 c2.1,3.8 8.1,7.3 10.6,11.4 c2.6,3.9 2.1,8.4 4.6,12.5 c-2.6,2.3 -5.1,4.8 -8.4,6.7 c-4.1,2.4 -8.3,3.9 -12.4,5.5 c0.5,1.0 1.6,2.1 3.8,3.0 c1.1,0.4 4.9,1.0 5.1,1.0 c2.2,0.3 3.4,0.9 4.0,1.7 c1.2,1.4 0.9,3.4 2.5,4.9 c1.3,1.1 4.0,2.0 9.1,2.3 c3.0,0.1 5.9,0.5 7.8,1.0 c2.5,-0.9 5.0,-1.9 7.1,-3.0 c0.9,2.1 2.0,4.3 3.8,6.5 c2.2,2.5 5.4,4.9 8.6,7.4 c2.2,0 5.0,0.2 8.6,1.0 c0.3,0.1 0.6,0.1 0.9,0.2 c2.7,0.6 4.9,0.8 6.6,0.8 c1.8,0 3.1,-0.2 4.1,-0.7 c2.3,-1.3 2.7,-3.7 4.5,-4.9 c0.7,-0.5 1.8,-0.8 3.3,-0.8 a14.0,14.0 0 0 1 2.0,0.1 l-0.0,-0.0 c1.7,0.3 3.5,0.4 4.9,0.4 c0.3,0 0.7,-0.0 1.0,-0.0 c2.7,-0.2 4.4,-1.2 5.3,-2.2 c-4.0,-3.1 -8.2,-6.2 -11.3,-9.6 Z" }
    ];

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
        
        if (step === 0) {
            const cycleDuration = 4000;
            const idleTimer = setTimeout(() => setShowIdleHint(true), 5000);
            
            const startTime = Date.now();
            const updateFrame = () => {
                const elapsed = Date.now() - startTime;
                const totalProgress = (elapsed / cycleDuration);
                const currentShapeProgress = totalProgress % 1;
                
                setLiquidFill(currentShapeProgress * 100);
                
                const newIndex = Math.floor(totalProgress) % shapes.length;
                setShapeIndex(newIndex);
                
                if (step === 0) requestAnimationFrame(updateFrame);
            };
            
            const animationRef = requestAnimationFrame(updateFrame);

            return () => {
                clearTimeout(idleTimer);
                cancelAnimationFrame(animationRef);
            };
        }

        return () => {
          document.body.style.overflow = 'unset';
          document.body.style.touchAction = 'auto';
        };
    }, [step, shapes.length]);

    const handleIntroClick = () => {
        setIsIntroExiting(true);
        setTimeout(() => setStep(1), 800);
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleSkipSync = () => {
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        localStorage.setItem('nourish-user-name', capitalizedName);
        onSave(capitalizedName, ''); 
    };

    const handleAuthAction = async (e) => {
        e.preventDefault();
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        const success = await onAuth(e, email, password, authMode, capitalizedName, true);
        if (success) setStep(3);
    };

    const handleGoogleSignUp = async () => {
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        const success = await onGoogle(capitalizedName, true);
        if (success) setStep(3);
    };

    return (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 md:p-8 ${theme.bg} overflow-hidden transition-colors duration-1000`}>
            
            {/* SVG Gooey Filter Definition */}
            <svg className="hidden">
                <defs>
                    <filter id="goo">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                    </filter>
                </defs>
            </svg>

            {/* Step 0: Atmospheric Gooey Slime Hero */}
            {step === 0 && (
                <div className={`relative z-10 flex flex-col items-center justify-center h-full w-full transition-all duration-1000 ${isIntroExiting ? 'opacity-0 scale-110 blur-xl' : 'opacity-100'}`}>
                    
                    <div className="relative flex items-center justify-center w-full max-w-sm h-80">
                        <button
                            onClick={handleIntroClick}
                            className="relative group outline-none cursor-pointer flex items-center justify-center w-64 h-64 md:w-80 md:h-80 gooey-container"
                        >
                            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
                                <defs>
                                    <clipPath id="slimeMask">
                                        <path 
                                            d={shapes[shapeIndex].path} 
                                            className="transition-all duration-[2000ms] ease-in-out"
                                        />
                                    </clipPath>
                                </defs>

                                {/* The Liquid Slime Body */}
                                <g clipPath="url(#slimeMask)">
                                    {/* Base Slime Layer */}
                                    <path 
                                        d={shapes[shapeIndex].path} 
                                        fill={shapes[shapeIndex].color}
                                        className="transition-all duration-[2000ms] ease-in-out opacity-20"
                                    />
                                    {/* Filling Progress Layer */}
                                    <rect 
                                        x="-50" 
                                        y={100 - liquidFill} 
                                        width="200" 
                                        height="150" 
                                        fill={shapes[shapeIndex].color}
                                        className="opacity-80 transition-colors duration-1000"
                                    />
                                    {/* Top White Surface Tension */}
                                    <rect 
                                        x="-50" 
                                        y={98 - liquidFill} 
                                        width="200" 
                                        height="4" 
                                        fill="white"
                                        className="opacity-40"
                                    />
                                </g>

                                {/* The Glass Outline */}
                                <path 
                                    d={shapes[shapeIndex].path} 
                                    fill="none" 
                                    stroke="white" 
                                    strokeWidth="1"
                                    className="transition-all duration-[2000ms] ease-in-out opacity-40"
                                />
                            </svg>
                        </button>

                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-full text-center">
                            <span key={shapeIndex} className="text-xs font-black tracking-[1em] uppercase opacity-30 animate-in slide-in-from-bottom-2 duration-1000" style={{ color: shapes[shapeIndex].color }}>
                                {shapes[shapeIndex].label}
                            </span>
                        </div>
                    </div>

                    <div className="mt-16 text-center">
                        <h1 className={`text-6xl md:text-8xl font-black ${theme.primaryText} tracking-[0.2em] uppercase flex justify-center gap-4`}>
                            {"NOURISH".split("").map((char, i) => (
                                <span key={i} className="animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${i * 100}ms` }}>{char}</span>
                            ))}
                        </h1>
                        <p className={`mt-6 text-[10px] font-bold tracking-[1em] uppercase ${theme.textMain} opacity-20`}>
                            Mindful Nutrition
                        </p>
                    </div>

                    <div className="absolute bottom-16 w-full flex justify-center px-8">
                        <button 
                            onClick={handleIntroClick}
                            className={`transition-all duration-1000 ease-out transform ${showIdleHint && !isIntroExiting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} group cursor-pointer w-full max-w-xs`}
                        >
                            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-full border border-white/10 shadow-xl hover:bg-white/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3">
                                <p className={`text-[10px] font-black tracking-[0.3em] uppercase ${theme.textMain} opacity-40 group-hover:opacity-100`}>
                                    well, what're you waiting for? press me!
                                </p>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {step > 0 && (
                <div className={`relative w-full max-w-2xl ${theme.card} rounded-[3rem] shadow-2xl p-8 md:p-12 ${theme.textMain} theme-transition overflow-hidden animate-in zoom-in-95 duration-700`}>
                    
                    <div className="absolute top-0 left-0 right-0 h-1.5 flex gap-1 px-1 pt-1">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`flex-1 h-full rounded-full transition-all duration-500 ${step >= i ? theme.primary : 'bg-black/5'}`}></div>
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="text-center animate-in slide-in-from-bottom-4 duration-500">
                            <h2 className={`text-4xl font-black ${theme.primaryText} mb-4 tracking-tight`}>Welcome</h2>
                            <p className="text-lg opacity-60 mb-8 max-w-sm mx-auto">Let's start with your name so we can personalize your experience.</p>
                            <div className="space-y-6 max-w-sm mx-auto">
                                <input type="text" placeholder="Your Name..." className={`w-full p-6 ${theme.inputBg} rounded-3xl font-bold outline-none text-2xl border-2 border-transparent focus:border-current transition-all text-center ${theme.textMain} theme-transition`} value={name} onChange={e => setName(e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))} autoFocus onKeyDown={e => e.key === 'Enter' && name.trim() && handleNext()} />
                                <button onClick={handleNext} disabled={!name.trim()} className={`w-full py-5 rounded-2xl ${theme.primary} text-white font-bold text-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2`} > Continue <ArrowRight size={20} /> </button>
                                
                                <button 
                                    onClick={() => { setAuthMode('login'); setStep(2); }}
                                    className="text-sm font-bold opacity-40 hover:opacity-100 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto"
                                >
                                    Already have an account? Sign In
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="text-center animate-in slide-in-from-right-8 duration-500">
                            <h2 className={`text-3xl font-black ${theme.textMain} mb-4 tracking-tight`}>Cloud or Local?</h2>
                            <p className="text-lg opacity-60 mb-8 max-w-sm mx-auto text-balance">Choose how you'd like to save your nutrition data.</p>
                            
                            {!isEmailForm ? (
                                <div className="space-y-4 max-w-md mx-auto">
                                    <button onClick={handleGoogleSignUp} className="w-full py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all shadow-sm">
                                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" /> Continue with Google
                                    </button>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => { setAuthMode('login'); setIsEmailForm(true); }} className={`py-4 ${theme.inputBg} rounded-2xl font-bold flex items-center justify-center gap-3 hover:brightness-95 hover:scale-105 active:scale-95 transition-all text-sm`}>
                                            <LogIn size={18} /> Sign In
                                        </button>
                                        <button onClick={() => { if (!name.trim()) { setStep(1); } else { setAuthMode('signup'); setIsEmailForm(true); } }} className={`py-4 ${theme.inputBg} rounded-2xl font-bold flex items-center justify-center gap-3 hover:brightness-95 hover:scale-105 active:scale-95 transition-all text-sm`}>
                                            <UserPlus size={18} /> Sign Up
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-4 my-2">
                                        <div className="flex-1 h-px bg-black/5"></div>
                                        <span className="text-[10px] font-bold opacity-30 uppercase">Or stay private</span>
                                        <div className="flex-1 h-px bg-black/5"></div>
                                    </div>
                                                                    <button onClick={handleSkipSync} className={`w-full py-4 rounded-2xl border-2 border-dashed ${theme.border} font-bold opacity-60 hover:opacity-100 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2`}>
                                                                        <Smartphone size={18} /> Device Only (Skip Sync)
                                                                    </button>                                </div>
                            ) : (
                                <form onSubmit={handleAuthAction} className="space-y-4 max-w-sm mx-auto text-left animate-in fade-in duration-300">
                                    <div className={`flex gap-2 ${theme.inputBg} p-1 rounded-xl shadow-inner mb-4`}>
                                        <button type="button" onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMode === 'login' ? `${theme.primary} text-white` : `${theme.textMain} opacity-60`}`}>Sign In</button>
                                        <button type="button" onClick={() => setAuthMode('signup')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMode === 'signup' ? `${theme.primary} text-white` : `${theme.textMain} opacity-60`}`}>Create Account</button>
                                    </div>
                                    <input type="email" placeholder="Email" required className={`w-full p-4 ${theme.inputBg} rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-400 transition-all`} value={email} onChange={e => setEmail(e.target.value)} />
                                    <div className="relative">
                                        <input type={showPassword ? "text" : "password"} placeholder="Password" required minLength={6} className={`w-full p-4 pr-12 ${theme.inputBg} rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-400 transition-all`} value={password} onChange={e => setPassword(e.target.value)} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100"> {showPassword ? <EyeOff size={20} /> : <Eye size={20} />} </button>
                                    </div>
                                    <button type="submit" className={`w-full py-4 rounded-2xl ${theme.primary} text-white font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition-all`}>
                                        {authMode === 'signup' ? 'Create Account' : 'Sign In'}
                                    </button>
                                    <button type="button" onClick={() => setIsEmailForm(false)} className="w-full text-center text-xs font-bold opacity-40 py-2">Back to options</button>
                                </form>
                            )}
                            
                            <button onClick={handleBack} className="mt-8 text-sm font-bold opacity-40 hover:opacity-100 flex items-center gap-1 mx-auto">
                                <ChevronLeft size={16} /> Back
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center animate-in slide-in-from-right-8 duration-500">
                            <h2 className={`text-3xl font-black ${theme.textMain} mb-4 tracking-tight`}>Pick your vibe</h2>
                            <p className="text-lg opacity-60 mb-8">Select a theme that matches your style.</p>
                            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                                {Object.keys(allThemes).map(t => (
                                    <button key={t} onClick={() => onThemeChange(t)} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 relative ${currentThemeId === t ? `${theme.primary} text-white scale-105 shadow-xl border-transparent` : `${theme.inputBg} border-transparent hover:border-current opacity-70`}`} >
                                        <div className={`p-2 rounded-xl ${currentThemeId === t ? 'bg-white/20' : 'bg-black/5'}`}> {React.createElement(allThemes[t].icon, { size: 24 })} </div>
                                        <span className="font-bold">{t}</span>
                                        {currentThemeId === t && <Check size={16} className="absolute top-3 right-3" />}
                                    </button>
                                ))}
                            </div>
                            <button onClick={handleNext} className={`w-full py-5 rounded-2xl ${theme.primary} text-white font-bold text-xl shadow-xl mt-10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2`}> Looks Great <ArrowRight size={20} /> </button>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="text-center animate-in slide-in-from-right-8 duration-500">
                            <h2 className={`text-3xl font-black ${theme.textMain} mb-4 tracking-tight`}>Daily Goals</h2>
                            <p className="text-lg opacity-60 mb-8">Set your baseline nutritional targets.</p>
                            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-10">
                                <div className={`p-4 rounded-2xl ${theme.inputBg} text-left`}> <label className="text-[10px] font-bold uppercase opacity-40 block mb-1">Calories</label> <input type="number" className="bg-transparent w-full text-2xl font-black outline-none" value={dailyTargets.calories} onChange={e => onTargetsChange({...dailyTargets, calories: Number(e.target.value)})} /> </div>
                                <div className={`p-4 rounded-2xl ${theme.inputBg} text-left`}> <label className="text-[10px] font-bold uppercase opacity-40 block mb-1">Protein (g)</label> <input type="number" className="bg-transparent w-full text-2xl font-black outline-none text-green-600" value={dailyTargets.protein} onChange={e => onTargetsChange({...dailyTargets, protein: Number(e.target.value)})} /> </div>
                                <div className={`p-4 rounded-2xl ${theme.inputBg} text-left`}> <label className="text-[10px] font-bold uppercase opacity-40 block mb-1">Carbs (g)</label> <input type="number" className="bg-transparent w-full text-2xl font-black outline-none text-orange-600" value={dailyTargets.carbs} onChange={e => onTargetsChange({...dailyTargets, carbs: Number(e.target.value)})} /> </div>
                                <div className={`p-4 rounded-2xl ${theme.inputBg} text-left`}> <label className="text-[10px] font-bold uppercase opacity-40 block mb-1">Fats (g)</label> <input type="number" className="bg-transparent w-full text-2xl font-black outline-none text-blue-600" value={dailyTargets.fats} onChange={e => onTargetsChange({...dailyTargets, fats: Number(e.target.value)})} /> </div>
                            </div>
                            <button onClick={() => onSave(name, email)} className={`w-full py-5 rounded-2xl ${theme.primary} text-white font-bold text-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2`}> Start My Journey <ArrowRight size={20} /> </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Streak Celebration Modal — plant growing animation
export const StreakCelebration = ({ currentStreak, onClose, theme, userName }) => {
    const [phase, setPhase] = useState(0); // 0=seed drop, 1=sprout, 2=grow, 3=text
    const [exiting, setExiting] = useState(false);

    const message = useMemo(() => {
        if (currentStreak === 1) return "First log completed! Your garden begins.";
        if (currentStreak % 7 === 0) return `${currentStreak} days — that's a full week!`;
        if (currentStreak >= 30) return "A thriving grove. Legendary!";
        if (currentStreak >= 15) return "Deep roots, strong growth.";
        if (currentStreak >= 8) return "Your garden is in full bloom!";
        return `Streak: ${currentStreak} days! Keep growing.`;
    }, [currentStreak]);

    // Which plant to show based on streak
    const plantStage = useMemo(() => {
        if (currentStreak >= 30) return 'grove';
        if (currentStreak >= 15) return 'tree';
        if (currentStreak >= 8) return 'bloom';
        if (currentStreak >= 4) return 'sapling';
        return 'sprout';
    }, [currentStreak]);

    useEffect(() => {
        const t1 = setTimeout(() => setPhase(1), 600);   // seed lands
        const t2 = setTimeout(() => setPhase(2), 1200);  // sprout
        const t3 = setTimeout(() => setPhase(3), 2000);  // full plant + text
        const t4 = setTimeout(() => setExiting(true), 5500);
        const t5 = setTimeout(onClose, 6200);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
    }, [onClose]);

    const plantColors = {
        sprout:  { stem: '#6fb03d', leaf: '#8fce5a' },
        sapling: { stem: '#4a8028', leaf: '#6da832' },
        bloom:   { stem: '#6fb03d', leaf: '#ec4899', petal: '#f9a8d4' },
        tree:    { stem: '#5a4028', leaf: '#4a8028', crown: '#6fb03d' },
        grove:   { stem: '#5a4028', leaf: '#0e7490', crown: '#06b6d4' },
    };
    const pc = plantColors[plantStage];

    return (
        <div className={`fixed inset-0 z-50 flex items-end justify-center pb-32 pointer-events-none transition-opacity duration-700 ${exiting ? 'opacity-0' : 'opacity-100'}`}>
            <style>{`
                @keyframes seed-drop {
                    0% { transform: translateY(-120px) scale(0.5); opacity: 0; }
                    60% { transform: translateY(8px) scale(1.1); opacity: 1; }
                    80% { transform: translateY(-4px) scale(0.95); }
                    100% { transform: translateY(0) scale(1); opacity: 1; }
                }
                @keyframes dirt-puff {
                    0% { transform: scale(0); opacity: 0; }
                    40% { transform: scale(1.3); opacity: 0.6; }
                    100% { transform: scale(1.8); opacity: 0; }
                }
                @keyframes grow-up {
                    0% { transform: scaleY(0); transform-origin: bottom; }
                    60% { transform: scaleY(1.1); }
                    100% { transform: scaleY(1); }
                }
                @keyframes leaf-unfurl {
                    0% { transform: scale(0) rotate(-30deg); opacity: 0; }
                    60% { transform: scale(1.15) rotate(5deg); opacity: 1; }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                @keyframes bloom-pop {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1.3); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes text-rise {
                    0% { transform: translateY(20px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                @keyframes sparkle {
                    0%, 100% { opacity: 0; transform: scale(0); }
                    50% { opacity: 1; transform: scale(1); }
                }
                .seed-anim { animation: seed-drop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                .puff-anim { animation: dirt-puff 0.5s ease-out forwards; }
                .stem-anim { animation: grow-up 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; transform-origin: bottom; }
                .leaf-anim { animation: leaf-unfurl 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                .bloom-anim { animation: bloom-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                .text-anim { animation: text-rise 0.5s ease-out forwards; }
            `}</style>

            <div className="flex flex-col items-center pointer-events-auto" onClick={onClose}>
                {/* Plant SVG scene */}
                <svg width="160" height="180" viewBox="0 0 160 180" fill="none">
                    {/* Ground / soil mound */}
                    <ellipse cx="80" cy="155" rx="55" ry="12" fill="#6b4f35" />
                    <ellipse cx="80" cy="153" rx="55" ry="12" fill="#8B6914" />
                    <ellipse cx="80" cy="151" rx="50" ry="10" fill="#9b7653" opacity="0.5" />

                    {/* Dirt puff when seed lands */}
                    {phase >= 1 && (
                        <>
                            <circle cx="65" cy="150" r="6" fill="#9b7653" opacity="0.4" className="puff-anim" />
                            <circle cx="95" cy="148" r="5" fill="#9b7653" opacity="0.3" className="puff-anim" style={{ animationDelay: '0.05s' }} />
                            <circle cx="80" cy="146" r="4" fill="#9b7653" opacity="0.35" className="puff-anim" style={{ animationDelay: '0.1s' }} />
                        </>
                    )}

                    {/* Seed */}
                    {phase >= 0 && phase < 2 && (
                        <g className={phase >= 0 ? 'seed-anim' : ''}>
                            <ellipse cx="80" cy="145" rx="7" ry="9" fill="#8B6914" />
                            <ellipse cx="80" cy="143" rx="5" ry="7" fill="#a67c2e" />
                            <ellipse cx="78" cy="141" rx="2" ry="3" fill="#c4a04e" opacity="0.5" />
                        </g>
                    )}

                    {/* Growing plant */}
                    {phase >= 2 && (
                        <g>
                            {/* Stem */}
                            <g className="stem-anim">
                                <path d={plantStage === 'tree' || plantStage === 'grove'
                                    ? "M 80,150 Q 78,120 80,70"
                                    : plantStage === 'bloom' || plantStage === 'sapling'
                                    ? "M 80,150 Q 79,125 80,90"
                                    : "M 80,150 Q 79,130 80,110"
                                } stroke={pc.stem} strokeWidth={plantStage === 'tree' || plantStage === 'grove' ? 6 : 3} strokeLinecap="round" fill="none" />
                            </g>

                            {/* Leaves / crown based on stage */}
                            {phase >= 2 && plantStage === 'sprout' && (
                                <g className="leaf-anim" style={{ animationDelay: '0.4s', opacity: 0 }}>
                                    <ellipse cx="72" cy="112" rx="10" ry="5" fill={pc.leaf} transform="rotate(-30 72 112)" />
                                    <ellipse cx="88" cy="108" rx="10" ry="5" fill={pc.leaf} transform="rotate(25 88 108)" />
                                </g>
                            )}

                            {plantStage === 'sapling' && (
                                <g className="leaf-anim" style={{ animationDelay: '0.4s', opacity: 0 }}>
                                    <ellipse cx="68" cy="105" rx="14" ry="6" fill={pc.leaf} transform="rotate(-35 68 105)" />
                                    <ellipse cx="92" cy="100" rx="14" ry="6" fill={pc.leaf} transform="rotate(30 92 100)" />
                                    <ellipse cx="75" cy="92" rx="12" ry="5" fill={pc.leaf} transform="rotate(-20 75 92)" opacity="0.8" />
                                </g>
                            )}

                            {plantStage === 'bloom' && (
                                <>
                                    <g className="leaf-anim" style={{ animationDelay: '0.3s', opacity: 0 }}>
                                        <ellipse cx="68" cy="108" rx="12" ry="5" fill="#6fb03d" transform="rotate(-35 68 108)" />
                                        <ellipse cx="92" cy="104" rx="12" ry="5" fill="#6fb03d" transform="rotate(30 92 104)" />
                                    </g>
                                    <g className="bloom-anim" style={{ animationDelay: '0.6s', opacity: 0 }}>
                                        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                                            <ellipse key={i} cx={80 + Math.cos(angle * Math.PI / 180) * 10} cy={85 + Math.sin(angle * Math.PI / 180) * 10} rx="7" ry="5" fill={pc.petal} transform={`rotate(${angle} ${80 + Math.cos(angle * Math.PI / 180) * 10} ${85 + Math.sin(angle * Math.PI / 180) * 10})`} />
                                        ))}
                                        <circle cx="80" cy="85" r="6" fill="#fbbf24" />
                                    </g>
                                </>
                            )}

                            {(plantStage === 'tree' || plantStage === 'grove') && (
                                <>
                                    <g className="leaf-anim" style={{ animationDelay: '0.4s', opacity: 0 }}>
                                        <ellipse cx="80" cy="62" rx="35" ry="28" fill={pc.crown} />
                                        <ellipse cx="65" cy="55" rx="22" ry="20" fill={pc.leaf} />
                                        <ellipse cx="95" cy="58" rx="20" ry="18" fill={pc.leaf} opacity="0.9" />
                                        <ellipse cx="80" cy="48" rx="18" ry="15" fill={pc.crown} opacity="0.8" />
                                    </g>
                                    {plantStage === 'grove' && (
                                        <g className="bloom-anim" style={{ animationDelay: '0.8s', opacity: 0 }}>
                                            <circle cx="70" cy="50" r="3" fill="#fbbf24" />
                                            <circle cx="90" cy="55" r="2.5" fill="#ef4444" />
                                            <circle cx="78" cy="42" r="2.5" fill="#fbbf24" />
                                        </g>
                                    )}
                                </>
                            )}
                        </g>
                    )}

                    {/* Sparkles when fully grown */}
                    {phase >= 3 && (
                        <g>
                            {[
                                { x: 50, y: 80, d: '0s', s: 2 },
                                { x: 110, y: 70, d: '0.3s', s: 2.5 },
                                { x: 40, y: 100, d: '0.6s', s: 1.5 },
                                { x: 120, y: 95, d: '0.15s', s: 2 },
                                { x: 75, y: 40, d: '0.45s', s: 2 },
                            ].map((sp, i) => (
                                <g key={i} style={{ animation: `sparkle 1s ease-in-out ${sp.d} infinite` }}>
                                    <line x1={sp.x - sp.s} y1={sp.y} x2={sp.x + sp.s} y2={sp.y} stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
                                    <line x1={sp.x} y1={sp.y - sp.s} x2={sp.x} y2={sp.y + sp.s} stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
                                </g>
                            ))}
                        </g>
                    )}
                </svg>

                {/* Text below */}
                {phase >= 3 && (
                    <div className="text-anim mt-2 text-center">
                        <div className={`${theme.primary} text-white px-5 py-3 rounded-2xl shadow-xl`}>
                            <p className="text-2xl font-black leading-none">{currentStreak} DAY{currentStreak !== 1 ? 'S' : ''}!</p>
                            <p className="text-xs font-medium mt-1 opacity-90">{message}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
