import { CALORIE_MAP } from '../config/firebase';

export const formatTime = (timeString, use24HourTime) => {
    if (!timeString) return '';
    if (use24HourTime) return timeString;
    
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours, 10);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const formattedH = h % 12 || 12;
    return `${formattedH}:${minutes} ${suffix}`;
};

export const getCurrentFormattedTime = (use24HourTime) => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    return formatTime(timeString, use24HourTime);
};

export const calculateCaloriesFromMacros = (item) => {
    return (
        (Number(item.protein) * CALORIE_MAP.protein) +
        (Number(item.carbs) * CALORIE_MAP.carbs) +
        (Number(item.fats) * CALORIE_MAP.fats)
    );
};
