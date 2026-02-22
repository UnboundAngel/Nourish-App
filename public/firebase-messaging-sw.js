// Firebase Messaging Service Worker for background notifications
importScripts('https://www.gstatic.com/firebasejs/12.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.6.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyAfMuQpKXVlbKQRqJ8r4nO-FXn6VerohUo",
  authDomain: "nourish-d2113.firebaseapp.com",
  projectId: "nourish-d2113",
  storageBucket: "nourish-d2113.appspot.com",
  messagingSenderId: "695002156720",
  appId: "1:695002156720:web:0e91a6340cd822abd97575"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Nourish';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/Nourish-192.png',
    badge: '/Nourish-192.png',
    tag: 'nourish-notification',
    requireInteraction: false,
    data: payload.data
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  
  event.notification.close();
  
  // Focus or open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
