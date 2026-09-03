import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Identifier is required' });
    }

    const email = identifier.includes('@') ? identifier : `${identifier}@example.com`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'muzammilshaik826@gmail.com',
        pass: 'gfge zbjv zlsx ouhx'
      }
    });

    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const mailOptions = {
      from: 'muzammilshaik826@gmail.com',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="https://www.goldenfoodbowl.com/customer/reset-password?token=${resetToken}">Reset Password</a>
        <p>If you did not request this, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Password reset link sent successfully to your email.'
    });
  } catch (error) {
    console.error('SMTP Error:', error);
    res.status(500).json({ error: 'Failed to send reset link.' });
  }
}
