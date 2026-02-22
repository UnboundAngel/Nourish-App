import React, { useRef, useEffect, useCallback } from 'react';
import { Droplet, Coffee, Plus, X } from 'lucide-react';

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

// Generates a wobbly blob path
function generateBlobPath(seed, numPoints = 10) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
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

function GlassBlob({ theme, onClick, size = 76 }) {
  const svgRef = useRef(null);
  const animRef = useRef(null);
  const seedRef = useRef(Math.random() * 100);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const containerRef = useRef(null);
  const isAnimatingRef = useRef(false);
  const idRef = useRef(`blob-${Math.random().toString(16).slice(2)}`);

  const pxSize = typeof size === 'number' ? size : null;
  const containerSize = typeof size === 'number' ? `${size}px` : size;

  const baseColor = extractHex(theme.primary);
  const lightColor = lightenHex(baseColor, 0.45);

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
    setTimeout(stopAnimation, 300);
  };

  return (
    <div 
      ref={containerRef}
      className="relative flex items-center justify-center"
      style={{ width: containerSize, height: containerSize, marginTop: pxSize === 76 ? '-28px' : 0 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
    >
      <svg 
        ref={svgRef}
        viewBox="-1.8 -1.8 3.6 3.6" 
        className="absolute inset-0 w-full h-full"
        style={{ filter: `drop-shadow(0 6px 16px ${baseColor}66)`, cursor: 'pointer' }}
      >
        <defs>
          <linearGradient id={`blob-fill-${idRef.current}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={lightColor} />
            <stop offset="100%" stopColor={baseColor} />
          </linearGradient>
          <linearGradient id={`blob-glass-${idRef.current}`} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id={`ring-stroke-${idRef.current}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`${lightColor}b3`} />
            <stop offset="100%" stopColor={`${lightColor}33`} />
          </linearGradient>
          <radialGradient id={`blob-highlight-${idRef.current}`} cx="30%" cy="25%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        <path className="blob-main" fill={`url(#blob-fill-${idRef.current})`} d={generateBlobPath(0)} />
        <path className="blob-glass" fill={`url(#blob-glass-${idRef.current})`} d={generateBlobPath(0)} />
        <ellipse cx="-0.25" cy="-0.3" rx="0.4" ry="0.28" fill={`url(#blob-highlight-${idRef.current})`} />
        <path className="blob-ring" fill="none" stroke={`url(#ring-stroke-${idRef.current})`} strokeWidth="0.07" opacity="0" d={generateBlobPath(5)} />
      </svg>

      <div className="relative z-10 pointer-events-none">
        {pxSize ? (
          <img src="/have-a-meal-svgrepo-com.svg" alt="Add meal" className={`drop-shadow-sm ${pxSize >= 72 ? 'w-11 h-11' : 'w-9 h-9'}`} />
        ) : (
          <img
            src="/have-a-meal-svgrepo-com.svg"
            alt="Add meal"
            className="drop-shadow-sm"
            style={{ width: 'clamp(34px, 2.8vw, 46px)', height: 'clamp(34px, 2.8vw, 46px)' }}
          />
        )}
      </div>
    </div>
  );
}

export function FAB({
  theme, isFabMenuOpen, setIsFabMenuOpen,
  handleAddWater, openNewEntryModal,
}) {
  return (
    <>
      {/* Desktop FAB — hidden on mobile (bottom nav handles it) */}
      <div className="hidden md:flex fixed bottom-8 right-8 z-40 flex-col items-end gap-3">
        
        {/* Speed Dial */}
        <div className={`flex flex-col items-end gap-3 transition-all duration-300 ${isFabMenuOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-50 pointer-events-none'}`}>
            <button 
                onClick={() => { handleAddWater(8); setIsFabMenuOpen(false); }}
                className="flex items-center gap-3 pl-4 pr-2 py-2 rounded-2xl bg-blue-500 text-white shadow-xl hover:scale-105 active:scale-95 transition-all group"
            >
                <span className="text-xs font-bold whitespace-nowrap">Quick Water +8oz</span>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Droplet size={18} />
                </div>
            </button>
            <button 
                onClick={() => { openNewEntryModal(); setIsFabMenuOpen(false); }}
                className={`flex items-center gap-3 pl-4 pr-2 py-2 rounded-2xl ${theme.primary} text-white shadow-xl hover:scale-105 active:scale-95 transition-all group`}
            >
                <span className="text-xs font-bold whitespace-nowrap">Log a Meal</span>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Coffee size={18} />
                </div>
            </button>
        </div>

        {/* Main Toggle — animated blob matching mobile */}
        <div className="relative">
          <GlassBlob 
            theme={theme} 
            onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
            size="clamp(68px, 5vw, 92px)"
          />
          {isFabMenuOpen && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <X size={26} strokeWidth={2.5} className="text-white animate-in fade-in zoom-in duration-200" />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Action Sheet — slides up from bottom nav */}
      {isFabMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFabMenuOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 animate-in slide-in-from-bottom duration-300">
            <div className={`${theme.card} rounded-3xl shadow-2xl p-4 space-y-2`}>
              <div className="flex items-center justify-between px-2 mb-2">
                <h3 className={`text-xs font-black uppercase tracking-widest opacity-40 ${theme.textMain}`}>Quick Actions</h3>
                <button onClick={() => setIsFabMenuOpen(false)} className="p-1 opacity-40 hover:opacity-100">
                  <X size={16} />
                </button>
              </div>
              <button 
                onClick={() => { openNewEntryModal(); setIsFabMenuOpen(false); }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl ${theme.primary} text-white active:scale-[0.98] transition-all shadow-lg`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Coffee size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Log a Meal</p>
                  <p className="text-[10px] opacity-70">Track what you're eating</p>
                </div>
              </button>
              <button 
                onClick={() => { handleAddWater(8); setIsFabMenuOpen(false); }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl ${theme.inputBg} ${theme.textMain} active:scale-[0.98] transition-all`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-500 flex items-center justify-center">
                  <Droplet size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Quick Water</p>
                  <p className="text-[10px] opacity-50">Add 8oz of water</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
