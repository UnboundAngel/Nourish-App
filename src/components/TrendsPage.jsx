import React, { useMemo, useState, useCallback } from 'react';
import { 
  TrendingUp, TrendingDown, Minus, BarChart3, PieChart, Activity,
  Droplet, Flame, Target, Heart, Coffee,
  ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { FEELINGS } from '../utils/feelings';

const MEAL_ICON_PATHS = { Breakfast: '/breakfast.svg', Lunch: '/lunch.svg', Dinner: '/dinner.svg', Snack: '/snack.svg' };

function getWeekRange(weekOffset) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek - (weekOffset * 7));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return { start: startOfWeek, end: endOfWeek };
}

function formatDateShort(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TrendsPage({ entries, theme, dailyTargets, onClose, insights }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeDay, setActiveDay] = useState(null);
  const [dayTooltip, setDayTooltip] = useState(null);

  const weekRange = useMemo(() => getWeekRange(weekOffset), [weekOffset]);

  const getTooltipPosition = useCallback((clientX, clientY) => {
    const pad = 12;
    const tipW = 220;
    const tipH = 92;
    const x = Math.min(Math.max(clientX, pad + tipW / 2), window.innerWidth - pad - tipW / 2);
    const y = Math.min(Math.max(clientY, pad + tipH), window.innerHeight - pad);
    return { x, y };
  }, []);

  const weekData = useMemo(() => {
    const startTs = weekRange.start.getTime();
    const endTs = weekRange.end.getTime();
    const weekEntries = (entries || []).filter(e => e.createdAt >= startTs && e.createdAt <= endTs);

    // Per-day breakdown
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekRange.start);
      d.setDate(d.getDate() + i);
      const dayStart = new Date(d).setHours(0, 0, 0, 0);
      const dayEnd = new Date(d).setHours(23, 59, 59, 999);
      const dayEntries = weekEntries.filter(e => e.createdAt >= dayStart && e.createdAt <= dayEnd);
      
      const totals = dayEntries.reduce((acc, e) => ({
        calories: acc.calories + (e.calories || 0),
        protein: acc.protein + (e.protein || 0),
        carbs: acc.carbs + (e.carbs || 0),
        fats: acc.fats + (e.fats || 0),
      }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

      const feelings = { good: 0, okay: 0, sick: 0, bloated: 0 };
      dayEntries.forEach(e => {
        const f = e.feeling || 'good';
        if (feelings[f] !== undefined) feelings[f]++;
      });

      days.push({
        date: new Date(d),
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        entries: dayEntries,
        totals,
        feelings,
        mealCount: dayEntries.length,
      });
    }

    // Week totals
    const weekTotals = weekEntries.reduce((acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.protein || 0),
      carbs: acc.carbs + (e.carbs || 0),
      fats: acc.fats + (e.fats || 0),
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    const weekFeelings = { good: 0, okay: 0, sick: 0, bloated: 0 };
    weekEntries.forEach(e => {
      const f = e.feeling || 'good';
      if (weekFeelings[f] !== undefined) weekFeelings[f]++;
    });

    // Meal type breakdown
    const mealTypes = { Breakfast: 0, Lunch: 0, Dinner: 0, Snack: 0 };
    weekEntries.forEach(e => {
      const t = e.type || 'Snack';
      if (mealTypes[t] !== undefined) mealTypes[t]++;
    });

    // Daily averages
    const daysWithMeals = days.filter(d => d.mealCount > 0).length || 1;
    const avgCalories = Math.round(weekTotals.calories / daysWithMeals);
    const avgProtein = Math.round(weekTotals.protein / daysWithMeals);
    const avgCarbs = Math.round(weekTotals.carbs / daysWithMeals);
    const avgFats = Math.round(weekTotals.fats / daysWithMeals);

    // Goal adherence
    const daysOnTarget = days.filter(d => 
      d.mealCount > 0 && 
      d.totals.calories >= dailyTargets.calories * 0.8 && 
      d.totals.calories <= dailyTargets.calories * 1.2
    ).length;

    return {
      days,
      weekTotals,
      weekFeelings,
      mealTypes,
      totalMeals: weekEntries.length,
      avgCalories, avgProtein, avgCarbs, avgFats,
      daysOnTarget,
      daysWithMeals,
    };
  }, [entries, weekRange, dailyTargets]);

  const maxDayCal = Math.max(...weekData.days.map(d => d.totals.calories), dailyTargets.calories);

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className={`absolute inset-0 ${theme.bg}`}></div>
      
      <div className="relative z-10 flex flex-col h-full overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className={`sticky top-0 z-20 ${theme.card} border-b ${theme.border} backdrop-blur-xl px-4 md:px-8 py-4`}>
          <div className="max-w-[1200px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${theme.primary} text-white`}>
                <BarChart3 size={20} />
              </div>
              <div>
                <h1 className={`text-xl font-black ${theme.textMain} tracking-tight`}>Trends & Insights</h1>
                <p className={`text-xs ${theme.textMain} opacity-50 font-medium`}>Your nutrition analytics</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className={`p-2.5 rounded-xl ${theme.inputBg} ${theme.textMain} hover:bg-black/10 active:scale-95 transition-all`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto w-full px-4 md:px-8 py-6 space-y-6">
          
          {/* Tabs */}
          <div className="flex gap-2 p-1 rounded-2xl bg-black/5 w-fit mx-auto md:mx-0">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? theme.primary + ' text-white shadow-md' : 'text-black/40 hover:text-black/60'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('patterns')}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'patterns' ? theme.primary + ' text-white shadow-md' : 'text-black/40 hover:text-black/60'}`}
            >
              Patterns
            </button>
          </div>

          {activeTab === 'overview' ? (
            <>
              {/* Week Navigator */}
              <div className={`flex items-center justify-between ${theme.card} rounded-2xl p-4 shadow-sm`}>
                <button 
                  onClick={() => setWeekOffset(w => w + 1)}
                  className={`p-2 rounded-xl ${theme.inputBg} hover:bg-black/10 active:scale-95 transition-all ${theme.textMain}`}
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="text-center">
                  <p className={`text-sm font-black ${theme.textMain}`}>
                    {formatDateShort(weekRange.start)} — {formatDateShort(weekRange.end)}
                  </p>
                  <p className={`text-[10px] font-bold ${theme.textMain} opacity-40 uppercase tracking-widest`}>
                    {weekOffset === 0 ? 'This Week' : weekOffset === 1 ? 'Last Week' : `${weekOffset} Weeks Ago`}
                  </p>
                </div>
                <button 
                  onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
                  disabled={weekOffset === 0}
                  className={`p-2 rounded-xl ${theme.inputBg} hover:bg-black/10 active:scale-95 transition-all ${theme.textMain} ${weekOffset === 0 ? 'opacity-20 pointer-events-none' : ''}`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <SummaryCard theme={theme} label="Total Meals" value={weekData.totalMeals} icon={Coffee} />
                <SummaryCard theme={theme} label="Avg Calories" value={weekData.avgCalories} unit="kcal" icon={Flame} />
                <SummaryCard theme={theme} label="Days on Target" value={`${weekData.daysOnTarget}/7`} icon={Target} accent />
                <SummaryCard theme={theme} label="Days Active" value={`${weekData.daysWithMeals}/7`} icon={Activity} />
              </div>

              {/* Calorie Bar Chart */}
              <div className={`${theme.card} rounded-3xl shadow-sm overflow-hidden`}>
                <div className={`px-5 py-4 flex justify-between items-center`}>
                  <div className="flex items-center gap-2">
                    <Flame size={18} className={theme.accent} />
                    <h3 className={`font-bold ${theme.primaryText} text-sm tracking-wide uppercase`}>Daily Calories</h3>
                  </div>
                  <span className={`text-[10px] font-bold ${theme.textMain} opacity-40`}>Goal: {dailyTargets.calories} kcal</span>
                </div>
                <div className="px-5 pb-5">
                  <div className="flex items-end gap-2 h-40">
                    {weekData.days.map((day, i) => {
                      const height = maxDayCal > 0 ? (day.totals.calories / maxDayCal) * 100 : 0;
                      const goalLine = (dailyTargets.calories / maxDayCal) * 100;
                      const isToday = day.date.toDateString() === new Date().toDateString();
                      const isActive = activeDay === i;
                      const onTarget = day.totals.calories >= dailyTargets.calories * 0.8 && day.totals.calories <= dailyTargets.calories * 1.2;
                      
                      return (
                        <div 
                          key={i} 
                          className="flex-1 flex flex-col items-center gap-1 h-full justify-end relative cursor-pointer"
                          onMouseEnter={(e) => {
                            setActiveDay(i);
                            if (day.mealCount > 0) {
                              const pos = getTooltipPosition(e.clientX, e.clientY);
                              setDayTooltip({ dayIndex: i, x: pos.x, y: pos.y });
                            }
                          }}
                          onMouseMove={(e) => {
                            if (activeDay !== i || day.mealCount === 0) return;
                            const pos = getTooltipPosition(e.clientX, e.clientY);
                            setDayTooltip({ dayIndex: i, x: pos.x, y: pos.y });
                          }}
                          onMouseLeave={() => {
                            setActiveDay(null);
                            setDayTooltip(null);
                          }}
                          onClick={() => setActiveDay(isActive ? null : i)}
                        >
                          {/* Goal line */}
                          <div 
                            className="absolute w-full border-t-2 border-dashed border-black/10 pointer-events-none"
                            style={{ bottom: `${goalLine}%` }}
                          ></div>
                          
                          {/* Bar */}
                          <div 
                            className={`w-full rounded-t-lg transition-all duration-500 ${
                              day.mealCount === 0 ? 'bg-black/5' :
                              onTarget ? theme.primary + ' opacity-70' :
                              day.totals.calories > dailyTargets.calories * 1.2 ? 'bg-rose-400 opacity-70' :
                              'bg-amber-400 opacity-70'
                            } ${isActive ? '!opacity-100 ring-2 ring-offset-1 ring-black/10' : ''}`}
                            style={{ height: `${Math.max(height, day.mealCount > 0 ? 4 : 1)}%` }}
                          ></div>
                          
                          <span className={`text-[9px] font-black uppercase ${isToday ? theme.primaryText : `${theme.textMain} opacity-40`}`}>
                            {day.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Fixed tooltip (prevents clipping inside overflow-hidden cards) */}
                  {dayTooltip && activeDay !== null && weekData.days[activeDay]?.mealCount > 0 && (
                    <div
                      className={`${theme.card} rounded-xl shadow-2xl p-3 z-[9999] min-w-[220px] max-w-[260px] border ${theme.border} pointer-events-none`}
                      style={{
                        position: 'fixed',
                        left: dayTooltip.x,
                        top: dayTooltip.y,
                        transform: 'translate(-50%, calc(-100% - 12px))',
                      }}
                    >
                      <p className={`text-xs font-black ${theme.textMain}`}>
                        {weekData.days[activeDay].date.toLocaleDateString('en-US', { weekday: 'long' })}
                      </p>
                      <div className={`text-[10px] ${theme.textMain} opacity-70 space-y-0.5 mt-1`}>
                        <p><span className="font-bold">{weekData.days[activeDay].totals.calories}</span> kcal · <span className="font-bold">{weekData.days[activeDay].mealCount}</span> meals</p>
                        <p>P: {weekData.days[activeDay].totals.protein}g · C: {weekData.days[activeDay].totals.carbs}g · F: {weekData.days[activeDay].totals.fats}g</p>
                      </div>
                      <div className={`absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${theme.card} border-r border-b ${theme.border} -mt-1`}></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Macro Averages + Feeling Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                
                {/* Macro Averages */}
                <div className={`${theme.card} rounded-3xl shadow-sm overflow-hidden`}>
                  <div className="px-5 py-4 flex items-center gap-2">
                    <PieChart size={18} className={theme.accent} />
                    <h3 className={`font-bold ${theme.primaryText} text-sm tracking-wide uppercase`}>Weekly Macro Avg</h3>
                  </div>
                  <div className="px-5 pb-5 space-y-3">
                    <MacroBar label="Calories" current={weekData.avgCalories} target={dailyTargets.calories} unit="kcal" color="bg-emerald-500" theme={theme} />
                    <MacroBar label="Protein" current={weekData.avgProtein} target={dailyTargets.protein} unit="g" color="bg-green-500" theme={theme} />
                    <MacroBar label="Carbs" current={weekData.avgCarbs} target={dailyTargets.carbs} unit="g" color="bg-orange-500" theme={theme} />
                    <MacroBar label="Fats" current={weekData.avgFats} target={dailyTargets.fats} unit="g" color="bg-blue-500" theme={theme} />
                  </div>
                </div>

                {/* Feeling Breakdown */}
                <div className={`${theme.card} rounded-3xl shadow-sm overflow-hidden`}>
                  <div className="px-5 py-4 flex items-center gap-2">
                    <Heart size={18} className={theme.accent} />
                    <h3 className={`font-bold ${theme.primaryText} text-sm tracking-wide uppercase`}>How You Felt</h3>
                  </div>
                  <div className="px-5 pb-5">
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(weekData.weekFeelings).map(([feeling, count]) => {
                        const info = FEELINGS[feeling];
                        if (!info) return null;
                        const pct = weekData.totalMeals > 0 ? Math.round((count / weekData.totalMeals) * 100) : 0;
                        return (
                          <div key={feeling} className={`p-3 rounded-2xl ${theme.inputBg} flex items-center gap-3`}>
                            <img src={info.icon} alt={info.shortLabel} className="w-8 h-8" />
                            <div>
                              <p className={`text-sm font-black ${theme.textMain}`}>{count}</p>
                              <p className={`text-[10px] font-bold ${theme.textMain} opacity-50`}>{info.shortLabel} · {pct}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Feeling trend bar */}
                    {weekData.totalMeals > 0 && (
                      <div className="mt-4 h-3 rounded-full overflow-hidden flex">
                        {Object.entries(weekData.weekFeelings).map(([feeling, count]) => {
                          const pct = (count / weekData.totalMeals) * 100;
                          if (pct === 0) return null;
                          const colors = { good: 'bg-emerald-400', okay: 'bg-amber-400', sick: 'bg-rose-400', bloated: 'bg-purple-400' };
                          return <div key={feeling} className={`${colors[feeling]} transition-all duration-500`} style={{ width: `${pct}%` }}></div>;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Meal Type Distribution */}
              <div className={`${theme.card} rounded-3xl shadow-sm overflow-hidden`}>
                <div className="px-5 py-4 flex items-center gap-2">
                  <Activity size={18} className={theme.accent} />
                  <h3 className={`font-bold ${theme.primaryText} text-sm tracking-wide uppercase`}>Meal Distribution</h3>
                </div>
                <div className="px-5 pb-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(weekData.mealTypes).map(([type, count]) => {
                      const iconPath = MEAL_ICON_PATHS[type] || '/snack.svg';
                      const pct = weekData.totalMeals > 0 ? Math.round((count / weekData.totalMeals) * 100) : 0;
                      return (
                        <div key={type} className={`p-4 rounded-2xl ${theme.inputBg} text-center`}>
                          <img src={iconPath} alt={type} className="w-6 h-6 mx-auto mb-2 opacity-50" />
                          <p className={`text-2xl font-black ${theme.textMain}`}>{count}</p>
                          <p className={`text-[10px] font-bold ${theme.textMain} opacity-40 uppercase tracking-wider`}>{type} · {pct}%</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Weekly Insight Text */}
              <div className={`${theme.card} rounded-3xl shadow-sm p-5 md:p-6`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${theme.primary} text-white flex-shrink-0`}>
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <h3 className={`font-black text-sm ${theme.textMain} mb-2`}>Weekly Insight</h3>
                    <p className={`text-sm ${theme.textMain} opacity-70 leading-relaxed`}>
                      {generateInsight(weekData, dailyTargets)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">

              {/* Baseline Context Banner */}
              {insights.baselineRate !== undefined && insights.totalMealsAnalyzed > 0 && (
                <div className={`${theme.card} rounded-2xl p-4 shadow-sm flex items-center gap-4`}>
                  <div className={`w-10 h-10 rounded-xl ${theme.inputBg} flex items-center justify-center flex-shrink-0`}>
                    <BarChart3 size={18} className={theme.accent} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-bold ${theme.textMain}`}>
                      Analyzed <span className="font-black">{insights.totalMealsAnalyzed}</span> meals — your overall issue rate is <span className={`font-black ${insights.baselineRate > 30 ? 'text-rose-500' : insights.baselineRate > 15 ? 'text-amber-500' : 'text-emerald-500'}`}>{insights.baselineRate}%</span>
                    </p>
                    <p className={`text-[10px] ${theme.textMain} opacity-50 mt-0.5`}>Patterns shown are significantly above this baseline</p>
                  </div>
                </div>
              )}

              {/* Active Experiment Progress */}
              {insights.activeExperiment && (
                <div className={`${theme.card} rounded-3xl p-6 border-2 ${theme.primary.replace('bg-', 'border-')} shadow-lg`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className={`text-xl font-black ${theme.textMain} mb-1`}>Active Experiment</h3>
                      <p className={`text-sm font-medium ${theme.textMain} opacity-60`}>Avoiding: {insights.activeExperiment.trigger}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-black ${theme.primaryText}`}>{insights.experimentResults?.complianceRate || 0}%</p>
                      <p className={`text-[10px] font-bold ${theme.textMain} opacity-40 uppercase tracking-widest`}>Success Rate</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className={`p-3 rounded-xl ${theme.inputBg} mb-4`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[10px] font-bold ${theme.textMain} opacity-60`}>Progress</span>
                      <span className={`text-[10px] font-bold ${theme.textMain}`}>Day {insights.experimentResults?.daysElapsed || 0} of 7</span>
                    </div>
                    <div className="h-2 rounded-full bg-black/10 overflow-hidden">
                      <div className={`h-full ${theme.primary} transition-all duration-700`} style={{ width: `${Math.min(100, ((insights.experimentResults?.daysElapsed || 0) / 7) * 100)}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className={`p-3 rounded-2xl ${theme.inputBg} text-center`}>
                      <p className={`text-lg font-black ${theme.textMain}`}>{insights.experimentResults?.totalMeals || 0}</p>
                      <p className={`text-[9px] font-bold ${theme.textMain} opacity-40 uppercase tracking-widest`}>Meals</p>
                    </div>
                    <div className={`p-3 rounded-2xl ${theme.inputBg} text-center`}>
                      <p className={`text-lg font-black text-rose-500`}>{insights.experimentResults?.compliantBadRate || 0}%</p>
                      <p className={`text-[9px] font-bold ${theme.textMain} opacity-40 uppercase tracking-widest`}>Issue Rate</p>
                    </div>
                    <div className={`p-3 rounded-2xl ${theme.inputBg} text-center`}>
                      <p className={`text-lg font-black ${insights.experimentResults?.improvement > 0 ? 'text-emerald-500' : 'text-amber-500'}`}>{insights.experimentResults?.improvement > 0 ? '+' : ''}{insights.experimentResults?.improvement || 0}%</p>
                      <p className={`text-[9px] font-bold ${theme.textMain} opacity-40 uppercase tracking-widest`}>Change</p>
                    </div>
                  </div>

                  {insights.experimentResults?.improvementText && (
                    <div className={`p-3 rounded-xl mb-4 ${insights.experimentResults.improvement > 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                      <p className={`text-xs font-bold ${insights.experimentResults.improvement > 0 ? 'text-emerald-700' : 'text-amber-700'} leading-tight`}>
                        {insights.experimentResults.improvementText}
                      </p>
                    </div>
                  )}

                  {insights.experimentResults?.sampleSizeWarning && (
                    <p className={`text-[10px] ${theme.textMain} opacity-50 italic text-center mb-4`}>
                      {insights.experimentResults.sampleSizeWarning}
                    </p>
                  )}

                  <button 
                    onClick={insights.stopExperiment}
                    className="w-full py-3 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Complete Experiment
                  </button>
                </div>
              )}

              {/* Detected Patterns */}
              <div className={`${theme.card} rounded-3xl overflow-hidden`}>
                <div className="px-5 py-4 flex items-center gap-2 border-b border-black/5">
                  <TrendingDown size={18} className="text-rose-500" />
                  <div className="flex-1">
                    <h3 className={`font-bold ${theme.primaryText} text-sm tracking-wide uppercase`}>Detected Patterns</h3>
                    <p className={`text-[10px] ${theme.textMain} opacity-50 mt-0.5`}>Triggers significantly above your {insights.baselineRate || 0}% baseline</p>
                  </div>
                </div>
                <div className="divide-y divide-black/5">
                  {insights.patterns.length > 0 ? insights.patterns.map((pattern, i) => (
                    <PatternCard key={i} pattern={pattern} theme={theme} insights={insights} />
                  )) : (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4">
                        <TrendingDown size={32} className="opacity-20" />
                      </div>
                      <p className={`text-sm font-bold ${theme.textMain} mb-1`}>No patterns detected yet</p>
                      <p className={`text-xs ${theme.textMain} opacity-50 max-w-sm mx-auto leading-relaxed`}>
                        Keep tracking your meals and how you feel. We need at least 10 meals with feelings logged to start finding patterns.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function PatternCard({ pattern, theme, insights }) {
  const [expanded, setExpanded] = React.useState(false);
  const hasExamples = pattern.examples && pattern.examples.length > 0;

  return (
    <div className="px-6 py-5 hover:bg-black/[0.02] transition-colors">
      <div className="flex items-start gap-4 mb-3">
        <div className={`w-12 h-12 rounded-2xl ${theme.inputBg} flex items-center justify-center flex-shrink-0`}>
          <img src={pattern.rate >= 60 ? FEELINGS.sick.icon : FEELINGS.okay.icon} alt="" className="w-8 h-8" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${theme.inputBg} ${theme.textMain} opacity-60 uppercase tracking-widest`}>
              {pattern.categoryLabel}
            </span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${pattern.confidence >= 80 ? 'bg-emerald-100 text-emerald-700' : pattern.confidence >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
              {pattern.confidence}% confidence
            </span>
            {pattern.lift >= 2 && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                {pattern.lift}x baseline
              </span>
            )}
          </div>
          <p className={`text-base font-black ${theme.textMain} mb-1.5 leading-tight`}>
            {pattern.name.charAt(0).toUpperCase() + pattern.name.slice(1)}
          </p>
          <p className={`text-xs ${theme.textMain} opacity-70 leading-relaxed`}>
            {pattern.description}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-black text-rose-500">{pattern.rate}%</p>
          <p className={`text-[9px] font-bold ${theme.textMain} opacity-40 uppercase tracking-widest`}>Issue Rate</p>
        </div>
      </div>

      {/* Suggestion */}
      {pattern.suggestion && (
        <div className={`p-3 rounded-xl ${theme.inputBg} mb-3`}>
          <p className={`text-xs ${theme.textMain} opacity-80 leading-relaxed`}>
            <span className="font-black">Suggestion: </span>{pattern.suggestion}
          </p>
        </div>
      )}

      {/* Meal examples timeline */}
      {hasExamples && (
        <div className="mb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className={`text-[10px] font-bold ${theme.primaryText} hover:underline mb-2 flex items-center gap-1`}
          >
            {expanded ? 'Hide' : 'View'} {pattern.examples.length} problem meal{pattern.examples.length > 1 ? 's' : ''}
            <ChevronRight size={12} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
          {expanded && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
              {pattern.examples.map((ex, j) => (
                <div key={j} className={`flex items-center gap-3 p-2.5 rounded-xl ${theme.inputBg}`}>
                  <img src={FEELINGS[ex.feeling]?.icon || FEELINGS.sick.icon} alt="" className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold ${theme.textMain} truncate`}>{ex.name}</p>
                    <p className={`text-[10px] ${theme.textMain} opacity-50`}>
                      {ex.type} · {ex.calories} kcal{ex.time ? ` · ${ex.time}` : ''}
                      {ex.date ? ` · ${new Date(ex.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {!insights.activeExperiment && (
          <button 
            onClick={() => insights.startExperiment(pattern)}
            className={`flex-1 py-2.5 rounded-xl ${theme.primary} text-white text-xs font-black uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-all`}
          >
            Test This (7 Days)
          </button>
        )}
        <button 
          onClick={() => insights.dismissPattern(pattern.name, 'not_helpful')}
          className={`px-4 py-2.5 rounded-xl ${theme.inputBg} text-xs font-bold ${theme.textMain} opacity-40 hover:opacity-70 transition-all`}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ theme, label, value, unit, icon: Icon, accent }) {
  return (
    <div className={`${theme.card} rounded-2xl p-4 shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <Icon size={16} className={`${accent ? theme.primaryText : theme.textMain} opacity-50`} />
      </div>
      <p className={`text-2xl font-black ${accent ? theme.primaryText : theme.textMain}`}>
        {value}{unit && <span className="text-xs font-bold opacity-40 ml-1">{unit}</span>}
      </p>
      <p className={`text-[10px] font-bold ${theme.textMain} opacity-40 uppercase tracking-wider mt-0.5`}>{label}</p>
    </div>
  );
}

function MacroBar({ label, current, target, unit, color, theme }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 150) : 0;
  const onTarget = pct >= 80 && pct <= 120;
  const TrendIcon = pct > 120 ? TrendingUp : pct < 80 ? TrendingDown : Minus;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className={`text-xs font-bold ${theme.textMain}`}>{label}</span>
        <div className="flex items-center gap-1.5">
          <TrendIcon size={12} className={onTarget ? 'text-emerald-500' : pct > 120 ? 'text-rose-500' : 'text-amber-500'} />
          <span className={`text-xs font-black ${theme.textMain}`}>{current}<span className="opacity-40 font-medium">/{target}{unit}</span></span>
        </div>
      </div>
      <div className={`h-2.5 rounded-full ${theme.inputBg} overflow-hidden`}>
        <div 
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        ></div>
      </div>
    </div>
  );
}

function generateInsight(weekData, targets) {
  const parts = [];
  
  if (weekData.totalMeals === 0) {
    return "No meals logged this week yet. Start tracking to see your trends!";
  }

  // Calorie insight
  const calPct = targets.calories > 0 ? Math.round((weekData.avgCalories / targets.calories) * 100) : 0;
  if (calPct >= 90 && calPct <= 110) {
    parts.push(`You averaged ${weekData.avgCalories} kcal/day — right on target!`);
  } else if (calPct < 90) {
    parts.push(`You averaged ${weekData.avgCalories} kcal/day, which is ${100 - calPct}% below your ${targets.calories} kcal goal.`);
  } else {
    parts.push(`You averaged ${weekData.avgCalories} kcal/day, ${calPct - 100}% above your ${targets.calories} kcal goal.`);
  }

  // Consistency
  if (weekData.daysOnTarget >= 5) {
    parts.push("Great consistency — you hit your target most days!");
  } else if (weekData.daysOnTarget >= 3) {
    parts.push(`You were on target ${weekData.daysOnTarget} out of 7 days. Keep building that consistency.`);
  }

  // Feelings
  const totalFeelings = Object.values(weekData.weekFeelings).reduce((a, b) => a + b, 0);
  if (totalFeelings > 0) {
    const goodPct = Math.round((weekData.weekFeelings.good / totalFeelings) * 100);
    const issuePct = Math.round(((weekData.weekFeelings.sick + weekData.weekFeelings.bloated) / totalFeelings) * 100);
    if (goodPct >= 80) {
      parts.push(`You felt good after ${goodPct}% of your meals — keep it up!`);
    } else if (issuePct >= 30) {
      parts.push(`${issuePct}% of meals left you feeling unwell. Consider reviewing those meals for patterns.`);
    }
  }

  return parts.join(' ');
}
