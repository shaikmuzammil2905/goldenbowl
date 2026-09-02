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

// Simple password hashing (SHA-256 with salt) for development
function hashPassword(password: string): string {
  const salt = process.env.PASSWORD_SALT || 'goldenbowl_password_salt_2026';
  return crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

export class AuthController {
  // POST /api/auth/login — Email/Phone + Password login
  static async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { identifier, password, role = 'CUSTOMER' } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email/phone and password are required.',
        });
      }

      const isEmail = identifier.includes('@');
      let user;

      if (isEmail) {
        user = await UserRepository.findByEmail(identifier.toLowerCase());
      } else {
        // Try finding by mobile number
        const cleanPhone = normalizeIndianMobile(identifier);
        if (cleanPhone) {
          user = await UserRepository.findByMobile(cleanPhone);
        }
        if (!user) {
          // Fallback: try as email
          user = await UserRepository.findByEmail(`${identifier}@goldenbowl.in`);
        }
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'No account found with this email/phone. Please sign up first.',
        });
      }

      // Check password
      if (!user.password) {
        return res.status(401).json({
          success: false,
          message: 'No password set for this account. Please use OTP login or set a password.',
        });
      }

      const hashedInput = hashPassword(password);
      if (hashedInput !== user.password) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password. Please try again or use OTP login.',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Login successful! Welcome back.',
        data: {
          user: { id: user.id, name: user.name, email: user.email, mobile: user.mobile, role: user.role },
          token: `token-${Date.now()}-${user.id}`,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/register — Sign up with email/phone + password
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, mobile, password } = req.body;

      if (!name || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name and password are required.',
        });
      }

      if (!email && !mobile) {
        return res.status(400).json({
          success: false,
          message: 'Either email or mobile number is required.',
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters.',
        });
      }

      const userEmail = email
        ? email.toLowerCase().trim()
        : `${normalizeIndianMobile(mobile) || mobile}@goldenbowl.in`;

      // Check if user already exists
      const existing = await UserRepository.findByEmail(userEmail);
      if (existing) {
        // If user exists but has no password, set it
        if (!existing.password) {
          const hashed = hashPassword(password);
          await UserRepository.updatePassword(existing.id, hashed);
          return res.status(200).json({
            success: true,
            message: 'Password set successfully! You can now login.',
            data: {
              user: { id: existing.id, name: existing.name, email: existing.email, mobile: existing.mobile, role: existing.role },
              token: `token-${Date.now()}-${existing.id}`,
            },
          });
        }
        return res.status(409).json({
          success: false,
          message: 'An account with this email/phone already exists. Please sign in.',
        });
      }

      const hashedPassword = hashPassword(password);
      const cleanMobile = mobile ? normalizeIndianMobile(mobile) : undefined;

      const user = await UserRepository.createUser({
        email: userEmail,
        name: name.trim(),
        mobile: cleanMobile || mobile,
        password: hashedPassword,
        role: 'CUSTOMER',
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully! Welcome to Golden Food Bowl.',
        data: {
          user: { id: user.id, name: user.name, email: user.email, mobile: user.mobile, role: user.role },
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
          user: { id: user.id, name: user.name, email: user.email, mobile: user.mobile, role: user.role },
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
