import { Resend } from 'resend';
import admin from 'firebase-admin';

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
  const { secret } = req.query;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const subscribersSnapshot = await db.collection('artifacts/default-app-id/email_subscribers')
      .where('weeklySummary', '==', true)
      .get();

    const results = [];

    for (const subDoc of subscribersSnapshot.docs) {
      const subData = subDoc.data();
      const userEmail = subData.email;
      const userName = subData.displayName || 'Friend';
      const userId = subDoc.id;

      if (!userEmail) continue;

      // Fetch last 7 days of entries
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);

      const entriesSnapshot = await db.collection(`artifacts/default-app-id/users/${userId}/journal_entries`)
        .where('createdAt', '>=', weekAgo.getTime())
        .get();

      const meals = entriesSnapshot.docs.map(doc => doc.data());
      const totalMeals = meals.length;

      // Totals
      const totals = meals.reduce((acc, m) => ({
        calories: acc.calories + (m.calories || 0),
        protein: acc.protein + (m.protein || 0),
        carbs: acc.carbs + (m.carbs || 0),
        fats: acc.fats + (m.fats || 0),
      }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

      // Feelings
      const feelings = { good: 0, okay: 0, sick: 0, bloated: 0 };
      meals.forEach(m => {
        const f = m.feeling || 'good';
        if (feelings[f] !== undefined) feelings[f]++;
      });

      // Per-day breakdown
      const dayMap = {};
      meals.forEach(m => {
        const dayStr = new Date(m.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        if (!dayMap[dayStr]) dayMap[dayStr] = { calories: 0, meals: 0 };
        dayMap[dayStr].calories += (m.calories || 0);
        dayMap[dayStr].meals++;
      });

      // Meal type breakdown
      const mealTypes = { Breakfast: 0, Lunch: 0, Dinner: 0, Snack: 0 };
      meals.forEach(m => {
        const t = m.type || 'Snack';
        if (mealTypes[t] !== undefined) mealTypes[t]++;
      });

      // Averages
      const daysActive = Object.keys(dayMap).length || 1;
      const avgCalories = Math.round(totals.calories / daysActive);
      const avgProtein = Math.round(totals.protein / daysActive);

      // Targets
      const targets = subData.dailyTargets || { calories: 2000, protein: 150, carbs: 250, fats: 65 };
      const avgCalPct = targets.calories > 0 ? Math.round((avgCalories / targets.calories) * 100) : 0;

      // Insight
      let insight = '';
      if (totalMeals === 0) {
        insight = "No meals were logged this week. Try to track at least one meal a day!";
      } else {
        const parts = [];
        if (avgCalPct >= 90 && avgCalPct <= 110) {
          parts.push(`Your average daily intake of ${avgCalories} kcal was right on target.`);
        } else if (avgCalPct < 90) {
          parts.push(`You averaged ${avgCalories} kcal/day — ${100 - avgCalPct}% below your goal.`);
        } else {
          parts.push(`You averaged ${avgCalories} kcal/day — ${avgCalPct - 100}% above your goal.`);
        }
        parts.push(`You logged ${totalMeals} meals across ${daysActive} active days.`);
        const goodPct = totalMeals > 0 ? Math.round((feelings.good / totalMeals) * 100) : 0;
        const issues = feelings.sick + feelings.bloated;
        if (goodPct >= 80) {
          parts.push(`You felt good after ${goodPct}% of your meals — great work!`);
        } else if (issues > 0) {
          parts.push(`${issues} meals left you feeling unwell. Review those meals for patterns.`);
        }
        insight = parts.join(' ');
      }

      // Day rows HTML
      const dayRowsHtml = Object.entries(dayMap).map(([day, data]) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-weight: 600;">${day}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0;">${data.meals} meals</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-weight: 700;">${data.calories} kcal</td>
        </tr>
      `).join('');

      // Feeling bar
      const feelingBarHtml = totalMeals > 0 ? Object.entries(feelings).map(([f, count]) => {
        const pct = Math.round((count / totalMeals) * 100);
        if (pct === 0) return '';
        const colors = { good: '#4ade80', okay: '#fbbf24', sick: '#fb7185', bloated: '#c084fc' };
        return `<div style="width: ${pct}%; height: 12px; background: ${colors[f]};"></div>`;
      }).join('') : '';

      const { data, error } = await resend.emails.send({
        from: 'Nourish <onboarding@resend.dev>',
        to: [userEmail],
        subject: `Your Weekly Nourish Report: ${totalMeals} meals, ${totals.calories} total kcal`,
        html: `
          <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background: linear-gradient(135deg, #1e40af, #6366f1); padding: 30px; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Weekly Report 📊</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Hey ${userName}, here's your week in review</p>
            </div>
            
            <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
              
              <!-- Week Totals -->
              <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                <div style="flex: 1; background: #f1f8e9; padding: 16px; border-radius: 12px; text-align: center;">
                  <div style="font-size: 28px; font-weight: 800; color: #2D5A27;">${totals.calories}</div>
                  <div style="font-size: 11px; color: #666; text-transform: uppercase;">Total Cal</div>
                </div>
                <div style="flex: 1; background: #f0fdf4; padding: 16px; border-radius: 12px; text-align: center;">
                  <div style="font-size: 28px; font-weight: 800; color: #16a34a;">${totals.protein}g</div>
                  <div style="font-size: 11px; color: #666; text-transform: uppercase;">Protein</div>
                </div>
                <div style="flex: 1; background: #fff7ed; padding: 16px; border-radius: 12px; text-align: center;">
                  <div style="font-size: 28px; font-weight: 800; color: #ea580c;">${totals.carbs}g</div>
                  <div style="font-size: 11px; color: #666; text-transform: uppercase;">Carbs</div>
                </div>
                <div style="flex: 1; background: #eff6ff; padding: 16px; border-radius: 12px; text-align: center;">
                  <div style="font-size: 28px; font-weight: 800; color: #2563eb;">${totals.fats}g</div>
                  <div style="font-size: 11px; color: #666; text-transform: uppercase;">Fats</div>
                </div>
              </div>

              <!-- Stats Row -->
              <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                <div style="flex: 1; background: #faf5ff; padding: 14px; border-radius: 12px; text-align: center;">
                  <div style="font-size: 22px; font-weight: 800; color: #7c3aed;">${totalMeals}</div>
                  <div style="font-size: 11px; color: #666;">Total Meals</div>
                </div>
                <div style="flex: 1; background: #fefce8; padding: 14px; border-radius: 12px; text-align: center;">
                  <div style="font-size: 22px; font-weight: 800; color: #ca8a04;">${avgCalories}</div>
                  <div style="font-size: 11px; color: #666;">Avg Cal/Day</div>
                </div>
                <div style="flex: 1; background: #f0fdf4; padding: 14px; border-radius: 12px; text-align: center;">
                  <div style="font-size: 22px; font-weight: 800; color: #16a34a;">${daysActive}/7</div>
                  <div style="font-size: 11px; color: #666;">Days Active</div>
                </div>
              </div>

              <!-- Insight -->
              <div style="background: #eef2ff; border-left: 4px solid #6366f1; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: #3730a3;">💡 Weekly Insight</p>
                <p style="margin: 4px 0 0; font-size: 13px; color: #4338ca;">${insight}</p>
              </div>

              <!-- Feeling Bar -->
              ${totalMeals > 0 ? `
              <h3 style="font-size: 13px; color: #333; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">How You Felt</h3>
              <div style="display: flex; border-radius: 6px; overflow: hidden; margin-bottom: 8px;">
                ${feelingBarHtml}
              </div>
              <div style="display: flex; gap: 12px; font-size: 11px; color: #666; margin-bottom: 20px;">
                <span>😊 ${feelings.good}</span>
                <span>😐 ${feelings.okay}</span>
                <span>🤢 ${feelings.sick}</span>
                <span>😣 ${feelings.bloated}</span>
              </div>
              ` : ''}

              <!-- Day Breakdown -->
              ${Object.keys(dayMap).length > 0 ? `
              <h3 style="font-size: 13px; color: #333; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1px;">Daily Breakdown</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 8px 12px; text-align: left; font-size: 11px; color: #666; text-transform: uppercase;">Day</th>
                    <th style="padding: 8px 12px; text-align: left; font-size: 11px; color: #666; text-transform: uppercase;">Meals</th>
                    <th style="padding: 8px 12px; text-align: left; font-size: 11px; color: #666; text-transform: uppercase;">Calories</th>
                  </tr>
                </thead>
                <tbody>${dayRowsHtml}</tbody>
              </table>
              ` : ''}

              <!-- Meal Type Breakdown -->
              <div style="margin-top: 20px; display: flex; gap: 8px;">
                ${Object.entries(mealTypes).map(([type, count]) => `
                  <div style="flex: 1; background: #f9fafb; padding: 10px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 18px; font-weight: 800; color: #333;">${count}</div>
                    <div style="font-size: 10px; color: #999; text-transform: uppercase;">${type}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <div style="background: #f9fafb; padding: 16px 24px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="font-size: 11px; color: #999; margin: 0;">You received this because you enabled Weekly Summaries in your Nourish settings.</p>
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
    console.error('Weekly report handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}
