import React, { useState, useMemo } from 'react';
import { getTier, getNextTier, getNextMilestone } from '../utils/gardenTiers';

// --- Custom SVG Plants for 3D Garden ---
const Seedling = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14 md:w-20 md:h-20 overflow-visible drop-shadow-xl">
    <ellipse cx="50" cy="92" rx="20" ry="6" fill="#2d1a08" opacity="0.35" />
    <rect x="47" y="55" width="6" height="37" rx="3" fill="#3d6b1f" stroke="#2d4a12" strokeWidth="1.5" />
    <path d="M50 60 Q32 38 10 30 Q38 28 50 55" fill="#2d7a1f" stroke="#1a4f12" strokeWidth="1.5" />
    <path d="M50 55 Q68 33 90 25 Q62 23 50 50" fill="#1f6b18" stroke="#144a0f" strokeWidth="1.5" />
    <path d="M50 68 Q38 52 20 48 Q40 45 50 63" fill="#2d7a1f" stroke="#1a4f12" strokeWidth="1" opacity="0.8" />
  </svg>
);
const Bush = () => (
  <svg viewBox="0 0 100 100" className="w-8 h-8 md:w-10 md:h-10 overflow-visible drop-shadow-md">
    <ellipse cx="50" cy="90" rx="30" ry="10" fill="#452B11" opacity="0.4" />
    <circle cx="50" cy="60" r="28" fill="#22C55E" />
    <circle cx="30" cy="65" r="20" fill="#16A34A" />
    <circle cx="70" cy="65" r="20" fill="#15803D" />
  </svg>
);
const Flower = () => (
  <svg viewBox="0 0 100 100" className="w-9 h-9 md:w-12 md:h-12 overflow-visible drop-shadow-lg">
    <ellipse cx="50" cy="90" rx="25" ry="8" fill="#452B11" opacity="0.4" />
    <rect x="47" y="40" width="6" height="50" fill="#16A34A" />
    <circle cx="50" cy="20" r="14" fill="#F472B6" />
    <circle cx="28" cy="35" r="14" fill="#F472B6" />
    <circle cx="72" cy="35" r="14" fill="#F472B6" />
    <circle cx="40" cy="55" r="14" fill="#F472B6" />
    <circle cx="60" cy="55" r="14" fill="#F472B6" />
    <circle cx="50" cy="40" r="10" fill="#FACC15" />
  </svg>
);
const PineTree = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14 md:w-20 md:h-20 overflow-visible -translate-y-2 drop-shadow-xl">
    <ellipse cx="50" cy="95" rx="30" ry="10" fill="#452B11" opacity="0.4" />
    <rect x="42" y="50" width="16" height="45" fill="#78350F" />
    <circle cx="50" cy="35" r="35" fill="#059669" />
    <circle cx="25" cy="50" r="25" fill="#047857" />
    <circle cx="75" cy="50" r="25" fill="#065F46" />
    <circle cx="50" cy="20" r="20" fill="#34D399" opacity="0.3" />
  </svg>
);
const AppleTree = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 md:w-24 md:h-24 overflow-visible -translate-y-4 drop-shadow-2xl">
    <ellipse cx="50" cy="95" rx="35" ry="12" fill="#452B11" opacity="0.4" />
    <path d="M40 95 C40 60 45 40 35 20 L65 20 C55 40 60 60 60 95 Z" fill="#78350F" />
    <circle cx="50" cy="30" r="40" fill="#065F46" />
    <circle cx="20" cy="45" r="30" fill="#047857" />
    <circle cx="80" cy="45" r="30" fill="#064E3B" />
    <circle cx="50" cy="15" r="6" fill="#EF4444" />
    <circle cx="25" cy="35" r="6" fill="#EF4444" />
    <circle cx="75" cy="40" r="6" fill="#EF4444" />
    <circle cx="40" cy="50" r="6" fill="#EF4444" />
    <circle cx="60" cy="30" r="6" fill="#EF4444" />
  </svg>
);

