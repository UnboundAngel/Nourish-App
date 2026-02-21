import { Resend } from 'resend';
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
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Add a simple secret check to ensure only our Cron Job can trigger this
  const { secret } = req.query;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Fetch only opted-in subscribers from the flat email_subscribers collection
    // This scales as O(subscribers) instead of O(all users)
    const subscribersSnapshot = await db.collection('artifacts/default-app-id/email_subscribers')
      .where('dailySummary', '==', true)
      .get();

    const results = [];

    for (const subDoc of subscribersSnapshot.docs) {
      const subData = subDoc.data();
      const userEmail = subData.email;
      const userName = subData.displayName || 'Friend';
      const userId = subDoc.id;

      if (!userEmail) continue;

      // 2. Fetch today's meals for this user
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const entriesSnapshot = await db.collection(`artifacts/default-app-id/users/${userId}/journal_entries`)
        .where('createdAt', '>=', today.getTime())
        .get();

      const meals = entriesSnapshot.docs.map(doc => doc.data());
      const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
      const mealCount = meals.length;

      // 3. Send the email using Resend
      // NOTE: To use a custom domain, verify it in your Resend dashboard at https://resend.com/domains
      // For testing, using the Resend sandbox address (only sends to verified emails in your Resend account)
      const { data, error } = await resend.emails.send({
        from: 'Nourish <onboarding@resend.dev>',
        to: [userEmail],
        subject: `Your Daily Nourish Summary: ${mealCount} meals today`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h1 style="color: #2D5A27;">Hey ${userName}! 🌱</h1>
            <p>Here is your daily summary from Nourish:</p>
            <div style="background: #f1f8e9; padding: 15px; border-radius: 10px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Meals Logged:</strong> ${mealCount}</p>
              <p style="margin: 5px 0;"><strong>Total Calories:</strong> ${totalCalories} kcal</p>
            </div>
            <p>Keep up the great work on your nutrition journey!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999;">You received this because you enabled Daily Summaries in your Nourish settings.</p>
          </div>
        `,
      });

      if (error) {
        results.push({ userId, status: 'error', error });
      } else {
        results.push({ userId, status: 'success', id: data.id });
      }
    }

    return res.status(200).json({ processed: results.length, results });
  } catch (error) {
    console.error('Reminder handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}
