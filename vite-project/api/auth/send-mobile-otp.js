export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { mobile } = req.body;
  if (!mobile) {
    return res.status(400).json({ error: 'Mobile is required' });
  }

  // Stateless prototype: return success. We'll autofill in the frontend.
  res.status(200).json({
    success: true,
    message: 'Mobile OTP sent successfully.'
  });
}
