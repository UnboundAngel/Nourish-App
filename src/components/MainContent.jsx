import React from 'react';
import { 
  Leaf, Moon, Trash2, Circle, CheckCircle, 
  Activity, Droplet, Search, X 
} from 'lucide-react';
import { WaterBottle, WellnessTrends, DailyTargets, TriggerFinder } from './Widgets';
import { SortDropdown } from './SortDropdown';
import { formatTime } from '../utils/helpers';
import { MobileStreakCard } from './NourishGarden';
import { getFeeling } from '../utils/feelings';

function HighlightText({ text, query }) {
  if (!query || !text) return text || null;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200/80 text-inherit rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function MainContent({
  theme, currentThemeId,
  dailyWhisper, todaysEntries, todaysTotals,
  waterOz, handleAddWater,
  dailyTargets, setIsTargetsModalOpen,
  searchTerm, setSearchTerm,
  activeTags, setActiveTags,
  allTags, sortBy, setSortBy,
  setEditingId, setNewItem, setIsModalOpen,
  handleDelete, handleToggleFinish,
  use24HourTime,
  dailyStreak, getEntriesForDate, setIsStreakOpen,
  insights,
}) {
  return (
    <div className="max-w-[1200px] mx-auto px-3 py-4 md:p-8 space-y-5 md:space-y-8 pb-24 md:pb-32">
        
        {/* Bento Grid Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            
            {/* 1. Daily Whisper (Hero Card) */}
            <div className={`lg:col-span-2 rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[180px] md:min-h-[240px] transition-all duration-500 ${currentThemeId === 'Dark' ? 'bg-indigo-950 text-white' : `${theme.primary} text-white`} theme-transition group`}>
                {currentThemeId === 'Dark' ? (
                    <div className="absolute -right-10 -top-10 opacity-20 text-yellow-100 group-hover:scale-110 transition-transform duration-1000">
                        <Moon size={240} className="moon-glow" />
                    </div>
                ) : (
                    <Leaf className="absolute -right-10 -top-10 text-white/10 w-64 h-64 group-hover:rotate-12 transition-transform duration-1000" />
                )}

                <div className="relative z-10">
                    <h3 className="font-black text-[10px] opacity-50 uppercase tracking-[0.4em] mb-4">Daily Note</h3>
                    <p className="font-handwritten text-xl md:text-4xl leading-snug max-w-lg theme-transition">
                       {dailyWhisper}
                    </p>
                </div>

                <div className="relative z-10 flex items-center gap-4 md:gap-6 mt-4 md:mt-8">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">Logged</span>
                        <span className="text-2xl font-black">{todaysEntries.length} <span className="text-xs font-bold opacity-60">MEALS</span></span>
                    </div>
                    <div className="w-px h-8 bg-white/20"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">Hydration</span>
                        <span className="text-2xl font-black">{waterOz} <span className="text-xs font-bold opacity-60">OZ</span></span>
                    </div>
                </div>
            </div>

            {/* 2. Quick Hydration Toggle */}
            <div className={`rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 ${theme.card} ${theme.textMain} theme-transition shadow-xl flex flex-col items-center justify-between`}>
                <div className="w-full flex justify-between items-center mb-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Hydration</p>
                    <Droplet size={20} className="text-blue-500" />
                </div>
                
                <WaterBottle currentOz={waterOz} goalOz={80} onAdd={handleAddWater} />
                
                <div className="w-full mt-8 space-y-4">
                    <div className="flex justify-between items-end">
                        <span className="text-3xl font-black">{waterOz}<span className="text-sm font-bold opacity-30 ml-1">oz</span></span>
                        <span className="text-xs font-bold opacity-40">Goal: 80oz</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[8, 16, 24].map(oz => (
                            <button key={oz} onClick={() => handleAddWater(oz)} className={`py-2 rounded-xl ${theme.inputBg} text-[10px] font-black hover:scale-105 active:scale-95 transition-all`}>+{oz}</button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Mobile Streak Card */}
        <div className="md:hidden">
            <MobileStreakCard 
                theme={theme} 
                dailyStreak={dailyStreak} 
                getEntriesForDate={getEntriesForDate}
                onClick={() => setIsStreakOpen(true)}
            />
        </div>

        {/* Stats & Trends Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            <DailyTargets 
                totals={todaysTotals} 
                targets={dailyTargets} 
                theme={theme} 
                onEdit={() => setIsTargetsModalOpen(true)}
            />
            <WellnessTrends entries={todaysEntries} theme={theme} />
            {(insights.topTrigger || insights.activeExperiment) && (
              <div className="lg:col-span-2">
                <TriggerFinder 
                    topTrigger={insights.topTrigger}
                    activeExperiment={insights.activeExperiment}
                    experimentResults={insights.experimentResults}
                    theme={theme}
                    onStartExperiment={insights.startExperiment}
                    onStopExperiment={insights.stopExperiment}
                />
              </div>
            )}
        </div>

        {/* --- 3. Meal Entries Section --- */}
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${theme.primary} text-white`}>
                        <Activity size={18} />
                    </div>
                    <h3 className={`text-xl font-black ${theme.textMain} tracking-tight theme-transition`}>
                        Journal Entries
                    </h3>
                </div>
                <div className="flex gap-2">
                    <SortDropdown value={sortBy} onChange={setSortBy} theme={theme} />
                </div>
            </div>
          
            {/* Search & Tags Bar */}
            <div className={`p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] ${theme.card} space-y-4 md:space-y-6 shadow-xl theme-transition`}>
                <div className="relative group">
                    {searchTerm && (
                        <div className={`absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider z-10 ${todaysEntries.length > 0 ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                            {todaysEntries.length} {todaysEntries.length === 1 ? 'result' : 'results'}
                        </div>
                    )}
                    <input
                        type="text"
                        placeholder="Search meals, notes, tags..."
                        className={`w-full p-3.5 md:p-5 pl-11 md:pl-13 ${searchTerm ? 'pr-10' : 'pr-4'} ${theme.inputBg} rounded-xl md:rounded-2xl font-medium outline-none text-sm md:text-base placeholder:opacity-30 placeholder:font-medium ${theme.textMain} theme-transition shadow-inner transition-all duration-300 focus:shadow-md focus:ring-2 focus:ring-emerald-500/20`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className={`absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 transition-opacity duration-200 ${searchTerm ? 'opacity-60' : 'opacity-25 group-focus-within:opacity-50'}`}>
                        <Search size={18} strokeWidth={2.5} />
                    </div>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className={`absolute right-3 md:right-4 top-1/2 -translate-y-1/2 p-1 rounded-full ${theme.inputBg} opacity-40 hover:opacity-100 active:scale-90 transition-all`}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                
                {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => {
                                    setActiveTags(prev =>
                                        prev.includes(tag)
                                            ? prev.filter(t => t !== tag)
                                            : [...prev, tag]
                                    );
                                }}
                                className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${
                                    activeTags.includes(tag)
                                        ? `${theme.primary} text-white shadow-md`
                                        : `${theme.inputBg} ${theme.textMain} opacity-40 hover:opacity-100 hover:scale-105 active:scale-95`
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Entry List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {todaysEntries.length === 0 ? (
                    <div className={`md:col-span-2 text-center py-20 rounded-[3rem] border-2 border-dashed ${theme.border} opacity-40 ${theme.textMain} theme-transition bg-black/5`}>
                        {searchTerm ? (
                            <>
                                <Search size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="text-lg font-bold">No results for "{searchTerm}"</p>
                                <p className="text-sm font-medium">Try a different search term or clear the filter.</p>
                                <button onClick={() => setSearchTerm('')} className={`mt-4 px-5 py-2 rounded-full ${theme.primary} text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all`}>Clear Search</button>
                            </>
                        ) : (
                            <>
                                <Leaf size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="text-lg font-bold">Your journal is empty for today.</p>
                                <p className="text-sm font-medium">Tap the + button to log your first meal!</p>
                            </>
                        )}
                    </div>
                ) : (
                    todaysEntries.map((entry) => (
                        <div 
                            key={entry.id}
                            onClick={() => { setEditingId(entry.id); setNewItem(entry); setIsModalOpen(true); }}
                            className={`group relative rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 shadow-sm hover:shadow-xl ${theme.card} ${theme.textMain} transition-all duration-300 cursor-pointer theme-transition hover:-translate-y-1`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${theme.inputBg} theme-transition`}>
                                    <img 
                                        src={entry.type === 'Breakfast' ? '/breakfast.svg' : 
                                             entry.type === 'Lunch' ? '/lunch.svg' : 
                                             entry.type === 'Dinner' ? '/dinner.svg' : 
                                             '/snack.svg'} 
                                        alt={entry.type}
                                        className="w-6 h-6"
                                    />
                                </div>
                                <div className="text-right">
                                    <span className={`block text-3xl font-black ${theme.primaryText} theme-transition leading-none`}>{entry.calories}</span>
                                    <span className="text-[10px] opacity-40 font-black uppercase tracking-widest">KCAL</span>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <h4 className="font-black text-xl leading-tight theme-transition"><HighlightText text={entry.name} query={searchTerm} /></h4>
                                    <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">{formatTime(entry.time, use24HourTime)} • <HighlightText text={entry.type} query={searchTerm} /></p>
                                </div>
                                
                                <div className="flex gap-2 flex-wrap">
                                    {!entry.finished && <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-rose-50 text-rose-500 uppercase tracking-tighter">Unfinished</span>}
                                    {entry.feeling && (() => { const f = getFeeling(entry.feeling); return (
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${f.softColor} uppercase tracking-tighter flex items-center gap-1`}>
                                            <img src={f.icon} alt={f.shortLabel} className="w-3.5 h-3.5" />{f.shortLabel}
                                        </span>
                                    ); })()}
                                    {entry.tags && entry.tags.split(',').map(tag => (
                                        <span key={tag} className={`text-[10px] font-black px-2 py-1 rounded-lg ${theme.inputBg} opacity-60 uppercase tracking-tighter`}>{tag.trim()}</span>
                                    ))}
                                </div>
                                
                                {entry.note && (
                                    <p className="font-handwritten text-base opacity-60 leading-snug border-l-2 border-black/5 pl-3 py-1 italic">"<HighlightText text={entry.note} query={searchTerm} />"</p>
                                )}
                            </div>

                            {/* Action buttons at bottom */}
                            <div className="mt-4 pt-3 border-t border-black/5 flex gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button 
                                    onClick={(e) => handleToggleFinish(e, entry)} 
                                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold ${entry.finished ? 'text-green-600 bg-green-50' : 'text-slate-500 bg-slate-100'} hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-1.5`}
                                >
                                    {entry.finished ? <CheckCircle size={14} /> : <Circle size={14} />}
                                    <span>{entry.finished ? 'Finished' : 'Mark Done'}</span>
                                </button>
                                <button 
                                    onClick={(e) => handleDelete(e, entry.id)} 
                                    className="py-2 px-3 rounded-xl text-xs font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5"
                                >
                                    <Trash2 size={14}/>
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );
}
