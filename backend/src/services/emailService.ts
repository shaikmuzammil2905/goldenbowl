import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// Create reusable transporter using SMTP
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false, // true for port 465, false for 587 (STARTTLS)
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

// Verify SMTP connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('❌ SMTP connection failed:', error.message);
  } else {
    console.log('✅ SMTP server connected — Nodemailer ready to send emails');
  }
});

export async function sendOtpEmail(toEmail: string, otp: string, userName?: string): Promise<void> {
  const mailOptions = {
    from: env.SMTP_FROM,
    to: toEmail,
    subject: `${otp} is your Golden Food Bowl login code`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
        <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:36px 32px;text-align:center;">
            <img src="https://res.cloudinary.com/dwmjz9csc/image/upload/v1787120716/image-removebg-preview_e1wfil.png"
                 alt="Golden Food Bowl" style="height:64px;margin-bottom:12px;" />
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:900;letter-spacing:1px;">GOLDEN FOOD BOWL</h1>
            <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">Fresh • Tasty • Fast</p>
          </div>
          <!-- Body -->
          <div style="padding:36px 32px;">
            <p style="font-size:16px;color:#374151;margin:0 0 8px;">Hi ${userName || 'there'} 👋</p>
            <p style="font-size:15px;color:#6b7280;margin:0 0 28px;">
              Use the code below to sign in to your Golden Food Bowl account.
            </p>
            <!-- OTP Box -->
            <div style="background:#fffbeb;border:2px dashed #f59e0b;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
              <p style="font-size:12px;color:#92400e;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Your Login Code</p>
              <span style="font-size:48px;font-weight:900;letter-spacing:14px;color:#d97706;font-family:'Courier New',monospace;">${otp}</span>
            </div>
            <p style="font-size:13px;color:#9ca3af;margin:0 0 6px;">⏱ This code expires in <strong>10 minutes</strong>.</p>
            <p style="font-size:13px;color:#9ca3af;margin:0;">🔒 If you didn't request this, you can safely ignore this email.</p>
          </div>
          <!-- Footer -->
          <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
            <p style="font-size:12px;color:#9ca3af;margin:0;">© 2026 Golden Food Bowl. All rights reserved.</p>
            <p style="font-size:11px;color:#d1d5db;margin:4px 0 0;">Bengaluru, India</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Your Golden Food Bowl OTP is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, ignore this email.`,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 OTP email sent to ${toEmail}`);
}
