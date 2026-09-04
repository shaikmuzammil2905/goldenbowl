import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// ── SMTP Credential Validation ───────────────────────────────────────────────
// Validate required variables at module load time — fail early if misconfigured.
const missingVars: string[] = [];
if (!env.SMTP_HOST) missingVars.push('SMTP_HOST');
if (!env.SMTP_USER) missingVars.push('SMTP_USER');
if (!env.SMTP_PASS) missingVars.push('SMTP_PASS');
if (!env.SMTP_FROM) missingVars.push('SMTP_FROM');

if (missingVars.length > 0) {
  console.error(`❌ SMTP configuration incomplete. Missing: ${missingVars.join(', ')}`);
  console.error('   Email OTP will be unavailable until these are set in environment variables.');
}

// ── SMTP Transporter ─────────────────────────────────────────────────────────
// Single reusable Nodemailer transporter — connection is pooled by Nodemailer.
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,        // smtp.gmail.com
  port: env.SMTP_PORT,        // 587 (STARTTLS) or 465 (SSL)
  secure: env.SMTP_SECURE,    // false = STARTTLS; true only for port 465
  auth: {
    user: env.SMTP_USER,      // Gmail address (from SMTP_USER env var)
    pass: env.SMTP_PASS,      // 16-char Google App Password (from SMTP_PASS env var)
  },
  tls: {
    rejectUnauthorized: true, // Enforce strict TLS certificate validation
  },
  connectionTimeout: 15000,   // 15 seconds connection timeout
  greetingTimeout: 10000,     // 10 seconds greeting timeout
  socketTimeout: 30000,       // 30 seconds socket timeout
});

// ── SMTP Startup Verification ─────────────────────────────────────────────────
// Called once when the module is first imported (server startup).
// Logs connection state without blocking the server from starting.
if (missingVars.length === 0) {
  transporter.verify((error) => {
    if (error) {
      // Log the category of error, NOT the credentials
      const message = error.message || '';
      if (message.includes('Invalid login') || message.includes('Username and Password') || message.includes('535')) {
        console.error('❌ SMTP authentication failed. Verify SMTP_USER and SMTP_PASS in environment variables.');
        console.error('   Gmail: make sure 2-Step Verification is enabled and SMTP_PASS is a valid App Password.');
      } else if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
        console.error(`❌ SMTP connection refused to ${env.SMTP_HOST}:${env.SMTP_PORT}. Check host/port/firewall.`);
      } else if (message.includes('ETIMEDOUT')) {
        console.error(`❌ SMTP connection timed out to ${env.SMTP_HOST}:${env.SMTP_PORT}. Check network/firewall.`);
      } else {
        console.error('❌ SMTP connection error:', message.substring(0, 120));
      }
    } else {
      console.log(`✅ SMTP ready — ${env.SMTP_HOST}:${env.SMTP_PORT} → ${env.SMTP_USER}`);
    }
  });
} else {
  console.warn('⚠️  SMTP transporter created but not verified (missing configuration).');
}

// ── Email Service Functions ───────────────────────────────────────────────────

/**
 * Sends a 6-digit OTP verification email to the given address.
 *
 * SECURITY:
 * - `otp` is the plaintext OTP; it is embedded in the email body only — never returned by API.
 * - No credentials are logged or exposed.
 * - If this function throws, the caller (authController) invalidates the OTP record immediately.
 *
 * @param toEmail   Recipient email address (already validated by caller)
 * @param otp       Plaintext 6-digit OTP (generated securely by crypto.randomInt)
 * @param userName  Optional display name for greeting personalization
 */