const PLANT_POSITIONS = [
  {x:50,y:50},{x:35,y:65},{x:65,y:60},{x:45,y:35},{x:55,y:75},
  {x:25,y:50},{x:75,y:45},{x:40,y:80},{x:60,y:30},{x:30,y:35},
  {x:70,y:75},{x:20,y:65},{x:80,y:60},{x:50,y:20},{x:50,y:85},
  {x:35,y:25},{x:65,y:25},{x:25,y:75},{x:75,y:70},{x:40,y:50},
  {x:60,y:50},{x:15,y:55},{x:85,y:50},{x:45,y:65},{x:55,y:45},
  {x:30,y:80},{x:70,y:30},{x:45,y:15},{x:55,y:85},{x:10,y:45},
  {x:90,y:55},{x:35,y:55},{x:65,y:40},{x:25,y:35},{x:75,y:25},
  {x:40,y:20},{x:60,y:70},{x:20,y:40},{x:80,y:35},{x:50,y:10},
];

// --- 3D Floating Island Garden ---
function GardenIsland({ dailyStreak, theme }) {
  const visiblePlants = useMemo(() => {
    const plants = [];
    const maxPlants = Math.min(dailyStreak, 40);
    for (let i = 0; i < maxPlants; i++) {
      const age = dailyStreak - i;
      let Comp = Seedling;
      if (age >= 30) Comp = AppleTree;
      else if (age >= 14) Comp = PineTree;
      else if (age >= 7) Comp = Flower;
      else if (age >= 3) Comp = Bush;
      plants.push({
        id: i, age,
        pos: PLANT_POSITIONS[i % PLANT_POSITIONS.length],
        Component: Comp,
        isNew: age === 1,
      });
    }
    return plants.sort((a, b) => a.pos.y - b.pos.y);
  }, [dailyStreak]);

  return (
    <div className="relative w-full aspect-[3/2] mx-auto">
      <style>{`
        @keyframes garden-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pop-in {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .garden-island { animation: garden-float 6s ease-in-out infinite; }
        .plant-pop { animation: pop-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>

      <div className="relative w-full h-full">
        {/* 3D Island base SVG */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 260" fill="none" preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Grass top gradient */}
            <radialGradient id="grass-top" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#a8d948" />
              <stop offset="50%" stopColor="#8cbf3f" />
              <stop offset="85%" stopColor="#6da832" />
              <stop offset="100%" stopColor="#5a8f28" />
            </radialGradient>
            {/* Dirt side gradient */}
            <linearGradient id="dirt-side" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B6914" />
              <stop offset="30%" stopColor="#6B4F10" />
              <stop offset="100%" stopColor="#4A3508" />
            </linearGradient>
            {/* Subtle grass highlight */}
            <radialGradient id="grass-highlight" cx="35%" cy="35%" r="30%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            {/* Drop shadow filter */}
            <filter id="island-shadow" x="-10%" y="-5%" width="120%" height="130%">
              <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000" floodOpacity="0.25" />
            </filter>
          </defs>

          <g filter="url(#island-shadow)">
            {/* Dirt body — thick side wall */}
            <ellipse cx="200" cy="155" rx="160" ry="40" fill="url(#dirt-side)" />
            <rect x="40" y="130" width="320" height="25" fill="url(#dirt-side)" rx="0" />
            <ellipse cx="200" cy="130" rx="160" ry="40" fill="url(#dirt-side)" />

            {/* Dirt texture lines */}
            <ellipse cx="200" cy="142" rx="140" ry="20" fill="none" stroke="#5a4010" strokeWidth="0.5" opacity="0.3" />
            <ellipse cx="200" cy="150" rx="130" ry="15" fill="none" stroke="#5a4010" strokeWidth="0.5" opacity="0.2" />

            {/* Grass top surface */}
            <ellipse cx="200" cy="125" rx="160" ry="42" fill="url(#grass-top)" />

            {/* Grass rim edge — darker ring */}
            <ellipse cx="200" cy="125" rx="160" ry="42" fill="none" stroke="#4a8020" strokeWidth="2.5" />

            {/* Inner grass texture rings */}
            <ellipse cx="200" cy="124" rx="120" ry="30" fill="none" stroke="#9dd44a" strokeWidth="0.7" opacity="0.4" />
            <ellipse cx="200" cy="123" rx="80" ry="20" fill="none" stroke="#b0e060" strokeWidth="0.5" opacity="0.3" />
            <ellipse cx="200" cy="122" rx="40" ry="10" fill="none" stroke="#c0ea70" strokeWidth="0.4" opacity="0.2" />

            {/* Specular highlight on grass */}
            <ellipse cx="170" cy="115" rx="60" ry="18" fill="url(#grass-highlight)" />

            {/* Small dirt patches for realism */}
            <ellipse cx="150" cy="128" rx="12" ry="4" fill="#7a6520" opacity="0.15" />
            <ellipse cx="250" cy="130" rx="8" ry="3" fill="#7a6520" opacity="0.12" />
            <ellipse cx="200" cy="132" rx="6" ry="2" fill="#7a6520" opacity="0.1" />
          </g>
        </svg>

        {/* Empty state text (static) */}
        {dailyStreak === 0 && (
          <div className="absolute inset-[12%] bottom-[18%] flex flex-col items-center justify-center font-bold text-sm" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4), 0 0 2px rgba(255,255,255,0.8)' }}>
            <p className="text-white">A fresh patch of soil.</p>
            <p className="text-white/80 text-xs mt-1">Log a meal to plant a seed!</p>
          </div>
        )}

        {/* Plants (static) */}
        <div className="absolute inset-[12%] bottom-[18%]">
          {visiblePlants.map((plant) => (
            <div
              key={`plant-${plant.id}`}
              className={`absolute flex items-end justify-center -translate-x-1/2 -translate-y-[80%] ${plant.isNew ? 'plant-pop' : ''}`}
              style={{
                left: `${plant.pos.x}%`,
                top: `${plant.pos.y}%`,
                zIndex: Math.floor(plant.pos.y),
              }}
            >
              <plant.Component />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Garden Plot: 7-day visual ---
function GardenPlot({ getEntriesForDate, dailyStreak, theme }) {
  const tier = getTier(dailyStreak);
  const plots = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const isToday = i === 6;
    const hasEntries = getEntriesForDate(d, '', 'newest', []).length > 0;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    return { d, isToday, hasEntries, dayName };
  });

  return (
    <div className="flex justify-between items-end gap-1 px-1">
      {plots.map((plot, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
          <span className={`text-[8px] font-black uppercase ${plot.isToday ? tier.color : `${theme.textMain} opacity-40`}`}>
            {plot.dayName}
          </span>
          <div className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-700 ${
            plot.hasEntries
              ? `${tier.accent} text-white shadow-md scale-105`
              : `${theme.inputBg} border border-dashed ${theme.border} opacity-30`
          }`}>
            {plot.hasEntries ? (
              <span className="text-xs">{dailyStreak >= 30 ? '🌳' : dailyStreak >= 8 ? '🌸' : dailyStreak >= 4 ? '🌿' : '🌱'}</span>
            ) : (
              <span className="text-[8px] opacity-40">·</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Full Garden Widget (Desktop Sidebar) ---
export function NourishGarden({ theme, dailyStreak, getEntriesForDate }) {
  const [view, setView] = useState('flat'); // 'flat' or '3d'
  const todayHasEntries = getEntriesForDate(new Date(), '', 'newest', []).length > 0;
  const effectiveStreak = dailyStreak > 0 ? dailyStreak : (todayHasEntries ? 1 : 0);
  const tier = getTier(effectiveStreak);
  const nextTier = getNextTier(effectiveStreak);
  const nextMilestone = getNextMilestone(effectiveStreak);
  const rawProgress = nextTier 
    ? ((effectiveStreak - tier.min) / (nextTier.min - tier.min)) * 100
    : 100;
  const milestoneProgress = effectiveStreak > 0 ? Math.max(8, rawProgress) : 0;

  return (
    <div className={`w-full rounded-[2rem] ${theme.card} ${theme.textMain} theme-transition shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-500`}>
      
      {/* Background Glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${tier.gradient} opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-1000`} />

      <div className="relative z-10 p-5">
        {/* Tier Badge + View Toggle */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{tier.icon}</span>
            <div>
              <p className={`text-xs font-black uppercase tracking-widest ${tier.color}`}>{tier.name}</p>
              <p className={`text-[9px] font-bold opacity-40 ${theme.textMain}`}>Nourish Garden</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <button
              onClick={() => setView(v => v === 'flat' ? '3d' : 'flat')}
              className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${theme.inputBg} opacity-50 hover:opacity-100`}
            >
              {view === 'flat' ? '🏝️ 3D' : '📊 Flat'}
            </button>
            {effectiveStreak > 0 && (
              <div className={`px-3 py-1.5 rounded-xl bg-gradient-to-r ${tier.gradient} text-white`}>
                <span className="text-lg font-black leading-none">{effectiveStreak}</span>
                <span className="text-[8px] font-bold opacity-70 ml-0.5">days</span>
              </div>
            )}
          </div>
        </div>

        {/* Motivational Message */}
        <p className={`text-sm font-bold italic opacity-60 mb-5 ${theme.textMain}`}>
          "{tier.message}"
        </p>

        {view === '3d' ? (
          /* 3D Island View */
          <GardenIsland dailyStreak={effectiveStreak} theme={theme} />
        ) : (
          /* Flat View */
          <>
            {/* 7-Day Garden Plot */}
            <div className="mb-5">
              <p className={`text-[8px] font-black uppercase tracking-[0.2em] opacity-30 mb-2 ${theme.textMain}`}>This Week's Garden</p>
              <GardenPlot getEntriesForDate={getEntriesForDate} dailyStreak={effectiveStreak} theme={theme} />
            </div>

            {/* Progress to Next Tier */}
            {nextTier && effectiveStreak > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-[8px] font-black uppercase opacity-40 tracking-widest">
                  <span>{tier.icon} {tier.name}</span>
                  <span>{nextTier.icon} {nextTier.name} ({nextTier.min}d)</span>
                </div>
                <div className={`w-full h-2.5 ${theme.inputBg} rounded-full overflow-hidden`}>
                  <div 
                    className={`h-full rounded-full bg-gradient-to-r ${tier.gradient} transition-all duration-1000 shadow-sm`}
                    style={{ width: `${Math.min(milestoneProgress, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Next Milestone */}
        {effectiveStreak > 0 && (
          <div className={`mt-4 flex items-center justify-center gap-2 py-2 rounded-xl ${theme.inputBg}`}>
            <span className="text-[9px]">🎯</span>
            <span className={`text-[9px] font-black uppercase tracking-wider opacity-50 ${theme.textMain}`}>
              <span>{nextMilestone - effectiveStreak} days to {nextMilestone}-day milestone</span>
            </span>
          </div>
        )}

        {/* Seed State */}
        {effectiveStreak === 0 && todayHasEntries === false && (
          <div className={`text-center py-3 rounded-xl ${theme.inputBg} mt-2`}>
            <p className={`text-xs font-bold opacity-50 ${theme.textMain}`}>Log a meal to plant your first seed 🌰</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Compact Garden Badge (for mobile nav) ---
export function GardenBadge({ dailyStreak, size = 'md', theme = {} }) {
  const tier = getTier(dailyStreak);
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-lg',
    lg: 'w-14 h-14 text-2xl',
  };

  return (
    <div className={`${sizes[size]} rounded-2xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center shadow-lg relative`}>
      <span>{tier.icon}</span>
      {dailyStreak > 0 && (
        <span className={`absolute -bottom-1 -right-1 ${theme.card} text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-sm ${theme.textMain}`}>
          {dailyStreak}
        </span>
      )}
    </div>
  );
}

// --- Mobile Streak Card (shown in mobile view) ---
export function MobileStreakCard({ theme, dailyStreak, getEntriesForDate, onClick }) {
  const tier = getTier(dailyStreak);
  const nextMilestone = getNextMilestone(dailyStreak);

  return (
    <button 
      onClick={onClick}
      className={`w-full rounded-2xl p-4 ${theme.card} shadow-lg active:scale-[0.98] transition-all relative overflow-hidden`}
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${tier.gradient} opacity-[0.06]`} />
      <div className="relative z-10 flex items-center gap-4">
        <GardenBadge dailyStreak={dailyStreak} size="md" theme={theme} />
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-black ${tier.color}`}>{tier.name}</span>
            {dailyStreak > 0 && (
              <span className={`text-[10px] font-bold opacity-40 ${theme.textMain}`}>· {dailyStreak} day streak</span>
            )}
          </div>
          <p className={`text-[10px] font-bold opacity-50 ${theme.textMain}`}>
            {dailyStreak === 0 ? 'Log a meal to start growing' : `${nextMilestone - dailyStreak} days to next milestone`}
          </p>
        </div>
        <div className="flex gap-0.5">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const has = getEntriesForDate(d, '', 'newest', []).length > 0;
            return (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${has ? `${tier.accent}` : `${theme.inputBg} opacity-40`}`} />
            );
          })}
        </div>
      </div>
    </button>
  );
}
