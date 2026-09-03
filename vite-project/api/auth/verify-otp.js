export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  if (otp.replace(/\\D/g, '').length !== 6) {
    return res.status(400).json({ success: false, message: 'Invalid OTP format' });
  }

  // Stateless prototype: accept any 6 digit OTP.
  // In a real app we'd verify against a database.
  res.status(200).json({
    success: true,
    user: {
      id: 'usr_mock_' + Date.now(),
      email: email,
      name: email.split('@')[0],
      role: 'customer'
    }
  });
}
