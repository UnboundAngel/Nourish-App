import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email query parameter is required' });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Nourish Test <onboarding@resend.dev>',
      to: [email],
      subject: 'Nourish Service: System Connection Test',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; border: 2px solid #2D5A27; border-radius: 20px;">
          <h1 style="color: #2D5A27;">Connection Successful! 🚀</h1>
          <p>Your NourishApp service is correctly communicating with Resend.</p>
          <p><strong>Target Email:</strong> ${email}</p>
          <p><strong>Environment:</strong> Vercel Serverless</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">This is a one-time test email triggered manually.</p>
        </div>
      `,
    });

    if (error) {
      return res.status(400).json({ error });
    }

    return res.status(200).json({ status: 'Email dispatched successfully', id: data.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
