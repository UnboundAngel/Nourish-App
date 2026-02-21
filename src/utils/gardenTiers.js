// --- Nourish Garden Tier System ---
export const GARDEN_TIERS = [
  { name: 'Seed',    min: 0,  icon: '🌰', color: 'text-amber-700',  bg: 'bg-amber-100',  accent: 'bg-amber-600',  ring: 'ring-amber-200',  gradient: 'from-amber-600 to-amber-400',    message: 'Plant your first seed today.' },
  { name: 'Sprout',  min: 1,  icon: '🌱', color: 'text-lime-600',   bg: 'bg-lime-50',     accent: 'bg-lime-500',   ring: 'ring-lime-200',   gradient: 'from-lime-500 to-emerald-400',   message: 'Your garden is sprouting!' },
  { name: 'Sapling', min: 4,  icon: '🌿', color: 'text-emerald-600',bg: 'bg-emerald-50',  accent: 'bg-emerald-500',ring: 'ring-emerald-200',gradient: 'from-emerald-500 to-teal-400',   message: 'Growing stronger every day.' },
  { name: 'Bloom',   min: 8,  icon: '🌸', color: 'text-pink-500',   bg: 'bg-pink-50',     accent: 'bg-pink-500',   ring: 'ring-pink-200',   gradient: 'from-pink-500 to-rose-400',      message: 'Your garden is in full bloom!' },
  { name: 'Tree',    min: 15, icon: '🌳', color: 'text-green-700',  bg: 'bg-green-50',    accent: 'bg-green-600',  ring: 'ring-green-200',  gradient: 'from-green-600 to-emerald-500',  message: 'Deep roots, strong growth.' },
  { name: 'Grove',   min: 30, icon: '🏕️', color: 'text-cyan-600',   bg: 'bg-cyan-50',     accent: 'bg-cyan-500',   ring: 'ring-cyan-200',   gradient: 'from-cyan-500 to-blue-400',      message: 'A thriving grove. Legendary!' },
];

export const MILESTONES = [3, 7, 14, 30, 60, 100];

export function getTier(streak) {
  let tier = GARDEN_TIERS[0];
  for (const t of GARDEN_TIERS) {
    if (streak >= t.min) tier = t;
  }
  return tier;
}

export function getNextTier(streak) {
  for (const t of GARDEN_TIERS) {
    if (streak < t.min) return t;
  }
  return null;
}

export function getNextMilestone(streak) {
  for (const m of MILESTONES) {
    if (streak < m) return m;
  }
  return Math.ceil((streak + 1) / 50) * 50;
}
