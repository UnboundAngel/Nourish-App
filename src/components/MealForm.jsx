import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Clock, Coffee, Sun, Moon, Apple, Plus, CheckCircle, Circle, ChevronUp, ChevronDown, Utensils, Heart, Info, X, Tag } from 'lucide-react';
import { Modal } from './Modals';

const CALORIE_MAP = {
    protein: 4,
    carbs: 4,
    fats: 9
};

const SUGGESTED_TAGS = ['Healthy', 'Homemade', 'Takeout', 'Snack', 'High Protein', 'Low Carb', 'Cheat Meal', 'Meal Prep'];

export const MealForm = ({ isOpen, onClose, onSave, theme, editingId, initialData, use24HourTime }) => {
    // --- Internal State ---
    const [formData, setFormData] = useState({
        name: '', calories: 0, protein: 0, carbs: 0, fats: 0, type: 'Breakfast',
        time: '12:00', finished: true, feeling: 'good', note: '', tags: ''
    });
    const [isChangingTime, setIsChangingTime] = useState(false);

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
        }
    }, [isOpen, editingId, initialData, getCurrentTime]);

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

    const handleTimeChange = (type, val) => {
        let [h, m] = (formData.time || "00:00").split(':');
        if (type === 'hour') h = val.padStart(2, '0');
        if (type === 'minute') m = val.padStart(2, '0');
        setFormData({ ...formData, time: `${h}:${m}` });
    };

    const toggleAMPM = () => {
        let [h, m] = (formData.time || "00:00").split(':');
        let hours = parseInt(h);
        if (hours < 12) hours += 12;
        else hours -= 12;
        setFormData({ ...formData, time: `${hours.toString().padStart(2, '0')}:${m}` });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
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

    const timeParts = useMemo(() => {
        const timeStr = formData.time || "00:00";
        let [h, m] = timeStr.split(':');
        let hours = parseInt(h) || 0;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        let displayHours = hours % 12 || 12;
        return { h: displayHours.toString(), m: m || "00", ampm };
    }, [formData.time]);

    const formatTimeDisplay = (timeString) => {
        if (!timeString) return '';
        if (use24HourTime) return timeString;
        const [hours, minutes] = timeString.split(':');
        const h = parseInt(hours, 10);
        const suffix = h >= 12 ? 'PM' : 'AM';
        const formattedH = h % 12 || 12;
        return `${formattedH}:${minutes} ${suffix}`;
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingId ? "Edit Meal" : "New Meal"} theme={theme} maxWidth="max-w-xl">
            <form onSubmit={handleSubmit} className="space-y-8 py-4 outline-none">
                
                {/* 1. TOP BAR: NAME & TIME */}
                <div className="space-y-6">
                    <div className="text-center">
                        <input 
                            type="text" 
                            placeholder="What did you eat?" 
                            className={`w-full bg-transparent font-black text-3xl outline-none placeholder:opacity-10 ${theme.textMain} text-center`} 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            required 
                        />
                    </div>

                    <div className="flex justify-center">
                        <button 
                            type="button" 
                            onClick={() => setIsChangingTime(!isChangingTime)}
                            className={`px-6 py-2.5 rounded-full ${theme.inputBg} shadow-sm flex items-center gap-3 transition-all hover:scale-105`}
                        >
                            <Clock size={16} className="opacity-40" />
                            <span className="text-xs font-black tabular-nums">{formatTimeDisplay(formData.time)}</span>
                            <span className={`text-[10px] font-black uppercase ${theme.primaryText} opacity-60`}>{isChangingTime ? 'Close' : 'Edit'}</span>
                        </button>
                    </div>

                    {isChangingTime && (
                        <div className="bg-black/5 p-6 rounded-[2.5rem] flex items-center justify-center gap-8 animate-in fade-in slide-in-from-top-4 duration-500 shadow-inner">
                            <div className="flex items-center gap-2">
                                <input type="number" min="1" max="12" className="no-native-spinners w-12 bg-transparent font-black text-4xl outline-none text-center tabular-nums" value={timeParts.h} onChange={e => handleTimeChange('hour', e.target.value)} />
                                <span className="text-xl font-black opacity-20">:</span>
                                <input type="number" min="0" max="59" className="no-native-spinners w-12 bg-transparent font-black text-4xl outline-none text-center tabular-nums" value={timeParts.m} onChange={e => handleTimeChange('minute', e.target.value)} />
                            </div>
                            <button type="button" onClick={toggleAMPM} className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all ${timeParts.ampm === 'PM' ? `${theme.primary} text-white` : `bg-white/10 opacity-60`}`}>{timeParts.ampm}</button>
                        </div>
                    )}
                </div>

                {/* 2. THE HUB: CALORIES & MACROS */}
                <div className={`p-8 rounded-[3rem] ${theme.inputBg} shadow-inner space-y-12 relative overflow-hidden`}>
                    
                    <div className="relative flex flex-col items-center justify-center py-6">
                        <svg className="absolute w-64 h-64 -rotate-90 pointer-events-none" viewBox="0 0 100 100">
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

                        <div className="relative z-10 text-center">
                            <input
                                type="number"
                                placeholder="0"
                                className="no-native-spinners bg-transparent font-black text-7xl outline-none text-center tabular-nums w-44"
                                style={{ color: 'inherit', WebkitAppearance: 'none', margin: 0, MozAppearance: 'textfield' }}
                                value={formData.calories}
                                onChange={e => setFormData({...formData, calories: e.target.value})}
                            />
                            <div className="text-[10px] font-black opacity-30 uppercase tracking-[0.4em] mt-1">Calories Total</div>
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
                                            type="number"
                                            className="no-native-spinners bg-transparent w-12 text-center font-black text-xl outline-none tabular-nums"
                                            style={{ WebkitAppearance: 'none', margin: 0, MozAppearance: 'textfield' }}
                                            value={formData[macro]}
                                            onChange={(e) => handleMacroChange(macro, e.target.value)}
                                        />
                                        <button type="button" onClick={() => handleDecrementMacro(macro)} className={`p-2 hover:scale-125 transition-all ${colorClass}`}><ChevronDown size={18} strokeWidth={3}/></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 3. TYPE & FEELING */}
                <div className="space-y-10 px-2">
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { id: 'Breakfast', icon: Coffee, color: 'bg-amber-400' },
                            { id: 'Lunch', icon: Sun, color: 'bg-orange-500' },
                            { id: 'Dinner', icon: Moon, color: 'bg-indigo-600' },
                            { id: 'Snack', icon: Apple, color: 'bg-rose-500' }
                        ].map(t => (
                            <button 
                                key={t.id} 
                                type="button" 
                                onClick={() => setFormData({...formData, type: t.id})} 
                                className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-2 border-2 ${
                                    formData.type === t.id 
                                    ? `${t.color} text-white border-transparent shadow-lg scale-105` 
                                    : `${theme.inputBg} border-transparent opacity-40 ${theme.textMain} hover:opacity-100`
                                }`}
                            >
                                <t.icon size={20} />
                                {t.id}
                            </button>
                        ))}
                    </div>

                    <div className={`p-8 rounded-[3rem] ${theme.card} space-y-8 shadow-sm`}>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-2">
                            <h4 className={`text-sm font-black uppercase tracking-widest opacity-40`}>Satisfaction</h4>
                            <button 
                                type="button" 
                                onClick={() => setFormData({...formData, finished: !formData.finished})} 
                                className={`w-full sm:w-auto px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${formData.finished ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-200 text-slate-500'}`}
                            >
                                {formData.finished ? 'Clean Plate' : 'Leftovers'}
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'great', label: 'Great', color: 'bg-emerald-500' },
                                { id: 'good', label: 'Good', color: 'bg-blue-500' },
                                { id: 'sick', label: 'Sick', color: 'bg-rose-500' }
                            ].map(f => (
                                <button 
                                    key={f.id} 
                                    type="button" 
                                    onClick={() => setFormData({...formData, feeling: f.id})} 
                                    className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                                        formData.feeling === f.id
                                        ? `${f.color} text-white border-transparent scale-110 shadow-xl` 
                                        : `${theme.inputBg} border-transparent opacity-40 hover:opacity-100`
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. NOTES, TAGS & SUBMIT */}
                <div className="space-y-6">
                    <textarea 
                        placeholder="Add notes..." 
                        className={`w-full p-6 bg-black/5 rounded-[2rem] text-sm font-handwritten outline-none min-h-[100px] ${theme.textMain} placeholder:opacity-20 border border-transparent focus:border-black/5 transition-all shadow-inner`} 
                        value={formData.note} 
                        onChange={e => setFormData({...formData, note: e.target.value})} 
                    />

                    {/* Tags */}
                    <div className={`p-5 rounded-[2rem] ${theme.inputBg} shadow-inner space-y-3`}>
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

                    <button 
                        type="submit" 
                        className={`w-full py-5 rounded-full ${theme.primary} text-white font-black text-xl shadow-2xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-[0.2em]`}
                    >
                        {editingId ? "Update Meal" : "Save Entry"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};