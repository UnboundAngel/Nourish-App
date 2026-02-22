import React, { useMemo, useState } from 'react';
import { Plus, BarChart3, Target, Flame, TrendingDown } from 'lucide-react';
import { FEELINGS, getFeeling } from '../utils/feelings';

export const ProgressRing = ({ current, target, label, unit, color, theme, size }) => {
  // Default responsive sizes: 100px on mobile, 120px on larger screens
  const responsiveSize = size || 100;
  const percentage = Math.min((current / target) * 100, 100) || 0;
  const strokeWidth = 10;
  const radius = (responsiveSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: responsiveSize, height: responsiveSize }}>
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={responsiveSize / 2}
            cy={responsiveSize / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-black/5 theme-transition"
          />
          {/* Progress Circle */}
          <circle
            cx={responsiveSize / 2}
            cy={responsiveSize / 2}
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

export const TriggerFinder = ({ topTrigger, activeExperiment, experimentResults, theme, onStartExperiment, onStopExperiment }) => {
  if (!topTrigger && !activeExperiment) return null;

  return (
    <Widget 
      title="Pattern Insights" 
      icon={BarChart3} 
      subtitle={activeExperiment ? "Testing a trigger" : "Detected pattern"} 
      theme={theme}
      action={
        activeExperiment && (
          <button 
            onClick={onStopExperiment}
            className={`text-[10px] font-bold px-3 py-1 rounded-full ${theme.inputBg} opacity-50 hover:opacity-100 transition-all`}
          >
            Complete
          </button>
        )
      }
    >
      {activeExperiment ? (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className={`text-xs font-bold ${theme.textMain} opacity-50 uppercase tracking-widest mb-1`}>{activeExperiment.categoryLabel}</p>
              <p className={`text-sm font-black ${theme.textMain} leading-tight`}>Avoiding: {activeExperiment.trigger}</p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-black ${theme.primaryText}`}>{experimentResults?.complianceRate || 0}%</p>
              <p className={`text-[9px] font-bold ${theme.textMain} opacity-40 uppercase tracking-widest`}>Success Rate</p>
            </div>
          </div>
          
          <div className={`p-3 rounded-xl ${theme.inputBg}`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-[10px] font-bold ${theme.textMain} opacity-60`}>Progress</span>
              <span className={`text-[10px] font-bold ${theme.textMain}`}>Day {experimentResults?.daysElapsed || 0} of {activeExperiment.durationDays}</span>
            </div>
            <div className={`h-2 rounded-full bg-black/10 overflow-hidden`}>
              <div 
                className={`h-full ${theme.primary} transition-all duration-700`}
                style={{ width: `${Math.min(100, ((experimentResults?.daysElapsed || 0) / activeExperiment.durationDays) * 100)}%` }}
              />
            </div>
          </div>

          {experimentResults?.improvementText && (
            <div className={`p-3 rounded-xl ${experimentResults.improvement > 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
              <p className={`text-xs font-bold ${experimentResults.improvement > 0 ? 'text-emerald-700' : 'text-amber-700'} leading-tight`}>
                {experimentResults.improvementText}
              </p>
            </div>
          )}

          {experimentResults?.sampleSizeWarning && (
            <p className={`text-[10px] ${theme.textMain} opacity-50 italic text-center`}>
              ⚠️ {experimentResults.sampleSizeWarning}
            </p>
          )}

          <p className={`text-[10px] ${theme.textMain} opacity-60 leading-tight`}>
            {experimentResults?.totalMeals || 0} meals logged · {experimentResults?.compliantMealsCount || 0} avoided trigger · {experimentResults?.compliantBadRate || 0}% felt unwell
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl ${theme.inputBg} flex-shrink-0`}>
              <img src={topTrigger.rate >= 60 ? FEELINGS.sick.icon : FEELINGS.okay.icon} alt="" className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${theme.inputBg} ${theme.textMain} opacity-60 uppercase tracking-widest`}>
                  {topTrigger.categoryLabel}
                </span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${topTrigger.confidence >= 80 ? 'bg-emerald-100 text-emerald-700' : topTrigger.confidence >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                  {topTrigger.confidence}% confidence
                </span>
              </div>
              <p className={`text-sm font-black ${theme.textMain} mb-1.5 leading-tight`}>
                {topTrigger.name.charAt(0).toUpperCase() + topTrigger.name.slice(1)}
              </p>
              <p className={`text-xs ${theme.textMain} opacity-70 leading-snug`}>
                {topTrigger.description}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => onStartExperiment(topTrigger)}
            className={`w-full py-3 rounded-xl ${theme.primary} text-white text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-md`}
          >
            Test This Pattern (7 Days)
          </button>
          
          <p className={`text-[10px] ${theme.textMain} opacity-40 text-center italic`}>
            We'll track if avoiding this helps you feel better
          </p>
        </div>
      )}
    </Widget>
  );
};

export const WellnessTrends = ({ entries, theme }) => {
  const [activeBar, setActiveBar] = useState(null);

  const stats = useMemo(() => {
    const categories = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
    const data = { 
      Breakfast: { total: 0, issues: 0, feelings: { good: 0, okay: 0, sick: 0, bloated: 0 }, calories: 0 },
      Lunch: { total: 0, issues: 0, feelings: { good: 0, okay: 0, sick: 0, bloated: 0 }, calories: 0 },
      Dinner: { total: 0, issues: 0, feelings: { good: 0, okay: 0, sick: 0, bloated: 0 }, calories: 0 },
      Snack: { total: 0, issues: 0, feelings: { good: 0, okay: 0, sick: 0, bloated: 0 }, calories: 0 }
    };
    
    let totalIssues = 0;

    entries.forEach(entry => {
      const type = categories.find(c => c.toLowerCase() === (entry.type || '').toLowerCase());
      if (type) {
        data[type].total++;
        data[type].calories += (entry.calories || 0);
        const feeling = entry.feeling || 'good';
        if (data[type].feelings[feeling] !== undefined) data[type].feelings[feeling]++;
        if (!entry.finished || feeling === 'sick' || feeling === 'bloated') {
          data[type].issues++;
          totalIssues++;
        }
      }
    });

    const maxVal = Math.max(...Object.values(data).map(d => d.total), 4);
    
    return { data, maxVal, totalIssues, categories };
  }, [entries]);

  return (
    <Widget title="Wellness Trends" icon={BarChart3} subtitle="How you're feeling" theme={theme}>
      <div className="flex items-end justify-between gap-4 h-32 relative">
        {stats.categories.map(cat => {
          const { total, issues, feelings, calories } = stats.data[cat];
          const totalHeight = (total / stats.maxVal) * 100;
          const issueHeight = total > 0 ? (issues / total) * 100 : 0;
          const isActive = activeBar === cat;
          
          return (
            <div key={cat} className="flex-1 flex flex-col items-center gap-2 relative">
              {/* Tooltip */}
              {isActive && total > 0 && (
                <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 ${theme.card} rounded-xl shadow-2xl p-3 z-50 min-w-[140px] border ${theme.border} pointer-events-none`}>
                  <p className={`text-xs font-black ${theme.textMain} mb-1.5`}>{cat}</p>
                  <div className="space-y-1">
                    <p className={`text-[10px] ${theme.textMain} opacity-70`}><span className="font-bold">{total}</span> meals · <span className="font-bold">{calories}</span> kcal</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {Object.entries(feelings).map(([key, count]) => {
                        if (count === 0) return null;
                        const f = FEELINGS[key];
                        return <span key={key} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${f.softColor} flex items-center gap-1`}><img src={f.icon} alt={f.shortLabel} className="w-3 h-3" /> {count}</span>;
                      })}
                    </div>
                    {issues > 0 && <p className="text-[9px] font-bold text-rose-500 mt-1">{issues} issue{issues > 1 ? 's' : ''} flagged</p>}
                  </div>
                  <div className={`absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${theme.card} border-r border-b ${theme.border} -mt-1`}></div>
                </div>
              )}
              <div 
                className={`w-full relative rounded-xl overflow-hidden bg-black/5 h-full flex items-end cursor-pointer transition-all ${isActive ? 'ring-2 ring-offset-1 ring-black/10' : ''}`}
                onClick={() => setActiveBar(isActive ? null : cat)}
                onMouseEnter={() => setActiveBar(cat)}
                onMouseLeave={() => setActiveBar(null)}
              >
                <div className="absolute bottom-0 w-full bg-transparent flex items-end justify-center h-full">
                    <div 
                      className={`w-full ${theme.secondary} absolute bottom-0 transition-all duration-700 ease-out rounded-t-sm ${isActive ? 'opacity-80' : 'opacity-50'}`}
                      style={{ height: `${totalHeight}%` }}
                    >
                        <div 
                          className="w-full bg-rose-500 absolute bottom-0 transition-all duration-700 ease-out opacity-80"
                          style={{ height: `${issueHeight}%` }}
                        />
                    </div>
                </div>
              </div>
              <div className="text-center">
                <span className={`text-[10px] font-bold uppercase tracking-wide block mb-0.5 ${theme.textMain} ${isActive ? 'opacity-100' : 'opacity-60'} theme-transition transition-opacity`}>
                  {cat}
                </span>
                <div className={`flex justify-center ${isActive ? 'opacity-70' : 'opacity-40'} ${theme.textMain} theme-transition transition-opacity`}>
                   <img 
                      src={cat === 'Breakfast' ? '/breakfast.svg' : 
                           cat === 'Lunch' ? '/lunch.svg' : 
                           cat === 'Dinner' ? '/dinner.svg' : 
                           '/snack.svg'} 
                      alt={cat}
                      className="w-3 h-3"
                   />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Widget>
  );
};
