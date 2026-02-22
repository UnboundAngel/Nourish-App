import { useEffect, useState, useCallback, useRef } from 'react';
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export function usePushNotifications({ user, showToast }) {
  const [fcmToken, setFcmToken] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('default');

  // Track the previously registered token so we can detect rotation.
  // Declared before any useCallback so hook order is stable across renders.
  const prevTokenRef = useRef(null);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      if (showToast) showToast('This browser does not support notifications', 'error');
      return false;
    }

    if (Notification.permission === 'granted') {
      if (showToast) showToast('Notifications already enabled!', 'info');
      return true;
    }

    if (Notification.permission === 'denied') {
      if (showToast) showToast('Notifications are blocked. Please enable them in your browser settings.', 'error');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        if (showToast) showToast('Notifications enabled! 🔔', 'success');
        return true;
      } else {
        if (showToast) showToast('Notification permission denied', 'warning');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      if (showToast) showToast('Failed to request notification permission', 'error');
      return false;
    }
  }, [showToast]);

  const registerFCMToken = useCallback(async (messaging) => {
    if (!user || user.isAnonymous) return;

    try {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });

      if (token) {
        // If the token has rotated, remove the old Firestore record first
        if (prevTokenRef.current && prevTokenRef.current !== token) {
          const oldTokenId = prevTokenRef.current.substring(0, 20);
          const oldDeviceRef = doc(db, 'artifacts', appId, 'users', user.uid, 'devices', oldTokenId);
          deleteDoc(oldDeviceRef).catch(() => {});
        }

        prevTokenRef.current = token;
        setFcmToken(token);

        // Store (or update) token in Firestore
        const tokenId = token.substring(0, 20);
        const deviceRef = doc(db, 'artifacts', appId, 'users', user.uid, 'devices', tokenId);

        await setDoc(deviceRef, {
          token: token,
          platform: 'web',
          createdAt: Date.now(),
          lastUsed: Date.now(),
          userAgent: navigator.userAgent
        }, { merge: true });

        console.log('FCM token registered:', token);
        if (showToast) showToast('Push notifications registered!', 'success');
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      if (showToast) showToast('Failed to register push notifications', 'error');
    }
  }, [user, showToast]);

  const unregisterFCMToken = useCallback(async () => {
    if (!user || !fcmToken) return;

    try {
      const tokenId = fcmToken.substring(0, 20);
      const deviceRef = doc(db, 'artifacts', appId, 'users', user.uid, 'devices', tokenId);
      await deleteDoc(deviceRef);
      
      setFcmToken(null);
      if (showToast) showToast('Push notifications disabled', 'info');
    } catch (error) {
      console.error('Error unregistering FCM token:', error);
    }
  }, [user, fcmToken, showToast]);

  // Initialize FCM when user is authenticated
  useEffect(() => {
    if (!user || user.isAnonymous) return;
    if (Notification.permission !== 'granted') return;

    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.log('Service workers not supported');
      return;
    }

    // Register service worker
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
        
        // Initialize Firebase Messaging
        try {
          const messaging = getMessaging();
          
          // Handle foreground messages
          onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);
            
            if (showToast && payload.notification) {
              showToast(payload.notification.body || 'New notification', 'info');
            }
            
            // Show browser notification even in foreground
            if (Notification.permission === 'granted' && payload.notification) {
              new Notification(payload.notification.title || 'Nourish', {
                body: payload.notification.body,
                icon: '/Nourish-192.png'
              });
            }
          });

          // Register FCM token
          registerFCMToken(messaging);
        } catch (error) {
          console.error('Error initializing Firebase Messaging:', error);
        }
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  }, [user, registerFCMToken, showToast]);

  // Update permission status
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  return {
    fcmToken,
    permissionStatus,
    requestPermission,
    unregisterFCMToken
  };
}
