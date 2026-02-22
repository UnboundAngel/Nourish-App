import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Clock, ChevronUp, ChevronDown, X, Tag, Zap, Heart } from 'lucide-react';
import { Modal } from './Modals';
import { FEELING_LIST, normalizeFeeling } from '../utils/feelings';

const CALORIE_MAP = { protein: 4, carbs: 4, fats: 9 };
const SUGGESTED_TAGS = ['Healthy', 'Homemade', 'Takeout', 'Snack', 'High Protein', 'Low Carb', 'Cheat Meal', 'Meal Prep'];

export const MealForm = ({ isOpen, onClose, onSave, theme, editingId, initialData, use24HourTime, foodMemory }) => {
    const [formData, setFormData] = useState({
        name: '', calories: 0, protein: 0, carbs: 0, fats: 0, type: 'Breakfast',
        time: '12:00', finished: true, feeling: 'good', note: '', tags: ''
    });
    const [isChangingTime, setIsChangingTime] = useState(false);
    const [editHour, setEditHour] = useState('');
    const [editMinute, setEditMinute] = useState('');
    const [editAmpm, setEditAmpm] = useState('AM');
    const [errors, setErrors] = useState({});
    const [showScrollHint, setShowScrollHint] = useState(true);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showPantry, setShowPantry] = useState(false);
    const nameRef = useRef(null);
    const suggestionsRef = useRef(null);
    const caloriesRef = useRef(null);
    const caloriesInputRef = useRef(null);
    const calHubRef = useRef(null);
    const touchStartY = useRef(null);
    const formDataRef = useRef(formData);
    const errorsRef = useRef(errors);

    // --- Helpers ---
    const getCurrentTime = useCallback(() => {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }, []);

    const calculateCaloriesFromMacros = (data) => {
        return (
            (Number(data.protein) * CALORIE_MAP.protein) +
            (Number(data.carbs) * CALORIE_MAP.carbs) +
            (Number(data.fats) * CALORIE_MAP.fats)
        );
    };

    const applyFood = (food) => {
        setFormData(prev => ({
            ...prev,
            name: food.name,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fats: food.fats,
        }));
        setShowSuggestions(false);
        if (errors.name) setErrors(prev => ({...prev, name: null}));
        if (errors.calories) setErrors(prev => ({...prev, calories: null}));
    };

    // --- Effects ---
    useEffect(() => {
        if (isOpen) {
            if (editingId && initialData) {
                setFormData(initialData);
            } else {
                setFormData({
                    name: '', calories: 0, protein: 0, carbs: 0, fats: 0, type: 'Breakfast',
                    time: getCurrentTime(),
                    finished: true, feeling: 'good', note: '', tags: ''
                });
            }
            setIsChangingTime(false);
            setErrors({});
            setShowScrollHint(true);
            setSuggestions([]);
            setShowSuggestions(false);
            setShowPantry(false);
        }
    }, [isOpen, editingId, initialData, getCurrentTime]);

    // Keep refs in sync with state for the native wheel listener
    useEffect(() => { formDataRef.current = formData; }, [formData]);
    useEffect(() => { errorsRef.current = errors; }, [errors]);

    // Attach a NATIVE non-passive wheel listener so preventDefault() actually works
    useEffect(() => {
        const el = calHubRef.current;
        if (!el) return;
        const onWheel = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowScrollHint(false);
            const delta = e.deltaY > 0 ? -10 : 10;
            const cur = Number(formDataRef.current.calories) || 0;
            const newCals = Math.max(0, cur + delta);
            setFormData(prev => ({...prev, calories: newCals.toString()}));
            if (errorsRef.current.calories && newCals > 0) setErrors(prev => ({...prev, calories: null}));
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [isOpen]);

    // --- Handlers ---
    const handleMacroChange = (macro, value) => {
        const updatedData = { ...formData, [macro]: value };
        const newCalories = calculateCaloriesFromMacros(updatedData);
        setFormData({ ...updatedData, calories: newCalories.toString() });
    };

    const handleIncrementMacro = (macro) => {
        const updatedData = { ...formData, [macro]: Number(formData[macro]) + 1 };
        const newCalories = calculateCaloriesFromMacros(updatedData);
        setFormData({ ...updatedData, calories: newCalories.toString() });
    };

    const handleDecrementMacro = (macro) => {
        const updatedData = { ...formData, [macro]: Math.max(0, Number(formData[macro]) - 1) };
        const newCalories = calculateCaloriesFromMacros(updatedData);
        setFormData({ ...updatedData, calories: newCalories.toString() });
    };

    // Commit local time editor state back to formData.time (24h format)
    const commitTime = useCallback((h, m, ampm) => {
        let hour = parseInt(h) || 0;
        const minute = Math.max(0, Math.min(59, parseInt(m) || 0));
        // Convert 12h display to 24h
        if (ampm === 'AM') {
            if (hour === 12) hour = 0;
            else hour = Math.max(0, Math.min(11, hour));
        } else {
            if (hour === 12) hour = 12;
            else hour = Math.max(1, Math.min(11, hour)) + 12;
        }
        setFormData(prev => ({ ...prev, time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}` }));
    }, []);

    // Sync local editor state FROM formData when time picker opens
    const openTimePicker = useCallback(() => {
        const timeStr = formData.time || '12:00';
        let [h, m] = timeStr.split(':');
        let hours = parseInt(h) || 0;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        let displayH = hours % 12;
        if (displayH === 0) displayH = 12;
        setEditHour(displayH.toString());
        setEditMinute(m || '00');
        setEditAmpm(ampm);
        setIsChangingTime(true);
    }, [formData.time]);

    const closeTimePicker = useCallback(() => {
        commitTime(editHour, editMinute, editAmpm);
        setIsChangingTime(false);
    }, [editHour, editMinute, editAmpm, commitTime]);

    const handleHourBlur = () => {
        let h = parseInt(editHour) || 0;
        h = Math.max(1, Math.min(12, h));
        setEditHour(h.toString());
        commitTime(h.toString(), editMinute, editAmpm);
    };

    const handleMinuteBlur = () => {
        let m = parseInt(editMinute) || 0;
        m = Math.max(0, Math.min(59, m));
        setEditMinute(m.toString().padStart(2, '0'));
        commitTime(editHour, m.toString(), editAmpm);
    };

    const toggleAMPM = () => {
        const newAmpm = editAmpm === 'AM' ? 'PM' : 'AM';
        setEditAmpm(newAmpm);
        commitTime(editHour, editMinute, newAmpm);
    };

    const handleCaloriesTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleCaloriesTouchMove = (e) => {
        if (touchStartY.current === null) return;
        e.preventDefault();
        e.stopPropagation();
        setShowScrollHint(false);
        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY.current - touchY;
        if (Math.abs(deltaY) > 10) {
            const delta = deltaY > 0 ? 5 : -5;
            const newCals = Math.max(0, Number(formData.calories) + delta);
            setFormData({...formData, calories: newCals.toString()});
            if (errors.calories && newCals > 0) setErrors(prev => ({...prev, calories: null}));
            touchStartY.current = touchY;
        }
    };

    const handleCaloriesTouchEnd = () => {
        touchStartY.current = null;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Please enter a meal name';
        if (!Number(formData.calories) || Number(formData.calories) <= 0) newErrors.calories = 'Calories must be greater than 0';
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Scroll to first error
            const firstRef = newErrors.name ? nameRef : caloriesRef;
            if (firstRef.current) {
                firstRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstRef.current.focus();
            }
            return;
        }
        setErrors({});
        onSave(formData);
    };

    // --- Computed ---
    const macroPercentages = useMemo(() => {
        const pCals = Number(formData.protein) * CALORIE_MAP.protein;
        const cCals = Number(formData.carbs) * CALORIE_MAP.carbs;
        const fCals = Number(formData.fats) * CALORIE_MAP.fats;
        const total = pCals + cCals + fCals;
        if (total === 0) return { protein: 0, carbs: 0, fats: 0 };
        return {
            protein: (pCals / total) * 100,
            carbs: (cCals / total) * 100,
            fats: (fCals / total) * 100
        };
    }, [formData.protein, formData.carbs, formData.fats]);


    const formatTimeDisplay = (timeString) => {
        if (!timeString) return '';
        if (use24HourTime) return timeString;
        const [hours, minutes] = timeString.split(':');
        const h = parseInt(hours, 10);
        const suffix = h >= 12 ? 'PM' : 'AM';
        const formattedH = h % 12 || 12;
        return `${formattedH}:${minutes} ${suffix}`;
    };

    const commonMeals = useMemo(() => {
        if (!foodMemory) return [];
        return foodMemory.getCommonMeals(formData.type);
    }, [foodMemory, formData.type]);

    const inPantry = foodMemory && formData.name.trim() && foodMemory.isInPantry(formData.name);

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingId ? "Edit Meal" : "New Meal"} theme={theme} maxWidth="max-w-xl">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 py-2 sm:py-4 outline-none">
                
                {/* 1. TOP BAR: NAME & TIME */}
                <div className="space-y-4 sm:space-y-6">
                    <div className="text-center">
                        <div className="relative">
                            <input 
                                ref={nameRef}
                                type="text" 
                                placeholder="What did you eat?" 
                                className={`w-full bg-transparent font-black text-2xl sm:text-3xl outline-none placeholder:opacity-10 ${theme.textMain} text-center border-b-2 pb-2 transition-colors ${errors.name ? 'border-rose-500' : 'border-transparent'}`} 
                                value={formData.name} 
                                onChange={e => { 
                                    const newName = e.target.value;
                                    setFormData({...formData, name: newName}); 
                                    if (errors.name && newName.trim()) setErrors(prev => ({...prev, name: null}));
                                    if (foodMemory && newName.trim().length >= 2) {
                                        const results = foodMemory.searchFoods(newName.trim());
                                        setSuggestions(results);
                                        setShowSuggestions(results.length > 0);
                                    } else {
                                        setShowSuggestions(false);
                                    }
                                }}
                                onFocus={() => {
                                    if (suggestions.length > 0) setShowSuggestions(true);
                                }}
                            />
                            {/* Quick-fill Autocomplete Dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div ref={suggestionsRef} className={`absolute left-0 right-0 top-full mt-2 ${theme.card} rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}>
                                    <div className="flex items-center gap-2 px-4 py-2 border-b border-black/5">
                                        <Zap size={12} className={theme.primaryText} />
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Quick Fill</span>
                                    </div>
                                    {suggestions.map((food, i) => (
                                        <button
                                            key={`${food.name}-${i}`}
                                            type="button"
                                            className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors ${i > 0 ? 'border-t border-black/5' : ''}`}
                                            onClick={() => applyFood(food)}
                                        >
                                            <div className="min-w-0">
                                                <p className={`text-sm font-bold truncate ${theme.textMain}`}>{food.name}</p>
                                                <p className="text-[10px] font-bold opacity-40">{food.calories} kcal &middot; {food.protein}p &middot; {food.carbs}c &middot; {food.fats}f</p>
                                            </div>
                                            {food.source === 'pantry' && <Heart size={12} className="text-rose-400 flex-shrink-0" fill="currentColor" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {errors.name && <p className="text-rose-500 text-xs font-bold mt-2 animate-in fade-in slide-in-from-top-1 duration-200">{errors.name}</p>}
                    </div>

                    {/* Common Meals & Pantry Quick-Add (only when creating new, not editing) */}
                    {!editingId && foodMemory && !formData.name && (
                        <div className="space-y-3 animate-in fade-in duration-300">
                            {commonMeals.length > 0 && (
                                <div className={`p-4 rounded-2xl ${theme.inputBg} shadow-inner space-y-3`}>
                                    <div className="flex items-center gap-2">
                                        <Zap size={12} className={theme.primaryText} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${theme.textMain}`}>Common {formData.type} meals</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {commonMeals.map((food, i) => (
                                            <button key={`common-${food.name}-${i}`} type="button" onClick={() => applyFood(food)}
                                                className={`px-3 py-2 rounded-xl ${theme.card} shadow-sm text-xs font-bold hover:scale-105 active:scale-95 transition-all ${theme.textMain} flex items-center gap-1.5`}>
                                                <span>{food.name}</span>
                                                <span className="opacity-30 text-[10px]">{food.calories}kcal</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {foodMemory.pantry.length > 0 && (
                                <div className={`p-4 rounded-2xl ${theme.inputBg} shadow-inner space-y-3`}>
                                    <button type="button" onClick={() => setShowPantry(!showPantry)} className="flex items-center gap-2 w-full">
                                        <Heart size={12} className="text-rose-400" fill="currentColor" />
                                        <span className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${theme.textMain}`}>My Pantry ({foodMemory.pantry.length})</span>
                                        <ChevronDown size={12} className={`ml-auto opacity-30 transition-transform ${showPantry ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showPantry && (
                                        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {foodMemory.pantry.map((food, i) => (
                                                <div key={`pantry-${food.name}-${i}`} className="flex items-center gap-0.5">
                                                    <button type="button" onClick={() => applyFood(food)}
                                                        className={`px-3 py-2 rounded-l-xl ${theme.card} shadow-sm text-xs font-bold hover:scale-105 active:scale-95 transition-all ${theme.textMain}`}>
                                                        <span>{food.name}</span>
                                                        <span className="opacity-30 text-[10px] ml-1.5">{food.calories}kcal</span>
                                                    </button>
                                                    <button type="button" onClick={() => foodMemory.removeFromPantry(food.name)}
                                                        className={`px-1.5 py-2 rounded-r-xl ${theme.card} shadow-sm opacity-30 hover:opacity-100 hover:text-rose-500 transition-all`}>
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-center">
                        <button 
                            type="button" 
                            onClick={() => isChangingTime ? closeTimePicker() : openTimePicker()}
                            className={`px-6 py-2.5 rounded-full ${theme.inputBg} shadow-sm flex items-center gap-3 transition-all hover:scale-105`}
                        >
                            <Clock size={16} className="opacity-40" />
                            <span className="text-xs font-black tabular-nums">{formatTimeDisplay(formData.time)}</span>
                            <span className={`text-[10px] font-black uppercase ${theme.primaryText} opacity-60`}>{isChangingTime ? 'Done' : 'Edit'}</span>
                        </button>
                    </div>

                    {isChangingTime && (
                        <div className="bg-black/5 p-6 rounded-[2.5rem] flex items-center justify-center gap-8 animate-in fade-in slide-in-from-top-4 duration-500 shadow-inner">
                            <div className="flex items-center gap-2">
                                <input type="text" inputMode="numeric" pattern="[0-9]*" className={`w-14 bg-transparent font-black text-4xl outline-none text-center tabular-nums ${theme.textMain}`} value={editHour} onChange={e => setEditHour(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))} onBlur={handleHourBlur} />
                                <span className="text-xl font-black opacity-20">:</span>
                                <input type="text" inputMode="numeric" pattern="[0-9]*" className={`w-14 bg-transparent font-black text-4xl outline-none text-center tabular-nums ${theme.textMain}`} value={editMinute} onChange={e => setEditMinute(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))} onBlur={handleMinuteBlur} />
                            </div>
                            <button type="button" onClick={toggleAMPM} className={`px-5 py-2.5 rounded-xl text-sm font-black uppercase transition-all active:scale-95 ${editAmpm === 'PM' ? `${theme.primary} text-white` : `${theme.inputBg} ${theme.textMain} opacity-60`}`}>{editAmpm}</button>
                        </div>
                    )}
                </div>  

                {/* 2. THE HUB: CALORIES & MACROS */}
                <div className={`p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] ${theme.inputBg} shadow-inner space-y-8 sm:space-y-12 relative overflow-hidden`}>
                    
                    <div 
                        className="relative flex flex-col items-center justify-center py-4 sm:py-6"
                        ref={calHubRef}
                    >
                        <svg className="absolute w-48 h-48 sm:w-64 sm:h-64 -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" className="stroke-black/5" strokeWidth="1" />
                            <circle cx="50" cy="50" r="42" fill="none" className="stroke-emerald-500 transition-all duration-1000" strokeWidth="6" 
                                strokeDasharray={`${macroPercentages.protein * 2.64} 264`} strokeLinecap="round" />
                            <circle cx="50" cy="50" r="42" fill="none" className="stroke-orange-500 transition-all duration-1000" strokeWidth="6" 
                                strokeDasharray={`${macroPercentages.carbs * 2.64} 264`} 
                                strokeDashoffset={`-${macroPercentages.protein * 2.64}`} strokeLinecap="round" />
                            <circle cx="50" cy="50" r="42" fill="none" className="stroke-blue-500 transition-all duration-1000" strokeWidth="6" 
                                strokeDasharray={`${macroPercentages.fats * 2.64} 264`} 
                                strokeDashoffset={`-${(macroPercentages.protein + macroPercentages.carbs) * 2.64}`} strokeLinecap="round" />
                        </svg>

                        <div ref={caloriesRef} className="relative z-10 text-center">
                            {showScrollHint && (
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-30 animate-pulse pointer-events-none">
                                    <ChevronUp size={12} strokeWidth={2.5} />
                                    <ChevronDown size={12} strokeWidth={2.5} />
                                </div>
                            )}
                            <input
                                ref={caloriesInputRef}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="0"
                                className={`no-native-spinners bg-transparent font-black text-5xl sm:text-7xl outline-none text-center tabular-nums w-36 sm:w-44 border-b-2 pb-1 transition-colors cursor-ns-resize ${errors.calories ? 'border-rose-500' : 'border-transparent'}`}
                                style={{ color: 'inherit' }}
                                value={formData.calories}
                                onChange={e => { 
                                    const newCals = e.target.value.replace(/[^0-9]/g, '');
                                    setFormData({...formData, calories: newCals}); 
                                    if (errors.calories && Number(newCals) > 0) setErrors(prev => ({...prev, calories: null})); 
                                }}
                                onFocus={() => setShowScrollHint(false)}
                            />
                            <div className="text-[10px] font-black opacity-30 uppercase tracking-[0.4em] mt-1">Calories Total</div>
                            {!errors.calories && showScrollHint && (
                                <p className="text-xs font-bold mt-2 opacity-30 animate-pulse">Scroll or swipe to adjust</p>
                            )}
                            {errors.calories && <p className="text-rose-500 text-xs font-bold mt-2 animate-in fade-in slide-in-from-top-1 duration-200">{errors.calories}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {['protein', 'carbs', 'fats'].map((macro) => {
                            const colorClass = macro === 'protein' ? 'text-emerald-500' : macro === 'carbs' ? 'text-orange-500' : 'text-blue-500';
                            const bgClass = macro === 'protein' ? 'bg-emerald-500/10' : macro === 'carbs' ? 'bg-orange-500/10' : 'bg-blue-500/10';
                            
                            return (
                                <div key={macro} className="flex flex-col items-center gap-3">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${colorClass}`}>
                                        {macro === 'protein' ? 'Protein' : macro === 'carbs' ? 'Carbs' : 'Fats'}
                                    </span>
                                    
                                    <div className={`flex flex-col items-center ${bgClass} rounded-full p-1 border border-black/5`}>
                                        <button type="button" onClick={() => handleIncrementMacro(macro)} className={`p-2 hover:scale-125 transition-all ${colorClass}`}><ChevronUp size={18} strokeWidth={3}/></button>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            className="bg-transparent w-12 text-center font-black text-xl outline-none tabular-nums"
                                            value={formData[macro]}
                                            onChange={(e) => handleMacroChange(macro, e.target.value.replace(/[^0-9]/g, ''))}
                                        />
                                        <button type="button" onClick={() => handleDecrementMacro(macro)} className={`p-2 hover:scale-125 transition-all ${colorClass}`}><ChevronDown size={18} strokeWidth={3}/></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 3. TYPE & FEELING */}
                <div className="space-y-6 sm:space-y-10 px-1 sm:px-2">
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { id: 'Breakfast', icon: '/breakfast.svg', color: 'bg-amber-400' },
                            { id: 'Lunch', icon: '/lunch.svg', color: 'bg-orange-500' },
                            { id: 'Dinner', icon: '/dinner.svg', color: 'bg-indigo-600' },
                            { id: 'Snack', icon: '/snack.svg', color: 'bg-rose-500' }
                        ].map(t => (
                            <button 
                                key={t.id} 
                                type="button" 
                                onClick={() => setFormData({...formData, type: t.id})} 
                                className={`py-3 sm:py-4 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-1.5 sm:gap-2 border-2 ${
                                    formData.type === t.id 
                                    ? `${t.color} text-white border-transparent shadow-lg scale-105` 
                                    : `${theme.inputBg} border-transparent opacity-40 ${theme.textMain} hover:opacity-100`
                                }`}
                            >
                                <img src={t.icon} alt={t.id} className="w-5 h-5" />
                                {t.id}
                            </button>
                        ))}
                    </div>

                    <div className={`p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] ${theme.card} space-y-6 sm:space-y-8 shadow-sm`}>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-2">
                            <h4 className={`text-sm font-black uppercase tracking-widest opacity-40`}>Satisfaction</h4>
                            <button 
                                type="button" 
                                onClick={() => setFormData({...formData, finished: !formData.finished})} 
                                className={`w-full sm:w-auto px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${formData.finished ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : `${theme.inputBg} ${theme.textMain} opacity-50`}`}
                            >
                                {formData.finished ? 'Clean Plate' : 'Leftovers'}
                            </button>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            {FEELING_LIST.map(f => {
                                const isSelected = normalizeFeeling(formData.feeling) === f.id;
                                return (
                                    <button 
                                        key={f.id} 
                                        type="button" 
                                        onClick={() => setFormData({...formData, feeling: f.id})} 
                                        className={`py-3 px-1 rounded-2xl flex flex-col items-center gap-2 transition-all border-2 ${
                                            isSelected
                                            ? `${f.color} text-white border-transparent scale-105 shadow-xl` 
                                            : `${theme.inputBg} border-transparent opacity-40 hover:opacity-100`
                                        }`}
                                    >
                                        <img src={f.icon} alt={f.shortLabel} className={`w-7 h-7 ${isSelected && !f.isIllustration ? 'brightness-0 invert' : ''}`} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">{f.shortLabel}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 4. NOTES, TAGS & SUBMIT */}
                <div className="space-y-6">
                    <textarea 
                        placeholder="Add notes..." 
                        className={`w-full p-4 sm:p-6 bg-black/5 rounded-[1.5rem] sm:rounded-[2rem] text-sm font-handwritten outline-none min-h-[80px] sm:min-h-[100px] ${theme.textMain} placeholder:opacity-20 border border-transparent focus:border-black/5 transition-all shadow-inner resize-none`} 
                        value={formData.note} 
                        onChange={e => setFormData({...formData, note: e.target.value})} 
                    />

                    {/* Tags */}
                    <div className={`p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] ${theme.inputBg} shadow-inner space-y-3`}>
                        <div className="flex items-center gap-2 mb-1">
                            <Tag size={14} className="opacity-40" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Tags</span>
                        </div>

                        {/* Current tags as chips */}
                        {formData.tags && (
                            <div className="flex flex-wrap gap-2">
                                {formData.tags.split(',').filter(t => t.trim()).map(tag => (
                                    <span 
                                        key={tag.trim()} 
                                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full ${theme.primary} text-white text-[10px] font-black uppercase tracking-wider`}
                                    >
                                        {tag.trim()}
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                const updated = formData.tags.split(',').filter(t => t.trim() !== tag.trim()).join(', ');
                                                setFormData({...formData, tags: updated});
                                            }}
                                            className="ml-0.5 hover:opacity-70 active:scale-90"
                                        >
                                            <X size={10} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Suggested tags */}
                        <div className="flex flex-wrap gap-1.5">
                            {SUGGESTED_TAGS.filter(st => {
                                const current = formData.tags ? formData.tags.split(',').map(t => t.trim().toLowerCase()) : [];
                                return !current.includes(st.toLowerCase());
                            }).map(tag => (
                                <button 
                                    key={tag} 
                                    type="button" 
                                    onClick={() => {
                                        const current = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
                                        setFormData({...formData, tags: [...current, tag].join(', ')});
                                    }}
                                    className={`px-3 py-1.5 rounded-full ${theme.card} text-[10px] font-bold opacity-50 hover:opacity-100 hover:scale-105 active:scale-95 transition-all shadow-sm ${theme.textMain}`}
                                >
                                    + {tag}
                                </button>
                            ))}
                        </div>

                        {/* Custom tag input */}
                        <input 
                            type="text" 
                            placeholder="Add custom tag..." 
                            className={`w-full p-3 ${theme.card} rounded-xl text-xs font-bold outline-none ${theme.textMain} placeholder:opacity-25 shadow-sm`}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                    e.preventDefault();
                                    const current = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
                                    if (!current.map(t => t.toLowerCase()).includes(e.target.value.trim().toLowerCase())) {
                                        setFormData({...formData, tags: [...current, e.target.value.trim()].join(', ')});
                                    }
                                    e.target.value = '';
                                }
                            }}
                        />
                    </div>

                    {/* Save to Pantry + Submit */}
                    <div className="space-y-3">
                        {foodMemory && formData.name.trim() && Number(formData.calories) > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (inPantry) {
                                        foodMemory.removeFromPantry(formData.name);
                                    } else {
                                        foodMemory.addToPantry(formData);
                                    }
                                }}
                                className={`w-full py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                    inPantry 
                                    ? 'bg-rose-100 text-rose-500 hover:bg-rose-200' 
                                    : `${theme.inputBg} ${theme.textMain} opacity-60 hover:opacity-100`
                                }`}
                            >
                                <Heart size={14} fill={inPantry ? "currentColor" : "none"} />
                                {inPantry ? 'Remove from Pantry' : 'Save to Pantry'}
                            </button>
                        )}
                        <button 
                            type="submit" 
                            className={`w-full py-4 sm:py-5 rounded-full ${theme.primary} text-white font-black text-lg sm:text-xl shadow-2xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-[0.15em] sm:tracking-[0.2em]`}
                        >
                            {editingId ? "Update Meal" : "Save Entry"}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};
