import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAfMuQpKXVlbKQRqJ8r4nO-FXn6VerohUo",
  authDomain: "nourish-d2113.firebaseapp.com",
  projectId: "nourish-d2113",
  storageBucket: "nourish-d2113.appspot.com",
  messagingSenderId: "695002156720",
  appId: "1:695002156720:web:0e91a6340cd822abd97575"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Use localStorage persistence for iOS standalone/homescreen PWA compatibility
setPersistence(auth, browserLocalPersistence).catch(console.error);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const appId = 'default-app-id';

// Initialize Firebase Messaging (only in browser context, not in service worker)
export const messaging = typeof window !== 'undefined' && 'serviceWorker' in navigator 
  ? getMessaging(app) 
  : null;

// --- Calorie Constants ---
export const CALORIE_MAP = {
    protein: 4,
    carbs: 4,
    fats: 9
};
