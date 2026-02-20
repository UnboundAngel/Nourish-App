import React from 'react';
import { Leaf, Sun, Moon } from 'lucide-react';

export const THEMES = {
  Autumn: {
    id: 'Autumn',
    bg: 'bg-gradient-to-br from-[#FFFBEB] via-[#F1F8E9] to-[#FFF7ED]',
    sidebar: 'bg-white/80',
    card: 'bg-white/90',
    primary: 'bg-[#2D5A27]', 
    primaryText: 'text-[#2D5A27]',
    secondary: 'bg-[#EA580C]', 
    accent: 'text-[#D97706]', 
    textMain: 'text-[#1F2937]',
    border: 'border-[#E5E7EB]',
    inputBg: 'bg-black/5',
    wellnessBg: 'bg-orange-50',
    wellnessBorder: 'border-orange-100',
    wellnessText: 'text-orange-800',
    icon: Leaf,
    selectedBg: 'bg-white',
    selectedBorder: 'border-[#2D5A27]',
    selectedText: 'text-[#2D5A27]',
  },
  Summer: {
    id: 'Summer',
    bg: 'bg-gradient-to-br from-[#FEFCE8] via-[#E0F2FE] to-[#F0FDFA]',
    sidebar: 'bg-white/80',
    card: 'bg-white/90',
    primary: 'bg-[#0EA5E9]', 
    primaryText: 'text-[#0284C7]',
    secondary: 'bg-[#F59E0B]',
    accent: 'text-[#F59E0B]',
    textMain: 'text-[#1F2937]',
    border: 'border-[#E0F2FE]',
    inputBg: 'bg-black/5',
    wellnessBg: 'bg-yellow-50',
    wellnessBorder: 'border-yellow-100',
    wellnessText: 'text-yellow-800',
    icon: Sun,
    selectedBg: 'bg-white',
    selectedBorder: 'border-[#0EA5E9]',
    selectedText: 'text-[#0EA5E9]',
  },
  Dark: {
    id: 'Dark',
    bg: 'bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]',
    sidebar: 'bg-[#1E293B]/90',
    card: 'bg-[#1E293B]/80',
    primary: 'bg-[#6366F1]', 
    primaryText: 'text-white',
    secondary: 'bg-[#818CF8]',
    accent: 'text-[#818CF8]',
    textMain: 'text-white',
    border: 'border-[#334155]',
    inputBg: 'bg-[#334155]',
    wellnessBg: 'bg-indigo-900',
    wellnessBorder: 'border-indigo-700',
    wellnessText: 'text-indigo-200',
    icon: Moon,
    selectedBg: 'bg-white/10',
    selectedBorder: 'border-[#818CF8]', 
    selectedText: 'text-[#818CF8]', 
  },
  Light: {
    id: 'Light',
    bg: 'bg-gradient-to-br from-white via-slate-50 to-gray-100',
    sidebar: 'bg-white/90',
    card: 'bg-white',
    primary: 'bg-slate-800',
    primaryText: 'text-slate-800',
    secondary: 'bg-slate-500',
    accent: 'text-slate-600',
    textMain: 'text-slate-900',
    border: 'border-slate-200',
    inputBg: 'bg-black/5',
    wellnessBg: 'bg-slate-50',
    wellnessBorder: 'border-slate-200',
    wellnessText: 'text-slate-700',
    icon: Sun,
    selectedBg: 'bg-white',
    selectedBorder: 'border-slate-800',
    selectedText: 'text-slate-800',
  }
};

export const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Indie+Flower&family=Quicksand:wght@300;400;600;700&display=swap');

    /* Ensure Quicksand is used globally */
    body {
      font-family: 'Quicksand', sans-serif;
    }

    .font-handwritten {
      font-family: 'Indie Flower', cursive;
    }
    
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: currentColor;
      opacity: 0.4; 
      border-radius: 20px;
    }
    
    ::-webkit-scrollbar {
      width: 8px;
    }
    ::-webkit-scrollbar-track {
      background: rgba(0,0,0,0.05);
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(0,0,0,0.2);
      border-radius: 4px;
    }

    /* Glow Animation for Dark Mode Moon */
    @keyframes moon-glow {
      0% { box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.1); }
      50% { box-shadow: 0 0 20px 5px rgba(255, 255, 255, 0.2); }
      100% { box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.1); }
    }
    .moon-glow {
      animation: moon-glow 3s infinite ease-in-out;
    }

    /* Water Wave Animation */
    @keyframes wave-animation {
      0% { transform: translateX(0) translateZ(0) scaleY(1); }
      50% { transform: translateX(-25%) translateZ(0) scaleY(0.55); }
      100% { transform: translateX(-50%) translateZ(0) scaleY(1); }
    }
    .wave-liquid {
      width: 200%;
      position: absolute;
      top: -10px; 
      left: 0;
      height: 20px; 
      background-repeat: repeat-x;
      border-radius: 100%;
      opacity: 0.8;
      animation: wave-animation 4s linear infinite;
      background-color: rgba(59, 130, 246, 0.8); /* Match liquid color */
    }
    
    /* New FAB button style */
    .fab-glow {
        box-shadow: 0 10px 20px rgba(45, 90, 39, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.5);
    }
    .fab-inner {
        transition: transform 0.15s, opacity 0.15s;
    }
    .fab:active .fab-inner {
        transform: scale(0.9);
        opacity: 0.8;
    }

    input[type="date"]::-webkit-calendar-picker-indicator {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: auto;
      height: auto;
      color: transparent;
      background: transparent;
      cursor: pointer;
    }

    /* Hide number input spinners */
    .no-native-spinners::-webkit-outer-spin-button,
    .no-native-spinners::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    .no-native-spinners {
      -moz-appearance: textfield;
    }
    
    /* Global transition for theme changes */
    .theme-transition {
        transition: background-color 0.5s, color 0.5s, border-color 0.5s;
    }
    
    /* Animation for Streak Celebration */
    @keyframes streak-grow {
        0% { transform: scale(0.5) translateY(50px); opacity: 0; }
        100% { transform: scale(1) translateY(0); opacity: 1; }
    }
    .streak-animate {
        animation: streak-grow 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
    }
    .clickable {
        transition: transform 0.1s, opacity 0.1s;
    }
    .clickable:active {
        transform: scale(0.98);
        opacity: 0.95;
    }
    .stepper-button-active-gradient:active {
      background-image: linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0.05));
    }
  `}</style>
);
