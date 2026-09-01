import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../types/index.js';
import { UserRepository } from '../repositories/userRepository.js';
import { sendOtpEmail } from '../services/emailService.js';
import { sendMobileOtpSms, normalizeIndianMobile } from '../services/smsService.js';
import { prisma } from '../config/prisma.js';

// Cryptographic HMAC-SHA256 hash helper for OTP storage
function hashOtp(identifier: string, rawOtp: string): string {
  const secret = process.env.OTP_SECRET || 'goldenbowl_prod_otp_secret_key_2026';
  return crypto.createHmac('sha256', secret).update(`${identifier}:${rawOtp}`).digest('hex');
}

export class AuthController {
  static async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { identifier, role = 'CUSTOMER' } = req.body;
      const email = identifier.includes('@') ? identifier : `${identifier}@example.com`;

      let user = await UserRepository.findByEmail(email);
      if (!user) {
        user = await UserRepository.createUser({
          email,
          name: email.split('@')[0],
          role,
          mobile: identifier.includes('@') ? undefined : identifier,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        data: {
          user,
          token: `token-${Date.now()}-${user.id}`,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/send-otp
  // Generates secure 6-digit OTP, stores cryptographic hash in DB, dispatches via SMS Gateway or Email SMTP
  static async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, mobile, identifier } = req.body;
      const rawTarget = (email || mobile || identifier || '').toString().trim();

      if (!rawTarget) {
        return res.status(400).json({
          success: false,
          message: 'A valid mobile number or email address is required.',
        });
      }

      const isEmail = rawTarget.includes('@');
      let normalizedIdentifier: string;

      if (isEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(rawTarget)) {
          return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
        }
        normalizedIdentifier = rawTarget.toLowerCase();
      } else {
        const cleanPhone = normalizeIndianMobile(rawTarget);
        if (!cleanPhone) {
          return res.status(400).json({
            success: false,
            message: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).',
          });
        }
        normalizedIdentifier = cleanPhone;
      }

      // ── RATE LIMITING ────────────────────────────────────────────────────────
      const now = Date.now();

      // 1. Resend cooldown: Must wait 60 seconds between OTP requests
      const recentOtp = await prisma.otpCode.findFirst({
        where: {
          email: normalizedIdentifier,
          createdAt: { gt: new Date(now - 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (recentOtp) {
        return res.status(429).json({
          success: false,
          message: 'Please wait 60 seconds before requesting another verification code.',
        });
      }

      // 2. Frequency limit: Maximum 5 OTP requests per identifier per 15 minutes
      const count15m = await prisma.otpCode.count({
        where: {
          email: normalizedIdentifier,
          createdAt: { gt: new Date(now - 15 * 60 * 1000) },
        },
      });

      if (count15m >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Too many OTP requests. Please try again in 15 minutes.',
        });
      }
      // ─────────────────────────────────────────────────────────────────────────

      // Cryptographically secure 6-digit random OTP (100000 - 999999)
      const rawOtp = String(crypto.randomInt(100000, 1000000));
      const hashedOtp = hashOtp(normalizedIdentifier, rawOtp);
      const expiresAt = new Date(now + 10 * 60 * 1000); // 10 minutes expiry

      // Invalidate any existing unused OTPs for this identifier
      await prisma.otpCode.updateMany({
        where: { email: normalizedIdentifier, used: false },
        data: { used: true },
      });

      // Save securely hashed OTP into database
      await prisma.otpCode.create({
        data: {
          email: normalizedIdentifier,
          otp: hashedOtp,
          expiresAt,
        },
      });

      // ── DISPATCH ─────────────────────────────────────────────────────────────
      if (isEmail) {
        const user = await UserRepository.findByEmail(normalizedIdentifier);
        try {
          await sendOtpEmail(normalizedIdentifier, rawOtp, user?.name);
        } catch (emailErr: any) {
          // If sending email fails, invalidate the OTP record and fail securely
          await prisma.otpCode.updateMany({
            where: { email: normalizedIdentifier, used: false },
            data: { used: true },
          });
          return res.status(503).json({
            success: false,
            message: 'Unable to send email OTP. Please check your email address or try again later.',
          });
        }
      } else {
        const smsResult = await sendMobileOtpSms(normalizedIdentifier, rawOtp);

        // FAIL SECURELY: If SMS gateway failed, invalidate OTP and fail
        if (!smsResult.sent) {
          await prisma.otpCode.updateMany({
            where: { email: normalizedIdentifier, used: false },
            data: { used: true },
          });
          return res.status(503).json({
            success: false,
            message: smsResult.error?.includes('FAST2SMS_API_KEY')
              ? 'SMS Service is currently being configured. Please use Email OTP or contact support.'
              : 'Unable to send SMS verification code. Please check your mobile number or try again later.',
          });
        }
      }

      // Safe production response — NEVER return OTP or otpHint
      res.status(200).json({
        success: true,
        message: isEmail
          ? `Verification code sent to ${normalizedIdentifier}. Please check your inbox.`
          : `Verification code sent via SMS to +91 ${normalizedIdentifier}.`,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/verify-otp
  // Validates user-submitted OTP against secure hash in database
  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, mobile, identifier, otp } = req.body;
      const rawTarget = (email || mobile || identifier || '').toString().trim();
      const rawOtp = (otp || '').toString().trim();

      if (!rawTarget || !rawOtp) {
        return res.status(400).json({
          success: false,
          message: 'Both destination identifier and 6-digit OTP code are required.',
        });
      }

      // Validate 6-digit numeric OTP
      if (!/^\d{6}$/.test(rawOtp)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid 6-digit numerical verification code.',
        });
      }

      const isEmail = rawTarget.includes('@');
      let normalizedIdentifier: string;

      if (isEmail) {
        normalizedIdentifier = rawTarget.toLowerCase();
      } else {
        const cleanPhone = normalizeIndianMobile(rawTarget);
        if (!cleanPhone) {
          return res.status(400).json({
            success: false,
            message: 'Invalid mobile number format.',
          });
        }
        normalizedIdentifier = cleanPhone;
      }

      // Find active, unexpired, unused OTP record
      const record = await prisma.otpCode.findFirst({
        where: {
          email: normalizedIdentifier,
          used: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!record) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired verification code. Please request a new code.',
        });
      }

      // Validate secure hash comparison
      const computedHash = hashOtp(normalizedIdentifier, rawOtp);
      const isMatch = record.otp === computedHash || record.otp === rawOtp;

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect verification code. Please check and try again.',
        });
      }

      // One-time consumption: Mark OTP as used immediately so it can never be reused
      await prisma.otpCode.update({
        where: { id: record.id },
        data: { used: true },
      });

      const userEmail = isEmail ? normalizedIdentifier : `${normalizedIdentifier}@goldenbowl.in`;

      // Find or register new user
      let user = await UserRepository.findByEmail(userEmail);
      if (!user) {
        user = await UserRepository.createUser({
          email: userEmail,
          name: isEmail ? normalizedIdentifier.split('@')[0] : `Customer ${normalizedIdentifier.slice(-4)}`,
          role: 'CUSTOMER',
          mobile: isEmail ? undefined : normalizedIdentifier,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Verification successful. Welcome to Golden Food Bowl!',
        data: {
          user,
          token: `token-${Date.now()}-${user.id}`,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
