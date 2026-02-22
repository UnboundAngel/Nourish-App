import React, { useRef, useEffect, useCallback } from 'react';
import { Home, Calendar as CalendarIcon, Settings, Leaf, BarChart3 } from 'lucide-react';
import { getTier } from '../utils/gardenTiers';

// Builds a smooth closed SVG path from polar points using Catmull-Rom → cubic bezier
function buildSmoothPath(points) {
  const n = points.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const curr = points[i];
    const next = points[(i + 1) % n];
    const prev = points[(i - 1 + n) % n];
    const next2 = points[(i + 2) % n];
    const cp1x = curr.x + (next.x - prev.x) / 6;
    const cp1y = curr.y + (next.y - prev.y) / 6;
    const cp2x = next.x - (next2.x - curr.x) / 6;
    const cp2y = next.y - (next2.y - curr.y) / 6;
    if (i === 0) d += `M ${curr.x} ${curr.y} `;
    d += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y} `;
  }
  return d + 'Z';
}

// Generates a wobbly blob path — big enough to be obviously non-circular
function generateBlobPath(seed, numPoints = 10) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    // Each point gets its own unique wobble from multiple overlapping waves
    const w1 = 0.18 * Math.sin(seed * 0.7 + i * 2.3);
    const w2 = 0.12 * Math.cos(seed * 1.1 + i * 3.9);
    const w3 = 0.07 * Math.sin(seed * 1.9 + i * 5.1);
    const r = 1 + w1 + w2 + w3;
    points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
  }
  return buildSmoothPath(points);
}

// Generates a ring that bulges toward the cursor direction
function generateRingPath(seed, cursorX, cursorY, numPoints = 14) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const baseR = 1.45;
    const dot = Math.cos(angle) * cursorX + Math.sin(angle) * cursorY;
    const bulge = Math.max(0, dot) * 0.35;
    const wobble = 0.05 * Math.sin(seed * 2 + i * 2.5);
    const r = baseR + bulge + wobble;
    points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
  }
  return buildSmoothPath(points);
}

// Extract hex color from a Tailwind bg-[#xxx] class
function extractHex(bgClass) {
  const m = bgClass?.match(/#[0-9a-fA-F]{3,8}/);
  return m ? m[0] : '#2D5A27';
}

// Lighten a hex color by a factor (0-1)
function lightenHex(hex, factor) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.min(255, Math.round(r + (255 - r) * factor));
  const lg = Math.min(255, Math.round(g + (255 - g) * factor));
  const lb = Math.min(255, Math.round(b + (255 - b) * factor));
  return `#${lr.toString(16).padStart(2,'0')}${lg.toString(16).padStart(2,'0')}${lb.toString(16).padStart(2,'0')}`;
}

