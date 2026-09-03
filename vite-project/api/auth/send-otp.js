import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'muzammilshaik826@gmail.com',
        pass: 'gfge zbjv zlsx ouhx'
      }
    });

    const mailOptions = {
      from: 'muzammilshaik826@gmail.com',
      to: email,
      subject: 'Your Verification Code',
      html: `
        <h1>Verification Code</h1>
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>Please enter this code to verify your email address.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    // In a real app we'd save this to DB. For prototype, we'll just succeed.
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully.'
    });
  } catch (error) {
    console.error('SMTP Error:', error);
    res.status(500).json({ error: 'Failed to send OTP.' });
  }
}
