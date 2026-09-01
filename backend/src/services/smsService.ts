import { env } from '../config/env.js';

export interface SmsSendResult {
  sent: boolean;
  provider: string;
  error?: string;
}

/**
 * Sends a real 6-digit SMS OTP to an Indian (+91) mobile number.
 * Supports Fast2SMS (instant Indian OTP gateway) and Twilio.
 */
export async function sendMobileOtpSms(mobileNumber: string, otp: string): Promise<SmsSendResult> {
  const cleanNumber = mobileNumber.replace(/\D/g, '').slice(-10);

  // 1. If Fast2SMS API Key is provided in environment variables (Recommended for India)
  const fast2SmsKey = process.env.FAST2SMS_API_KEY;
  if (fast2SmsKey) {
    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: fast2SmsKey,
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
        console.log(`✅ [SMS Gateway - Fast2SMS] OTP ${otp} delivered to +91 ${cleanNumber}`);
        return { sent: true, provider: 'Fast2SMS' };
      } else {
        console.error('❌ [Fast2SMS Error]:', data?.message || data);
        return { sent: false, provider: 'Fast2SMS', error: data?.message };
      }
    } catch (err: any) {
      console.error('❌ [Fast2SMS Request Failed]:', err.message);
      return { sent: false, provider: 'Fast2SMS', error: err.message };
    }
  }

  // 2. If Twilio credentials are provided
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  if (twilioSid && twilioAuth && twilioFrom) {
    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const body = new URLSearchParams({
        To: `+91${cleanNumber}`,
        From: twilioFrom,
        Body: `Your Golden Food Bowl verification code is: ${otp}. Valid for 10 minutes.`,
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
        console.log(`✅ [SMS Gateway - Twilio] OTP ${otp} delivered to +91 ${cleanNumber}`);
        return { sent: true, provider: 'Twilio' };
      }
    } catch (err: any) {
      console.error('❌ [Twilio Request Failed]:', err.message);
    }
  }

  // Fallback / Development mode
  console.log(`📱 [SMS Simulated] OTP generated for +91 ${cleanNumber}: ${otp}`);
  return { sent: false, provider: 'local_simulation' };
}
