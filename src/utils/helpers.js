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

export const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', quality);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};
