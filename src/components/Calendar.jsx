import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Activity, Flame, Apple } from 'lucide-react';

export const CustomCalendar = ({ selectedDate, entries = [], onSelectDate, onClose, theme }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [hoveredDay, setHoveredDay] = useState(null);

  // Pre-calculate entry map for performance
  const entryMap = useMemo(() => {
    const map = {};
    entries.forEach(e => {
        const d = new Date(e.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (!map[key]) map[key] = { items: [], calories: 0 };
        map[key].items.push(e);
        map[key].calories += (Number(e.calories) || 0);
    });
    return map;
  }, [entries]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const handleDayClick = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onSelectDate(newDate);
    onClose();
  };

  const isSelected = (day) => {
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  return (
    <div className={`p-6 ${theme.card} rounded-[2rem] shadow-2xl w-full max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-300 ${theme.textMain} theme-transition relative`}>
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className={`p-2 hover:bg-black/5 rounded-xl transition-all ${theme.textMain} opacity-60 hover:opacity-100`}>
          <ChevronLeft size={20} />
        </button>
        <h3 className={`text-lg font-black tracking-tight ${theme.primaryText}`}>{monthName}</h3>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className={`p-2 hover:bg-black/5 rounded-xl transition-all ${theme.textMain} opacity-60 hover:opacity-100`}>
          <ChevronRight size={20} />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-4">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={`${d}-${i}`} className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1;
          const selected = isSelected(day);
          const key = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}-${day}`;
          const dayData = entryMap[key];
          
          return (
            <div key={day} className="relative group">
                <button
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => setHoveredDay(key)}
                onMouseLeave={() => setHoveredDay(null)}
                className={`
                    relative z-10 h-11 w-11 rounded-2xl flex flex-col items-center justify-center text-sm font-black transition-all duration-300
                    ${selected 
                        ? `${theme.primary} text-white shadow-lg shadow-emerald-500/20 scale-110` 
                        : `hover:scale-125 hover:z-20 ${theme.inputBg} hover:shadow-xl hover:${theme.primaryText}`
                    }
                `}
                >
                {day}
                {dayData && !selected && (
                    <div className={`absolute bottom-1 w-1 h-1 rounded-full ${theme.primary} opacity-60`}></div>
                )}
                </button>

                {/* Day Preview Tooltip */}
                {hoveredDay === key && dayData && (
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-4 ${theme.card} rounded-3xl shadow-2xl z-[60] animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-none`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">Day Preview</span>
                            <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                                <Activity size={12} className="text-emerald-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-2xl font-black leading-none">{dayData.calories}<span className="text-[10px] font-bold opacity-30 ml-1">KCAL</span></p>
                            <div className="h-px w-full bg-black/5"></div>
                            <div className="flex items-center gap-2">
                                <div className="p-1 bg-black/5 rounded-md">
                                    <Apple size={10} className="opacity-50" />
                                </div>
                                <p className="text-[10px] font-bold opacity-60">{dayData.items.length} Meals Logged</p>
                            </div>
                        </div>
                        {/* Little triangle arrow */}
                        <div className={`absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-${theme.card.replace('bg-', '')}`}></div>
                    </div>
                )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 pt-6 border-t border-black/5">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-black opacity-40 uppercase tracking-wider">Active Day</span>
            </div>
            <p className="text-[10px] font-bold opacity-30 italic">Tap to view details</p>
        </div>
      </div>
    </div>
  );
};
