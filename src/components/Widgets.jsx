import React, { useMemo } from 'react';
import { Plus, Coffee, Sun, Moon, Apple, BarChart3, Target, Flame } from 'lucide-react';

export const ProgressRing = ({ current, target, label, unit, color, theme, size = 120 }) => {
  const percentage = Math.min((current / target) * 100, 100) || 0;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-black/5 theme-transition"
          />
          {/* Progress Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            style={{ 
              strokeDashoffset: offset,
              transition: 'stroke-dashoffset 1s ease-in-out'
            }}
            strokeLinecap="round"
            className={`${color} theme-transition`}
          />
        </svg>
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xl font-black ${theme.textMain} theme-transition`}>
            {Math.round(current)}
          </span>
          <span className="text-[10px] font-bold opacity-40 uppercase">
            {unit}
          </span>
        </div>
      </div>
      <div className="text-center">
        <span className={`text-xs font-bold ${theme.textMain} opacity-60 theme-transition`}>
          {label}
        </span>
        <span className="text-[10px] block opacity-40 font-medium">
          Target: {target}{unit}
        </span>
      </div>
    </div>
  );
};

export const DailyTargets = ({ totals, targets, theme, onEdit }) => {
  return (
    <Widget 
      title="Daily Progress" 
      icon={Target} 
      theme={theme}
      action={
        <button 
          onClick={onEdit}
          className={`text-[10px] font-bold px-3 py-1 rounded-full shadow-sm hover:${theme.inputBg} hover:scale-105 active:scale-95 transition-all theme-transition clickable`}
        >
          Adjust Goals
        </button>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-2">
        <ProgressRing 
          current={totals.calories} 
          target={targets.calories} 
          label="Calories" 
          unit="kcal" 
          color={theme.primaryText.replace('text-', 'stroke-')} 
          theme={theme}
        />
        <ProgressRing 
          current={totals.protein} 
          target={targets.protein} 
          label="Protein" 
          unit="g" 
          color="stroke-green-500" 
          theme={theme}
        />
        <ProgressRing 
          current={totals.carbs} 
          target={targets.carbs} 
          label="Carbs" 
          unit="g" 
          color="stroke-orange-500" 
          theme={theme}
        />
        <ProgressRing 
          current={totals.fats} 
          target={targets.fats} 
          label="Fats" 
          unit="g" 
          color="stroke-blue-500" 
          theme={theme}
        />
      </div>
    </Widget>
  );
};

export const Widget = ({ children, className = "", title, icon: Icon, action, subtitle, theme }) => (
  <div className={`${theme.card} rounded-3xl shadow-sm overflow-hidden transition-all hover:shadow-md ${className} ${theme.textMain} theme-transition`}>
    {(title || action) && (
      <div className={`px-5 py-4 shadow-sm flex justify-between items-center theme-transition`}>
        <div className="flex flex-col">
            <div className="flex items-center gap-2">
            {Icon && <Icon size={18} className={theme.accent.replace('text-', 'text-')} />}
            <h3 className={`font-bold ${theme.primaryText} text-sm tracking-wide uppercase theme-transition`}>{title}</h3>
            </div>
            {subtitle && <span className="text-xs opacity-60 font-medium ml-6.5 theme-transition">{subtitle}</span>}
        </div>
        {action}
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);

// Animated Water Bottle (Revamped)
export const WaterBottle = ({ currentOz, goalOz, onAdd }) => {
  const percentage = Math.min((currentOz / goalOz) * 100, 100);
  
  return (
    <div className="flex flex-col items-center gap-4">
        {/* Bottle Container */}
        <div className="relative w-28 h-48 bg-blue-50/30 border-[6px] border-white/80 rounded-[3rem] shadow-xl overflow-hidden active:scale-95 transition-transform backdrop-blur-sm">
            
            {/* Liquid Container */}
            <div 
                className="absolute bottom-0 left-0 right-0 bg-blue-500/80 transition-all duration-1000 ease-in-out shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                style={{ height: `${percentage}%` }}
            >
                {/* Wave Top */}
                <div className="wave-liquid"></div>
                
                {/* Internal Bubbles */}
                <div className="absolute w-2 h-2 bg-white/30 rounded-full bottom-4 left-4 animate-bounce delay-75 duration-1000"></div>
                <div className="absolute w-1.5 h-1.5 bg-white/30 rounded-full bottom-8 right-6 animate-bounce delay-150 duration-1200"></div>
                <div className="absolute w-3 h-3 bg-white/20 rounded-full bottom-12 left-8 animate-bounce delay-300 duration-1500"></div>
            </div>

            {/* Glossy Reflection (Glass Effect) */}
            <div className="absolute top-4 right-4 w-3 h-32 bg-gradient-to-b from-white/40 to-transparent rounded-full blur-[1px] pointer-events-none"></div>
            
            {/* Percentage Text Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none drop-shadow-md z-10">
                <span className={`text-2xl font-black ${percentage > 55 ? 'text-white' : 'text-blue-900/60'}`}>
                    {Math.round(percentage)}%
                </span>
            </div>
        </div>
        
        {/* Add Button */}
        <button 
            onClick={() => onAdd(8)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold hover:bg-blue-200 transition-colors shadow-sm clickable"
        >
            <Plus size={14} /> Add 8oz
        </button>
    </div>
  );
};

