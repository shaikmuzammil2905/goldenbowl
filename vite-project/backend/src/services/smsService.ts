import { env } from '../config/env.js';

export interface SmsSendResult {
  sent: boolean;
  provider: string;
  error?: string;
}

/**
 * Normalizes and validates Indian (+91) mobile numbers.
 * Returns clean 10-digit number (e.g., '9876543210') or null if invalid.
 */
export function normalizeIndianMobile(rawMobile: string): string | null {
  if (!rawMobile || typeof rawMobile !== 'string') return null;

  // Remove all non-digits
  let digits = rawMobile.replace(/\D/g, '');

  // Handle +91 or 91 prefix (12 digits)
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  // Handle leading 0 prefix (11 digits)
  else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Valid Indian mobile numbers are 10 digits starting with 6, 7, 8, or 9
  if (/^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }

  return null;
}

/**
 * Sends a real 6-digit SMS OTP to a verified Indian mobile number.
 * Supports Fast2SMS (primary for India) and Twilio (fallback).
 * Strictly requires active API key from environment variables.
 */
export async function sendMobileOtpSms(cleanNumber: string, otp: string): Promise<SmsSendResult> {
  // 1. Fast2SMS API Gateway (Recommended for Indian numbers)
  const fast2SmsKey = process.env.FAST2SMS_API_KEY;
  if (fast2SmsKey && fast2SmsKey.trim().length > 0) {
    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: fast2SmsKey.trim(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: cleanNumber,
        }),
      });

      const data = (await response.json()) as any;
      if (data && (data.return === true || data.status_code === 200)) {
        return { sent: true, provider: 'Fast2SMS' };
      } else {
        const errMsg = Array.isArray(data?.message) ? data.message.join(', ') : (data?.message || 'Fast2SMS dispatch rejected');
        return { sent: false, provider: 'Fast2SMS', error: errMsg };
      }
    } catch (err: any) {
      return { sent: false, provider: 'Fast2SMS', error: err.message };
    }
  }

  // 2. Twilio SMS Gateway (Alternative fallback)
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  if (twilioSid && twilioAuth && twilioFrom) {
    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const body = new URLSearchParams({
        To: `+91${cleanNumber}`,
        From: twilioFrom,
        Body: `Your Golden Food Bowl verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`,
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (response.ok) {
        return { sent: true, provider: 'Twilio' };
      } else {
        const errorData = (await response.json()) as any;
        return { sent: false, provider: 'Twilio', error: errorData?.message || 'Twilio SMS failed' };
      }
    } catch (err: any) {
      return { sent: false, provider: 'Twilio', error: err.message };
    }
  }

  // No SMS provider configured
  return {
    sent: false,
    provider: 'none',
    error: 'SMS Gateway credentials (FAST2SMS_API_KEY) not configured on server.',
  };
}
