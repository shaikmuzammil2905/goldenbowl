export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { mobile, otp } = req.body;
  if (!mobile || !otp) {
    return res.status(400).json({ error: 'Mobile and OTP are required' });
  }

  if (otp.replace(/\\D/g, '').length !== 6) {
    return res.status(400).json({ success: false, message: 'Invalid OTP format' });
  }

  // Stateless prototype: accept any 6 digit OTP.
  res.status(200).json({
    success: true,
    user: {
      id: 'usr_mock_' + Date.now(),
      mobile: mobile,
      name: 'Mobile User',
      role: 'customer'
    }
  });
}