export const WellnessTrends = ({ entries, theme }) => {
  const stats = useMemo(() => {
    const categories = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
    const data = { 
      Breakfast: { total: 0, issues: 0 },
      Lunch: { total: 0, issues: 0 },
      Dinner: { total: 0, issues: 0 },
      Snack: { total: 0, issues: 0 }
    };
    
    let totalIssues = 0;

    entries.forEach(entry => {
      const type = categories.find(c => c.toLowerCase() === (entry.type || '').toLowerCase());
      if (type) {
        data[type].total++;
        if (!entry.finished || entry.feeling === 'sick' || entry.feeling === 'bloated') {
          data[type].issues++;
          totalIssues++;
        }
      }
    });

    const maxVal = Math.max(...Object.values(data).map(d => d.total), 4); 
    
    return { data, maxVal, totalIssues, categories };
  }, [entries]);

  return (
    <Widget title="Habit & Patterns" icon={BarChart3} subtitle="Consistency Tracker" theme={theme}>
      <div className="flex items-end justify-between gap-3 h-36 pt-4 px-2">
        {stats.categories.map((cat) => {
          const { total, issues } = stats.data[cat];
          const totalHeight = (total / stats.maxVal) * 100;
          const issueHeightRelative = total > 0 ? (issues / total) * 100 : 0;
          
          return (
            <div key={cat} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
               <div className={`relative w-full flex items-end justify-center rounded-xl overflow-hidden ${theme.inputBg} shadow-inner theme-transition`} style={{ height: '100%' }}>
                  <div className="absolute bottom-0 w-full bg-transparent flex items-end justify-center h-full">
                      <div 
                        className={`w-full ${theme.secondary.replace('bg-', 'bg-')} absolute bottom-0 transition-all duration-700 ease-out rounded-t-sm opacity-50`}
                        style={{ height: `${totalHeight}%` }}
                      >
                          <div 
                            className="w-full bg-rose-500 absolute bottom-0 transition-all duration-700 ease-out opacity-80"
                            style={{ height: `${issueHeightRelative}%` }}
                          />
                      </div>
                  </div>
                  
                  {total > 0 && (
                    <span 
                        className={`absolute w-full text-center text-[10px] font-bold ${theme.textMain} opacity-70 transition-all duration-700 theme-transition`}
                        style={{ bottom: `${totalHeight + 5}%` }}
                    >
                      {total}
                    </span>
                  )}
               </div>
               
               <div className="text-center">
                 <span className={`text-[10px] font-bold uppercase tracking-wide block mb-1 ${theme.textMain} opacity-60 theme-transition`}>
                   {cat}
                 </span>
                 <div className={`flex justify-center opacity-40 ${theme.textMain} theme-transition`}>
                    {cat === 'Breakfast' ? <Coffee size={12}/> : 
                     cat === 'Lunch' ? <Sun size={12}/> : 
                     cat === 'Dinner' ? <Moon size={12}/> : 
                     <Apple size={12}/>}
                 </div>
               </div>
            </div>
          );
        })}
      </div>
    </Widget>
  );
};