function GlassBlob({ theme, onClick }) {
  const svgRef = useRef(null);
  const animRef = useRef(null);
  const seedRef = useRef(Math.random() * 100);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const containerRef = useRef(null);
  const isAnimatingRef = useRef(false);

  const baseColor = extractHex(theme.primary);
  const lightColor = lightenHex(baseColor, 0.45);

  // Render one static frame on mount, then stop
  const renderFrame = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const mainPath = svg.querySelector('.blob-main');
    const glassPath = svg.querySelector('.blob-glass');
    const ringPath = svg.querySelector('.blob-ring');
    const blobD = generateBlobPath(seedRef.current);
    if (mainPath) mainPath.setAttribute('d', blobD);
    if (glassPath) glassPath.setAttribute('d', blobD);

    if (ringPath && containerRef.current) {
      if (mouseRef.current.active) {
        const rect = containerRef.current.getBoundingClientRect();
        const cx = (mouseRef.current.x - rect.left - rect.width / 2) / (rect.width / 2);
        const cy = (mouseRef.current.y - rect.top - rect.height / 2) / (rect.height / 2);
        ringPath.setAttribute('d', generateRingPath(seedRef.current * 0.7, cx, cy));
        ringPath.style.opacity = '0.6';
      } else {
        ringPath.style.opacity = '0';
      }
    }
  }, []);

  const animate = useCallback(() => {
    if (!isAnimatingRef.current) return;
    seedRef.current += 0.006;
    renderFrame();
    animRef.current = requestAnimationFrame(animate);
  }, [renderFrame]);

  const startAnimation = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    animRef.current = requestAnimationFrame(animate);
  }, [animate]);

  const stopAnimation = useCallback(() => {
    isAnimatingRef.current = false;
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, []);

  // Render one static frame on mount — no loop
  useEffect(() => {
    renderFrame();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [renderFrame]);

  const handlePointerMove = (e) => {
    mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    startAnimation();
  };
  const handlePointerLeave = () => {
    mouseRef.current = { ...mouseRef.current, active: false };
    // Let it run a few more frames to smoothly hide the ring, then stop
    setTimeout(stopAnimation, 300);
  };

  return (
    <div 
      ref={containerRef}
      className="relative -mt-7 w-[76px] h-[76px] flex items-center justify-center"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <svg 
        ref={svgRef}
        viewBox="-1.8 -1.8 3.6 3.6" 
        className="absolute inset-0 w-full h-full"
        style={{ filter: `drop-shadow(0 6px 16px ${baseColor}66)` }}
      >
        <defs>
          <linearGradient id="blob-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={lightColor} />
            <stop offset="100%" stopColor={baseColor} />
          </linearGradient>
          <linearGradient id="blob-glass" x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id="ring-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`${lightColor}b3`} />
            <stop offset="100%" stopColor={`${lightColor}33`} />
          </linearGradient>
          <radialGradient id="blob-highlight" cx="30%" cy="25%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        {/* Main colored blob body */}
        <path className="blob-main" fill="url(#blob-fill)" d={generateBlobPath(0)} />
        {/* Glass overlay — same shape, transparent white gradient */}
        <path className="blob-glass" fill="url(#blob-glass)" d={generateBlobPath(0)} />
        {/* Specular highlight — small bright spot top-left */}
        <ellipse cx="-0.25" cy="-0.3" rx="0.4" ry="0.28" fill="url(#blob-highlight)" />
        {/* Cursor-reactive ring (hidden until hover) */}
        <path className="blob-ring" fill="none" stroke="url(#ring-stroke)" strokeWidth="0.07" opacity="0" d={generateBlobPath(5)} />
      </svg>

      {/* Pink meal icon centered on top */}
      <div className="relative z-10 pointer-events-none">
        <img src="/have-a-meal-svgrepo-com.svg" alt="Add meal" className="w-11 h-11 drop-shadow-sm" />
      </div>
    </div>
  );
}

export function MobileBottomNav({
  theme, dailyStreak,
  setIsCalendarOpen, setIsSettingsOpen,
  setIsStreakOpen, setIsFabMenuOpen,
  setIsTrendsOpen,
  activeTab, setActiveTab,
}) {
  const tier = getTier(dailyStreak);

  return (
    <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 ${theme.card} border-t ${theme.border} backdrop-blur-xl shadow-2xl`}>
      <div className="flex items-center justify-around px-2 pt-1 pb-2">
        
        {/* Home */}
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-2xl transition-all active:scale-90 ${
            activeTab === 'home' ? `${theme.primaryText}` : `${theme.textMain} opacity-35`
          }`}
        >
          <Home size={22} strokeWidth={activeTab === 'home' ? 2.5 : 1.5} />
          <span className="text-[8px] font-black uppercase tracking-wider">Home</span>
        </button>

        {/* Trends */}
        <button 
          onClick={() => setIsTrendsOpen(true)}
          className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-2xl transition-all active:scale-90 ${theme.textMain} opacity-35 hover:opacity-100`}
        >
          <BarChart3 size={22} strokeWidth={1.5} />
          <span className="text-[8px] font-black uppercase tracking-wider">Trends</span>
        </button>

        {/* Center Add Button — Glassy Water Blob */}
        <GlassBlob theme={theme} onClick={() => setIsFabMenuOpen(true)} />

        {/* Calendar */}
        <button 
          onClick={() => setIsCalendarOpen(true)}
          className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-2xl transition-all active:scale-90 ${theme.textMain} opacity-35 hover:opacity-100`}
        >
          <CalendarIcon size={22} strokeWidth={1.5} />
          <span className="text-[8px] font-black uppercase tracking-wider">History</span>
        </button>

        {/* Settings */}
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-2xl transition-all active:scale-90 ${theme.textMain} opacity-35 hover:opacity-100`}
        >
          <Settings size={22} strokeWidth={1.5} />
          <span className="text-[8px] font-black uppercase tracking-wider">Settings</span>
        </button>
      </div>
    </nav>
  );
}