export async function sendOtpEmail(
  toEmail: string,
  otp: string,
  userName?: string
): Promise<void> {
  if (missingVars.length > 0) {
    throw new Error(
      `Email service is not configured (missing: ${missingVars.join(', ')}). Please contact support.`
    );
  }

  const displayName = userName
    ? userName.charAt(0).toUpperCase() + userName.slice(1)
    : 'there';

  const mailOptions = {
    from: env.SMTP_FROM,
    to: toEmail,
    subject: `${otp} is your Golden Food Bowl login code`,
    // Plain-text fallback (for clients that don't render HTML)
    text: [
      `Hi ${displayName},`,
      '',
      `Your Golden Food Bowl verification code is: ${otp}`,
      '',
      'This code expires in 10 minutes.',
      'If you did not request this code, you can safely ignore this email.',
      '',
      '— Golden Food Bowl Team',
      'Fresh • Tasty • Fast | goldenfoodbowl.com',
    ].join('\n'),
    // Branded HTML email
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Golden Food Bowl Login Code</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:20px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,0.09);max-width:480px;width:100%;">

          <!-- ── Header ─────────────────────────────────────── -->
          <tr>
            <td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);
                        padding:36px 32px;text-align:center;">
              <img
                src="https://res.cloudinary.com/dwmjz9csc/image/upload/v1787120716/image-removebg-preview_e1wfil.png"
                alt="Golden Food Bowl"
                width="64"
                style="height:64px;width:auto;display:block;margin:0 auto 12px;" />
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:900;
                          letter-spacing:1px;line-height:1.2;">GOLDEN FOOD BOWL</h1>
              <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">
                Fresh &bull; Tasty &bull; Fast
              </p>
            </td>
          </tr>

          <!-- ── Body ──────────────────────────────────────── -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="font-size:16px;color:#374151;margin:0 0 6px;font-weight:600;">
                Hi ${displayName} 👋
              </p>
              <p style="font-size:15px;color:#6b7280;margin:0 0 28px;line-height:1.6;">
                Use the one-time code below to sign in to your
                <strong style="color:#d97706;">Golden Food Bowl</strong> account.
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#fffbeb;border:2px dashed #f59e0b;
                              border-radius:16px;padding:28px 20px;text-align:center;">
                    <p style="font-size:11px;color:#92400e;margin:0 0 10px;
                               text-transform:uppercase;letter-spacing:3px;font-weight:700;">
                      Your Login Code
                    </p>
                    <span style="font-size:48px;font-weight:900;letter-spacing:14px;
                                  color:#d97706;font-family:'Courier New',Courier,monospace;
                                  display:inline-block;line-height:1;">
                      ${otp}
                    </span>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#f0fdf4;border-left:3px solid #22c55e;
                              border-radius:8px;padding:12px 16px;margin-bottom:16px;">
                    <p style="font-size:13px;color:#166534;margin:0;">
                      ⏱ &nbsp;This code expires in <strong>10 minutes</strong>.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;color:#9ca3af;margin:16px 0 0;line-height:1.5;">
                🔒 If you didn't request this code, you can safely ignore this email.
                Your account remains secure.
              </p>
            </td>
          </tr>

          <!-- ── Footer ─────────────────────────────────────── -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;
                        padding:20px 32px;text-align:center;">
              <p style="font-size:12px;color:#6b7280;margin:0 0 4px;">
                &copy; 2026 Golden Food Bowl. All rights reserved.
              </p>
              <p style="font-size:11px;color:#9ca3af;margin:0;">
                Bengaluru, India &nbsp;&bull;&nbsp;
                <a href="https://goldenfoodbowl.com"
                   style="color:#d97706;text-decoration:none;">goldenfoodbowl.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };

  // Send — throws on delivery failure; caller handles the error
  const info = await transporter.sendMail(mailOptions);
  // Log delivery confirmation without revealing OTP or credentials
  console.log(`📧 OTP email dispatched to ${toEmail} [messageId: ${info.messageId}]`);
}

