import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const displayName = name || 'Friend';

  try {
    const { data, error } = await resend.emails.send({
      from: 'Nourish <onboarding@resend.dev>',
      to: [email],
      subject: `Welcome to Nourish, ${displayName}! 🌱`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2D5A27, #4a8c3f); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 12px;">🌱</div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">Welcome to Nourish!</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0; font-size: 15px;">Your personal nutrition companion</p>
          </div>
          
          <!-- Body -->
          <div style="background: white; padding: 32px 28px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
              Hey <strong>${displayName}</strong>! 👋
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #444; margin: 0 0 24px;">
              Thanks for joining Nourish. We're excited to help you track your nutrition, build healthy habits, and feel your best — one meal at a time.
            </p>

            <!-- Feature Cards -->
            <div style="margin-bottom: 24px;">
              <div style="background: #f1f8e9; padding: 16px 20px; border-radius: 12px; margin-bottom: 10px;">
                <strong style="color: #2D5A27;">📊 Track Your Meals</strong>
                <p style="margin: 6px 0 0; font-size: 13px; color: #555;">Log breakfast, lunch, dinner & snacks with full macro tracking — calories, protein, carbs, and fats.</p>
              </div>
              <div style="background: #eff6ff; padding: 16px 20px; border-radius: 12px; margin-bottom: 10px;">
                <strong style="color: #1d4ed8;">💧 Stay Hydrated</strong>
                <p style="margin: 6px 0 0; font-size: 13px; color: #555;">Track your water intake throughout the day with quick-add buttons.</p>
              </div>
              <div style="background: #fefce8; padding: 16px 20px; border-radius: 12px; margin-bottom: 10px;">
                <strong style="color: #854d0e;">🔥 Build Your Streak</strong>
                <p style="margin: 6px 0 0; font-size: 13px; color: #555;">Log meals daily to grow your Nourish Garden and unlock new milestones.</p>
              </div>
              <div style="background: #fdf2f8; padding: 16px 20px; border-radius: 12px;">
                <strong style="color: #9d174d;">📈 Discover Patterns</strong>
                <p style="margin: 6px 0 0; font-size: 13px; color: #555;">Our insights engine finds connections between what you eat and how you feel.</p>
              </div>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin: 28px 0 8px;">
              <a href="https://nourish-app-psi.vercel.app" style="display: inline-block; background: linear-gradient(135deg, #2D5A27, #4a8c3f); color: white; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-weight: 700; font-size: 15px; letter-spacing: 0.5px;">
                Start Logging →
              </a>
            </div>

            <p style="font-size: 13px; color: #888; text-align: center; margin: 20px 0 0;">
              Pro tip: Enable notifications in Settings to get personalized meal reminders!
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px 28px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
            <p style="font-size: 11px; color: #999; margin: 0;">Made with 💚 by the Nourish team</p>
            <p style="font-size: 11px; color: #bbb; margin: 6px 0 0;">This is a one-time welcome email. You won't receive marketing emails unless you opt in.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (error) {
    console.error('Welcome email error:', error);
    return res.status(500).json({ error: error.message });
  }
}
