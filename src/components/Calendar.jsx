import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const CustomCalendar = ({ selectedDate, onSelectDate, onClose, theme }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

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
    <div className={`p-4 ${theme.card} rounded-2xl shadow-xl border ${theme.border} w-full max-w-xs mx-auto animate-in fade-in zoom-in-95 duration-200 ${theme.textMain} theme-transition`}>
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className={`p-1 hover:bg-black/10 rounded-full opacity-60 ${theme.textMain.replace('text-', 'text-')} theme-transition`}>
          <ChevronLeft size={20} />
        </button>
        <h3 className={`text-lg font-bold ${theme.primaryText} theme-transition`}>{monthName}</h3>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className={`p-1 hover:bg-black/10 rounded-full opacity-60 ${theme.textMain.replace('text-', 'text-')} theme-transition`}>
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={`${d}-${i}`} className="text-xs font-bold opacity-40 theme-transition">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1;
          const selected = isSelected(day);
          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={`
                h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${selected ? `${theme.primary} text-white shadow-md scale-110` : 'hover:bg-black/5 opacity-80'}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};
