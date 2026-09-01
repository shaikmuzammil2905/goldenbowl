/**
 * Golden Food Bowl — SMTP Connection & Email Delivery Test
 *
 * USAGE (from backend/ directory):
 *   npx tsx src/utils/testSmtp.ts <recipient-email>
 *
 * Example:
 *   npx tsx src/utils/testSmtp.ts shaikmuzammil2905@gmail.com
 *
 * This script:
 *   1. Reads SMTP config from .env (via dotenv)
 *   2. Creates a Nodemailer transporter
 *   3. Verifies SMTP connection + authentication
 *   4. Sends a real test OTP email to the provided address
 *   5. Reports success or the exact failure category
 *
 * SECURITY: No credentials are printed. The test OTP is fake (000000) — not for auth use.
 */

import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || '';

const recipient = process.argv[2];

async function main() {
  console.log('\n🔍 Golden Food Bowl — SMTP Configuration Test');
  console.log('━'.repeat(52));

  // 1. Validate config
  const missing: string[] = [];
  if (!SMTP_HOST) missing.push('SMTP_HOST');
  if (!SMTP_USER) missing.push('SMTP_USER');
  if (!SMTP_PASS) missing.push('SMTP_PASS');
  if (!SMTP_FROM) missing.push('SMTP_FROM');

  if (missing.length > 0) {
    console.error(`\n❌ Missing environment variables: ${missing.join(', ')}`);
    console.error('   Make sure backend/.env has all SMTP_* values set.\n');
    process.exit(1);
  }

  if (!recipient || !recipient.includes('@')) {
    console.error('\n❌ Usage: npx tsx src/utils/testSmtp.ts <recipient-email>');
    console.error('   Example: npx tsx src/utils/testSmtp.ts your@email.com\n');
    process.exit(1);
  }

  console.log(`\n📋 Config summary:`);
  console.log(`   Host  : ${SMTP_HOST}:${SMTP_PORT}`);
  console.log(`   Sender: ${SMTP_FROM}`);
  console.log(`   Auth  : ${SMTP_USER} (password: [hidden])`);
  console.log(`   To    : ${recipient}`);
  console.log();

  // 2. Create transporter
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: true },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
  });

  // 3. Verify connection
  process.stdout.write('⏳ Verifying SMTP connection...');
  try {
    await transporter.verify();
    console.log(' ✅ Connected and authenticated!');
  } catch (err: any) {
    console.log(' ❌ Failed');
    const msg = err.message || '';
    if (msg.includes('535') || msg.includes('Invalid login') || msg.includes('Username and Password')) {
      console.error('\n❌ Authentication failed.');
      console.error('   → Check SMTP_USER and SMTP_PASS in backend/.env');
      console.error('   → Gmail: ensure 2-Step Verification is enabled');
      console.error('   → Gmail: use a Google App Password (16 chars), not your normal password');
    } else if (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
      console.error(`\n❌ Cannot reach ${SMTP_HOST}:${SMTP_PORT}`);
      console.error('   → Check SMTP_HOST / SMTP_PORT values');
      console.error('   → Check your internet / firewall settings');
    } else if (msg.includes('ETIMEDOUT')) {
      console.error(`\n❌ Connection timed out to ${SMTP_HOST}:${SMTP_PORT}`);
      console.error('   → Your network may be blocking outbound SMTP on port 587');
    } else {
      console.error('\n❌ SMTP error:', msg.substring(0, 200));
    }
    process.exit(1);
  }

  // 4. Send test email (dummy OTP for diagnostic purposes only)
  process.stdout.write(`\n⏳ Sending test email to ${recipient}...`);
  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: recipient,
      subject: '🍲 Golden Food Bowl — SMTP Test Email',
      text: [
        'Hi there,',
        '',
        'This is a SMTP test email from Golden Food Bowl.',
        '',
        'If you received this message, your SMTP configuration is working correctly.',
        '',
        'Configuration verified:',
        `  Host: ${SMTP_HOST}:${SMTP_PORT}`,
        `  Sender: ${SMTP_FROM}`,
        '',
        '— Golden Food Bowl Backend',
        'goldenfoodbowl.com',
      ].join('\n'),
      html: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f3f4f6;padding:40px 16px;margin:0;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;
              box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px;text-align:center;">
      <img src="https://res.cloudinary.com/dwmjz9csc/image/upload/v1787120716/image-removebg-preview_e1wfil.png"
           alt="Golden Food Bowl" style="height:56px;margin-bottom:10px;" />
      <h1 style="color:#fff;margin:0;font-size:20px;font-weight:900;">GOLDEN FOOD BOWL</h1>
      <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:12px;">Fresh &bull; Tasty &bull; Fast</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#374151;font-size:15px;margin:0 0 16px;">✅ <strong>SMTP Test Successful!</strong></p>
      <p style="color:#6b7280;font-size:14px;margin:0 0 8px;">
        Your email service is configured and working correctly for Golden Food Bowl.
      </p>
      <p style="color:#6b7280;font-size:13px;margin:0;">
        Email OTP delivery will work for users who sign in via email.
      </p>
      <div style="margin-top:24px;background:#f0fdf4;border-left:3px solid #22c55e;
                  border-radius:8px;padding:12px 16px;">
        <p style="font-size:12px;color:#166534;margin:0;">
          Host: ${SMTP_HOST}:${SMTP_PORT} &nbsp;&bull;&nbsp; Sender: ${SMTP_FROM}
        </p>
      </div>
    </div>
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
      <p style="font-size:11px;color:#9ca3af;margin:0;">© 2026 Golden Food Bowl. Bengaluru, India.</p>
    </div>
  </div>
</body></html>`,
    });
    console.log(' ✅ Sent!');
    console.log(`\n🎉 SUCCESS — Email delivered!`);
    console.log(`   MessageId : ${info.messageId}`);
    console.log(`   Recipient : ${recipient}`);
    console.log(`   Check your inbox (and spam folder) for a message from "${SMTP_FROM}"\n`);
  } catch (err: any) {
    console.log(' ❌ Failed');
    console.error('\n❌ Email send failed:', (err.message || '').substring(0, 200));
    process.exit(1);
  }
}

main();
