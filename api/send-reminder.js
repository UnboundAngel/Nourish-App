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
      const totalProtein = meals.reduce((sum, m) => sum + (m.protein || 0), 0);
      const totalCarbs = meals.reduce((sum, m) => sum + (m.carbs || 0), 0);
      const totalFats = meals.reduce((sum, m) => sum + (m.fats || 0), 0);
      const mealCount = meals.length;

      // Feeling breakdown
      const feelings = { good: 0, okay: 0, sick: 0, bloated: 0 };
      meals.forEach(m => {
        const f = m.feeling || 'good';
        if (feelings[f] !== undefined) feelings[f]++;
      });

      // Macro goal insights
      const targets = subData.dailyTargets || { calories: 2000, protein: 150, carbs: 250, fats: 65 };
      const calPct = targets.calories > 0 ? Math.round((totalCalories / targets.calories) * 100) : 0;
      const protPct = targets.protein > 0 ? Math.round((totalProtein / targets.protein) * 100) : 0;

      let goalInsight = '';
      if (mealCount === 0) {
        goalInsight = "You haven't logged any meals today. Remember to track your nutrition!";
      } else if (calPct >= 90 && calPct <= 110) {
        goalInsight = `You hit your calorie goal perfectly at ${calPct}%! Great job staying on track.`;
      } else if (calPct < 90) {
        goalInsight = `You're at ${calPct}% of your calorie goal. Consider having another nutritious meal or snack.`;
      } else {
        goalInsight = `You went ${calPct - 100}% over your calorie goal today. No worries — balance it out tomorrow!`;
      }

      // Feeling insight
      let feelingInsight = '';
      const totalFeelings = Object.values(feelings).reduce((a, b) => a + b, 0);
      if (totalFeelings > 0) {
        const goodPct = Math.round((feelings.good / totalFeelings) * 100);
        const issues = feelings.sick + feelings.bloated;
        if (goodPct >= 80) {
          feelingInsight = `You felt great after ${goodPct}% of your meals today — keep it up!`;
        } else if (issues > 0) {
          feelingInsight = `${issues} meal${issues > 1 ? 's' : ''} left you feeling unwell. Consider reviewing what you ate for patterns.`;
        }
      }

      // Meal details list
      const mealListHtml = meals.map(m => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-weight: 600;">${m.name || 'Unnamed'}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; color: #666;">${m.type || 'Meal'}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-weight: 700;">${m.calories || 0} kcal</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0;">${m.feeling === 'sick' ? '🤢' : m.feeling === 'bloated' ? '😣' : m.feeling === 'okay' ? '😐' : '😊'}</td>
        </tr>
      `).join('');

      // 3. Send the email using Resend
      const { data, error } = await resend.emails.send({
        from: 'Nourish <onboarding@resend.dev>',
        to: [userEmail],
        subject: `Your Daily Nourish Summary: ${mealCount} meals, ${totalCalories} kcal`,
        html: `
          <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background: linear-gradient(135deg, #2D5A27, #4a8c3f); padding: 30px; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Hey ${userName}! 🌱</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Here's your daily nutrition summary</p>
            </div>
            
            <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
              
              <!-- Macro Overview -->
              <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                <div style="flex: 1; background: #f1f8e9; padding: 16px; border-radius: 12px; text-align: center;">
                  <div style="font-size: 28px; font-weight: 800; color: #2D5A27;">${totalCalories}</div>
                  <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Calories</div>
                </div>
                <div style="flex: 1; background: #f0fdf4; padding: 16px; border-radius: 12px; text-align: center;">
                  <div style="font-size: 28px; font-weight: 800; color: #16a34a;">${totalProtein}g</div>
                  <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Protein</div>
                </div>
                <div style="flex: 1; background: #fff7ed; padding: 16px; border-radius: 12px; text-align: center;">
                  <div style="font-size: 28px; font-weight: 800; color: #ea580c;">${totalCarbs}g</div>
                  <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Carbs</div>
                </div>
                <div style="flex: 1; background: #eff6ff; padding: 16px; border-radius: 12px; text-align: center;">
                  <div style="font-size: 28px; font-weight: 800; color: #2563eb;">${totalFats}g</div>
                  <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Fats</div>
                </div>
              </div>

              <!-- Goal Insight -->
              <div style="background: #fefce8; border-left: 4px solid #eab308; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 16px;">
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: #854d0e;">🎯 Goal Check: ${calPct}% of daily calories</p>
                <p style="margin: 4px 0 0; font-size: 13px; color: #92400e;">${goalInsight}</p>
              </div>

              ${feelingInsight ? `
              <!-- Feeling Insight -->
              <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 16px;">
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: #166534;">💚 How You Felt</p>
                <p style="margin: 4px 0 0; font-size: 13px; color: #15803d;">${feelingInsight}</p>
              </div>
              ` : ''}

              ${mealCount > 0 ? `
              <!-- Meal Details -->
              <h3 style="font-size: 14px; color: #333; margin: 20px 0 10px; text-transform: uppercase; letter-spacing: 1px;">Today's Meals</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 8px 12px; text-align: left; font-size: 11px; color: #666; text-transform: uppercase;">Meal</th>
                    <th style="padding: 8px 12px; text-align: left; font-size: 11px; color: #666; text-transform: uppercase;">Type</th>
                    <th style="padding: 8px 12px; text-align: left; font-size: 11px; color: #666; text-transform: uppercase;">Calories</th>
                    <th style="padding: 8px 12px; text-align: left; font-size: 11px; color: #666; text-transform: uppercase;">Feeling</th>
                  </tr>
                </thead>
                <tbody>${mealListHtml}</tbody>
              </table>
              ` : ''}
            </div>
            
            <div style="background: #f9fafb; padding: 16px 24px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="font-size: 11px; color: #999; margin: 0;">You received this because you enabled Daily Summaries in your Nourish settings.</p>
            </div>
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
