export function isValidWeight(w) {
  const n = Number(w);
  return !isNaN(n) && n > 0 && n < 1000;
}

const MIN_CALORIES = 1200;

export function calculateMacrosForGoal(weight, weightUnit, goalType, weeklyGoal = 1) {
  if (!isValidWeight(weight)) return null;

  const weightInLbs = weightUnit === 'kg' ? Number(weight) * 2.20462 : Number(weight);

  let calories = Math.round(weightInLbs * 15);

  if (goalType === 'lose') {
    calories = Math.max(MIN_CALORIES, calories - (Number(weeklyGoal) * 500));
  } else if (goalType === 'gain') {
    calories += (Number(weeklyGoal) * 500);
  }

  const protein = Math.round(weightInLbs * 1.0);
  const fats = Math.round(weightInLbs * 0.4);
  const proteinCals = protein * 4;
  const fatCals = fats * 9;
  const carbCals = calories - proteinCals - fatCals;
  const carbs = Math.max(0, Math.round(carbCals / 4));

  return { calories, protein, carbs, fats };
}

export function estimateTimeToGoal(currentWeight, targetWeight, weeklyGoal) {
  if (!isValidWeight(currentWeight) || !isValidWeight(targetWeight) || !isValidWeight(weeklyGoal)) return null;
  const difference = Math.abs(Number(targetWeight) - Number(currentWeight));
  if (difference === 0) return { weeks: 0, months: 0, estimatedDate: new Date() };
  const weeks = Math.ceil(difference / Number(weeklyGoal));
  return {
    weeks,
    months: Math.ceil(weeks / 4),
    estimatedDate: new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000),
  };
}

export function calculateProgress(startWeight, currentWeight, targetWeight) {
  const start = Number(startWeight);
  const current = Number(currentWeight);
  const target = Number(targetWeight);
  if (isNaN(start) || isNaN(current) || isNaN(target)) return 0;
  const totalChange = Math.abs(target - start);
  if (totalChange === 0) return 100;
  const currentChange = Math.abs(current - start);
  return Math.min(100, Math.round((currentChange / totalChange) * 100));
}
