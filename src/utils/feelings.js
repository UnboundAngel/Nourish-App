// Centralized feeling definitions used across the entire app.
// SVG icons are in /public/feeling-*.svg
// The bloated icon has male/female variants; default to female for now.

export const FEELINGS = {
  good: {
    id: 'good',
    label: 'Felt Great',
    shortLabel: 'Great',
    icon: '/feeling-good.svg',
    color: 'bg-emerald-500',
    softColor: 'bg-emerald-100 text-emerald-700',
    barColor: 'bg-emerald-400',
    hex: '#10b981',
    description: 'No discomfort, felt energized',
  },
  okay: {
    id: 'okay',
    label: 'Felt Okay',
    shortLabel: 'Okay',
    icon: '/feeling-okay.svg',
    color: 'bg-amber-500',
    softColor: 'bg-amber-100 text-amber-700',
    barColor: 'bg-amber-400',
    hex: '#f59e0b',
    description: 'Nothing notable, neutral',
  },
  sick: {
    id: 'sick',
    label: 'Felt Sick',
    shortLabel: 'Sick',
    icon: '/feeling-sick.svg',
    color: 'bg-rose-500',
    softColor: 'bg-rose-100 text-rose-700',
    barColor: 'bg-rose-400',
    hex: '#f43f5e',
    description: 'Nausea, stomach pain, or discomfort',
  },
  bloated: {
    id: 'bloated',
    label: 'Felt Bloated',
    shortLabel: 'Bloated',
    icon: '/feeling-bloated-female.svg',
    iconMale: '/feeling-bloated-male.svg',
    color: 'bg-purple-500',
    softColor: 'bg-purple-100 text-purple-700',
    barColor: 'bg-purple-400',
    hex: '#a855f7',
    description: 'Fullness, swelling, or heaviness',
    isIllustration: true, // This icon is a full illustration, not a line icon
  },
};

// Ordered array for consistent rendering
export const FEELING_LIST = [
  FEELINGS.good,
  FEELINGS.okay,
  FEELINGS.sick,
  FEELINGS.bloated,
];

// Map legacy "great" feeling to "good" for backward compatibility
export function normalizeFeeling(feeling) {
  if (feeling === 'great') return 'good';
  if (FEELINGS[feeling]) return feeling;
  return 'good'; // default
}

// Get feeling config, handling legacy values
export function getFeeling(feeling) {
  return FEELINGS[normalizeFeeling(feeling)] || FEELINGS.good;
}

