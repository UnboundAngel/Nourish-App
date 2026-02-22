import admin from 'firebase-admin';

// Initialize Firebase Admin (Only once)
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

const db = admin.firestore();

/**
 * Send a push notification to a specific user's devices via FCM.
 * Called internally by other API routes (not directly by cron).
 */
export async function sendPushToUser(userId, title, body, data = {}) {
  const devicesSnapshot = await db.collection(`artifacts/default-app-id/users/${userId}/devices`).get();
  
  if (devicesSnapshot.empty) return { sent: 0, failed: 0 };

  const tokens = devicesSnapshot.docs.map(doc => doc.data().token).filter(Boolean);
  if (tokens.length === 0) return { sent: 0, failed: 0 };

  const message = {
    notification: { title, body },
    data: { ...data, timestamp: Date.now().toString() },
    webpush: {
      notification: {
        icon: '/Nourish-192.png',
        badge: '/Nourish-192.png',
        tag: data.tag || 'nourish-notification',
        requireInteraction: false,
      }
    },
    tokens: tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    
    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered') {
            failedTokens.push(tokens[idx]);
          }
        }
      });

      // Remove invalid tokens from Firestore
      for (const token of failedTokens) {
        const tokenId = token.substring(0, 20);
        await db.doc(`artifacts/default-app-id/users/${userId}/devices/${tokenId}`).delete();
      }
    }

    return { sent: response.successCount, failed: response.failureCount };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { sent: 0, failed: tokens.length, error: error.message };
  }
}

/**
 * HTTP handler for testing push notifications.
 * POST /api/send-push-notification?secret=xxx
 * Body: { userId, title, body }
 */
export default async function handler(req, res) {
  const { secret } = req.query;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, title, body, data } = req.body;
  if (!userId || !title || !body) {
    return res.status(400).json({ error: 'Missing required fields: userId, title, body' });
  }

  try {
    const result = await sendPushToUser(userId, title, body, data || {});
    return res.status(200).json(result);
  } catch (error) {
    console.error('Push notification handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}