/**
 * Sends a password reset email containing both a 6-digit verification OTP
 * and a secure one-click reset link.
 *
 * @param toEmail    Recipient email address (already validated by caller)
 * @param resetToken The unique reset token embedded in the reset URL
 * @param userName   Optional display name for greeting personalization
 * @param otp        Optional 6-digit OTP code for on-screen entry
 * @param role       Optional user role to route link to delivery or customer portal
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  resetToken: string,
  userName?: string,
  otp?: string,
  role?: string
): Promise<void> {
  if (missingVars.length > 0) {
    throw new Error(
      `Email service is not configured (missing: ${missingVars.join(', ')}). Please contact support.`
    );
  }

  const displayName = userName
    ? userName.charAt(0).toUpperCase() + userName.slice(1)
    : 'there';

  const isDelivery = role?.toUpperCase() === 'DELIVERY';
  const rolePath = isDelivery ? 'delivery' : 'customer';

  // Build reset URL — use frontend URL from env
  const frontendOrigin = (process.env.FRONTEND_URL || 'https://www.goldenfoodbowl.com').split(',')[0].trim();
  const resetUrl = `${frontendOrigin}/${rolePath}/reset-password?token=${resetToken}&email=${encodeURIComponent(toEmail)}`;

  const mailOptions = {
    from: env.SMTP_FROM,
    to: toEmail,
    subject: otp ? `${otp} is your Golden Food Bowl Password Reset OTP` : 'Reset your Golden Food Bowl password',
    text: [
      `Hi ${displayName},`,
      '',
      'We received a request to reset your Golden Food Bowl account password.',
      '',
      otp ? `Your password reset OTP is: ${otp}` : '',
      '',
      'You can also reset your password directly using the secure link below:',
      resetUrl,
      '',
      'This code and link expire in 15 minutes.',
      'If you did not request a password reset, you can safely ignore this email.',
      '',
      '— Golden Food Bowl Team',
      'Fresh • Tasty • Fast | goldenfoodbowl.com',
    ].filter(Boolean).join('\n'),
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password – Golden Food Bowl</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:20px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,0.09);max-width:480px;width:100%;">

          <!-- ── Header ─────────────────────────────────────── -->
          <tr>
            <td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);
                        padding:36px 32px;text-align:center;">
              <img
                src="https://res.cloudinary.com/dwmjz9csc/image/upload/v1787120716/image-removebg-preview_e1wfil.png"
                alt="Golden Food Bowl"
                width="64"
                style="height:64px;width:auto;display:block;margin:0 auto 12px;" />
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:900;
                          letter-spacing:1px;line-height:1.2;">GOLDEN FOOD BOWL</h1>
              <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">
                ${isDelivery ? 'Delivery Partner Portal' : 'Fresh &bull; Tasty &bull; Fast'}
              </p>
            </td>
          </tr>

          <!-- ── Body ──────────────────────────────────────── -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="font-size:16px;color:#374151;margin:0 0 6px;font-weight:600;">
                Hi ${displayName} 👋
              </p>
              <p style="font-size:15px;color:#6b7280;margin:0 0 24px;line-height:1.6;">
                We received a request to reset your
                <strong style="color:#d97706;">Golden Food Bowl</strong> account password.
                You can verify using the OTP code or click the button below.
              </p>

              ${otp ? `
              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#fffbeb;border:2px dashed #f59e0b;
                              border-radius:16px;padding:24px 20px;text-align:center;">
                    <p style="font-size:11px;color:#92400e;margin:0 0 8px;
                               text-transform:uppercase;letter-spacing:3px;font-weight:700;">
                      Password Reset OTP Code
                    </p>
                    <span style="font-size:42px;font-weight:900;letter-spacing:12px;
                                  color:#d97706;font-family:'Courier New',Courier,monospace;
                                  display:inline-block;line-height:1;">
                      ${otp}
                    </span>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Reset Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);
                              color:#ffffff;text-decoration:none;padding:16px 40px;
                              border-radius:12px;font-size:16px;font-weight:800;
                              letter-spacing:0.5px;box-shadow:0 4px 14px rgba(217,119,6,0.4);">
                      🔐 Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td style="background:#fffbeb;border:1px solid #fde68a;
                              border-radius:10px;padding:12px 16px;">
                    <p style="font-size:12px;color:#92400e;margin:0;line-height:1.5;">
                      If the button doesn't work, copy and paste this link into your browser:<br/>
                      <a href="${resetUrl}" style="color:#d97706;word-break:break-all;font-size:11px;">${resetUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#f0fdf4;border-left:3px solid #22c55e;
                              border-radius:8px;padding:12px 16px;">
                    <p style="font-size:13px;color:#166534;margin:0;">
                      ⏱ &nbsp;This OTP and link expire in <strong>15 minutes</strong>.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;color:#9ca3af;margin:16px 0 0;line-height:1.5;">
                🔒 If you didn't request this, you can safely ignore this email.
                Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- ── Footer ─────────────────────────────────────── -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;
                        padding:20px 32px;text-align:center;">
              <p style="font-size:12px;color:#6b7280;margin:0 0 4px;">
                &copy; 2026 Golden Food Bowl. All rights reserved.
              </p>
              <p style="font-size:11px;color:#9ca3af;margin:0;">
                Bengaluru, India &nbsp;&bull;&nbsp;
                <a href="https://goldenfoodbowl.com"
                   style="color:#d97706;text-decoration:none;">goldenfoodbowl.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Password reset email dispatched to ${toEmail} [messageId: ${info.messageId}]`);
}

