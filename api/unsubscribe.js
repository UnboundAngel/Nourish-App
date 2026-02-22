import admin from 'firebase-admin';
import { createHmac } from 'crypto';

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
 * Verify a signed unsubscribe token and return the userId, or null if invalid.
 * Token format: base64url(userId) + '.' + HMAC-SHA256(base64url(userId), CRON_SECRET)
 */
function verifyUnsubscribeToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, receivedSig] = parts;
  const expectedSig = createHmac('sha256', process.env.CRON_SECRET || 'fallback')
    .update(payload)
    .digest('base64url');
  if (receivedSig !== expectedSig) return null;
  try {
    return Buffer.from(payload, 'base64url').toString('utf8');
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const { token, type } = req.query;
  // type: 'daily' (default) or 'weekly'
  const summaryType = type === 'weekly' ? 'weekly' : 'daily';
  const profileField = summaryType === 'weekly' ? 'weeklySummary' : 'dailySummary';
  const labelText = summaryType === 'weekly' ? 'weekly' : 'daily';

  const userId = verifyUnsubscribeToken(token);

  if (!userId) {
    return res.status(400).send(`
      <html>
        <body style="font-family: sans-serif; max-width: 480px; margin: 80px auto; text-align: center; color: #333;">
          <h2>Invalid or expired unsubscribe link</h2>
          <p>This link is not valid. Please manage your notification preferences inside the Nourish app.</p>
        </body>
      </html>
    `);
  }

  try {
    const profileRef = db.doc(`artifacts/default-app-id/users/${userId}/profile/main`);
    const subscriberRef = db.doc(`artifacts/default-app-id/email_subscribers/${userId}`);

    // Turn off only the relevant summary type in the profile
    await profileRef.set({ [profileField]: false }, { merge: true });

    // Only delete the subscriber doc if both summaries are now off
    const profileSnap = await profileRef.get();
    const profileData = profileSnap.exists ? profileSnap.data() : {};
    const otherField = summaryType === 'weekly' ? 'dailySummary' : 'weeklySummary';
    if (!profileData[otherField]) {
      await subscriberRef.delete().catch(() => {});
    } else {
      // Update the subscriber doc to reflect the change
      await subscriberRef.set({ [profileField]: false }, { merge: true }).catch(() => {});
    }

    return res.status(200).send(`
      <html>
        <body style="font-family: sans-serif; max-width: 480px; margin: 80px auto; text-align: center; color: #333;">
          <h2 style="color: #2D5A27;">✅ Unsubscribed</h2>
          <p>You've been removed from ${labelText} summary emails. You can re-enable them anytime in your Nourish settings.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return res.status(500).send(`
      <html>
        <body style="font-family: sans-serif; max-width: 480px; margin: 80px auto; text-align: center; color: #333;">
          <h2>Something went wrong</h2>
          <p>Please try again or manage your preferences inside the Nourish app.</p>
        </body>
      </html>
    `);
  }
}
