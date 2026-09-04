import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { AuthenticatedRequest } from '../types/index.js';
import { UserRepository } from '../repositories/userRepository.js';
import { sendOtpEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { sendMobileOtpSms, normalizeIndianMobile } from '../services/smsService.js';
import { prisma } from '../config/prisma.js';

// ── Security Helpers ──────────────────────────────────────────────────────────
const OTP_SECRET = process.env.OTP_SECRET || 'goldenbowl_prod_otp_secret_key_2026';
const PASSWORD_SALT = process.env.PASSWORD_SALT || 'goldenbowl_password_salt_2026';

/**
 * Cryptographic HMAC-SHA256 hash helper for OTP verification and storage.
 * Ensures raw OTPs are NEVER stored in plaintext in the database.
 */
function hashOtp(identifier: string, rawOtp: string): string {
  return crypto.createHmac('sha256', OTP_SECRET).update(`${identifier.trim().toLowerCase()}:${rawOtp.trim()}`).digest('hex');
}

import { normalizeEmail, normalizePhone, hashPassword, verifyPassword } from '../utils/authUtils.js';

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generates an access token and refresh token pair.
 */
export function generateTokens(user: { id: string; role: string; email?: string; partnerId?: string }): TokenPair {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, email: user.email, partnerId: user.partnerId, type: 'access' },
    env.JWT_SECRET,
    { expiresIn: '2h' }
  );
  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' },
    env.JWT_SECRET,
    { expiresIn: '30d' }
  );
  return { accessToken, refreshToken };
}

/**
 * Generates an authentication token (backward compatible).
 */
function generateToken(userId: string, role: string, email?: string): string {
  return generateTokens({ id: userId, role, email }).accessToken;
}


export class AuthController {
  // ── 1. REGISTRATION: POST /api/auth/register ────────────────────────────────
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, mobile, password } = req.body;

      // 1. Validation: Name
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid full name (minimum 2 characters).',
        });
      }

      // 2. Validation: Password
      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long.',
        });
      }

      // 3. Validation: At least Mobile or Email must be provided
      const cleanEmail = email && typeof email === 'string' ? email.trim().toLowerCase() : null;
      let cleanMobile = mobile && typeof mobile === 'string' ? mobile.trim() : null;

      if (!cleanEmail && !cleanMobile) {
        return res.status(400).json({
          success: false,
          message: 'Please provide either a mobile number or email address.',
        });
      }

      // Validate email format if provided
      if (cleanEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          return res.status(400).json({
            success: false,
            message: 'Please enter a valid email address.',
          });
        }
      }

      // Validate and normalize mobile number if provided
      if (cleanMobile) {
        const normalized = normalizeIndianMobile(cleanMobile);
        if (!normalized) {
          return res.status(400).json({
            success: false,
            message: 'Please enter a valid 10-digit mobile number.',
          });
        }
        cleanMobile = normalized;
      }

      // 4. Duplicate Checks
      if (cleanEmail) {
        const existingEmail = await UserRepository.findByEmail(cleanEmail);
        if (existingEmail) {
          return res.status(409).json({
            success: false,
            message: 'An account with this email address already exists. Please sign in.',
          });
        }
      }

      if (cleanMobile) {
        const existingMobile = await UserRepository.findByMobile(cleanMobile);
        if (existingMobile) {
          return res.status(409).json({
            success: false,
            message: 'An account with this mobile number already exists. Please sign in.',
          });
        }
      }

      // 5. Create User
      const finalEmail = cleanEmail || `${cleanMobile}@goldenbowl.in`;
      const hashedPassword = await hashPassword(password);

      const user = await UserRepository.createUser({
        name: name.trim(),
        email: finalEmail,
        mobile: cleanMobile || undefined,
        password: hashedPassword,
        role: 'CUSTOMER',
        provider: cleanEmail ? 'email' : 'mobile',
      });

      const tokens = generateTokens({ id: user.id, role: user.role, email: user.email });

      return res.status(201).json({
        success: true,
        message: 'Account created successfully! Welcome to Golden Food Bowl.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
        },
        token: tokens.accessToken,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── 2. PASSWORD LOGIN: POST /api/auth/login ──────────────────────────────────
  static async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { identifier, email, mobile, password, role = 'CUSTOMER' } = req.body;
      const targetIdentifier = String(identifier || email || mobile || '').trim();

      if (!targetIdentifier || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email/phone and password are required.',
        });
      }

      let user = await UserRepository.findByIdentifier(targetIdentifier);

      // Generic authentication failure message to prevent account enumeration
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid login credentials. Please check your email/phone and password.',
        });
      }

      if (!user.password) {
        return res.status(401).json({
          success: false,
          message: 'No password set for this account. Please sign in using OTP or reset your password.',
        });
      }

      const { valid: isMatch, needsRehash } = await verifyPassword(password, user.password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid login credentials. Please check your email/phone and password.',
        });
      }

      // Upgrade hash to bcrypt if legacy format was used
      if (needsRehash) {
        try {
          const newHash = await hashPassword(password);
          await UserRepository.updatePassword(user.id, newHash);
        } catch {}
      }

      // Check delivery partner status if user has a profile or is signing into delivery portal
      let deliveryProfile = user.deliveryProfile;
      if (!deliveryProfile) {
        const cleanDigits = targetIdentifier.replace(/\D/g, '');
        deliveryProfile = await prisma.deliveryPartner.findFirst({
          where: {
            OR: [
              { userId: user.id },
              ...(user.mobile ? [{ mobile: user.mobile }] : []),
              ...(cleanDigits.length >= 10 ? [{ mobile: cleanDigits.slice(-10) }] : []),
            ],
          },
        });
        if (deliveryProfile && !deliveryProfile.userId) {
          deliveryProfile = await prisma.deliveryPartner.update({
            where: { id: deliveryProfile.id },
            data: { userId: user.id },
          });
        }
      }

      if (deliveryProfile) {
        if (deliveryProfile.verificationStatus === 'REJECTED') {
          return res.status(403).json({
            success: false,
            message: 'Your delivery partner account has been suspended or rejected. Please contact support.',
          });
        }

        // Ensure user account has DELIVERY role
        if (user.role !== 'DELIVERY' && user.role !== 'ADMIN') {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: 'DELIVERY' },
          });
          user.role = 'DELIVERY' as any;
        }
      }

      const tokens = generateTokens({
        id: user.id,
        role: user.role,
        email: user.email,
        partnerId: deliveryProfile?.id,
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful! Welcome back.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          partnerId: deliveryProfile?.id,
        },
        token: tokens.accessToken,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── 2b. REFRESH TOKEN: POST /api/auth/refresh ────────────────────────────────
  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken || typeof refreshToken !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required.',
        });
      }

      let payload: any;
      try {
        payload = jwt.verify(refreshToken, env.JWT_SECRET);
      } catch (err: any) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token. Please sign in again.',
          code: 'REFRESH_TOKEN_EXPIRED',
        });
      }

      if (payload.type !== 'refresh' || !payload.id) {
        return res.status(401).json({
          success: false,
          message: 'Malformed refresh token.',
        });
      }

      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User account no longer exists.',
        });
      }

      const tokens = generateTokens({ id: user.id, role: user.role, email: user.email });

      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully.',
        token: tokens.accessToken,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ── 3. EMAIL OTP: POST /api/auth/send-otp ───────────────────────────────────
  static async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, mobile, identifier } = req.body;
      const rawTarget = (email || mobile || identifier || '').toString().trim();

      if (!rawTarget) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address.',
        });
      }

      const isEmail = rawTarget.includes('@');
      let normalizedIdentifier: string;
      let identifierType: string;

      if (isEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(rawTarget)) {
          return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
        }
        normalizedIdentifier = rawTarget.toLowerCase();
        identifierType = 'EMAIL';
      } else {
        const cleanPhone = normalizeIndianMobile(rawTarget);
        if (!cleanPhone) {
          return res.status(400).json({
            success: false,
            message: 'Please enter a valid 10-digit Indian mobile number.',
          });
        }
        normalizedIdentifier = cleanPhone;
        identifierType = 'MOBILE';
      }

      // Rate Limiting: 60-second cooldown
      const now = Date.now();
      const recentOtp = await prisma.otpCode.findFirst({
        where: {
          identifier: normalizedIdentifier,
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

      // Frequency limit: Maximum 5 OTP requests per 15 minutes
      const count15m = await prisma.otpCode.count({
        where: {
          identifier: normalizedIdentifier,
          createdAt: { gt: new Date(now - 15 * 60 * 1000) },
        },
      });

      if (count15m >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Too many verification code requests. Please try again in 15 minutes.',
        });
      }

      // Secure 6-digit random OTP (100000 - 999999)
      const rawOtp = String(crypto.randomInt(100000, 1000000));
      const hashedOtp = hashOtp(normalizedIdentifier, rawOtp);
      const expiresAt = new Date(now + 5 * 60 * 1000); // 5 minutes expiration

      // Invalidate existing unused OTPs
      await prisma.otpCode.updateMany({
        where: { identifier: normalizedIdentifier, used: false },
        data: { used: true },
      });

      // Save hashed OTP
      await prisma.otpCode.create({
        data: {
          identifier: normalizedIdentifier,
          identifierType,
          email: isEmail ? normalizedIdentifier : undefined,
          otp: hashedOtp,
          expiresAt,
          attempts: 0,
        },
      });

      // Dispatch
      if (isEmail) {
        const user = await UserRepository.findByEmail(normalizedIdentifier);
        try {
          await sendOtpEmail(normalizedIdentifier, rawOtp, user?.name);
        } catch (emailErr: any) {
          // Invalidate on dispatch failure
          await prisma.otpCode.updateMany({
            where: { identifier: normalizedIdentifier, used: false },
            data: { used: true },
          });
          return res.status(503).json({
            success: false,
            message: 'Unable to deliver verification email. Please check your email address or try again later.',
          });
        }
      } else {
        const smsResult = await sendMobileOtpSms(normalizedIdentifier, rawOtp);
        if (!smsResult.sent) {
          await prisma.otpCode.updateMany({
            where: { identifier: normalizedIdentifier, used: false },
            data: { used: true },
          });
          return res.status(503).json({
            success: false,
            message: smsResult.error?.includes('FAST2SMS_API_KEY')
              ? 'SMS Service is currently being configured. Please use Email OTP or password login.'
              : 'Unable to send SMS verification code. Please try again later.',
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: isEmail
          ? `Verification code sent to ${normalizedIdentifier}. Please check your inbox.`
          : `Verification code sent via SMS to +91 ${normalizedIdentifier}.`,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── 4. VERIFY EMAIL OTP: POST /api/auth/verify-otp ──────────────────────────
  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, mobile, identifier, otp } = req.body;
      const rawTarget = (email || mobile || identifier || '').toString().trim();
      const rawOtp = (otp || '').toString().trim();

      if (!rawTarget || !rawOtp) {
        return res.status(400).json({
          success: false,
          message: 'Both email/phone and 6-digit verification code are required.',
        });
      }

      if (!/^\d{6}$/.test(rawOtp)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid 6-digit verification code.',
        });
      }

      const isEmail = rawTarget.includes('@');
      const normalizedIdentifier = isEmail ? rawTarget.toLowerCase() : normalizeIndianMobile(rawTarget) || rawTarget;

      // Find active record
      const record = await prisma.otpCode.findFirst({
        where: {
          identifier: normalizedIdentifier,
          used: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!record) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired verification code. Please request a new code.',
        });
      }

      // Check max attempts (5)
      if (record.attempts >= 5) {
        await prisma.otpCode.update({ where: { id: record.id }, data: { used: true } });
        return res.status(429).json({
          success: false,
          message: 'Too many incorrect attempts. Please request a new verification code.',
        });
      }

      // Check expiration (5 minutes)
      if (new Date() > record.expiresAt) {
        await prisma.otpCode.update({ where: { id: record.id }, data: { used: true } });
        return res.status(401).json({
          success: false,
          message: 'Your verification code has expired. Please request a new code.',
        });
      }

      // Verify cryptographic hash
      const computedHash = hashOtp(normalizedIdentifier, rawOtp);
      const isMatch = record.otp === computedHash || record.otp === rawOtp;

      if (!isMatch) {
        await prisma.otpCode.update({
          where: { id: record.id },
          data: { attempts: record.attempts + 1 },
        });
        return res.status(401).json({
          success: false,
          message: 'Incorrect verification code. Please check and try again.',
        });
      }

      // One-time consumption: mark OTP as used immediately
      await prisma.otpCode.update({
        where: { id: record.id },
        data: { used: true },
      });

      // Find or create user
      const userEmail = isEmail ? normalizedIdentifier : `${normalizedIdentifier}@goldenbowl.in`;
      let user = await UserRepository.findByIdentifier(normalizedIdentifier);

      if (!user) {
        user = await UserRepository.createUser({
          email: userEmail,
          name: isEmail ? normalizedIdentifier.split('@')[0] : `Customer ${normalizedIdentifier.slice(-4)}`,
          role: 'CUSTOMER',
          mobile: isEmail ? undefined : normalizedIdentifier,
          provider: isEmail ? 'email' : 'mobile',
        });
      }

      const token = generateToken(user.id, user.role);

      return res.status(200).json({
        success: true,
        message: 'Verification successful. Welcome to Golden Food Bowl!',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── 5. MOBILE OTP: POST /api/auth/send-mobile-otp ───────────────────────────
  static async sendMobileOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { mobile } = req.body;
      if (!mobile) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid 10-digit mobile number.',
        });
      }

      const cleanPhone = normalizeIndianMobile(mobile.toString().trim());
      if (!cleanPhone) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).',
        });
      }

      // Rate Limiting: 60-second cooldown
      const now = Date.now();
      const recentOtp = await prisma.otpCode.findFirst({
        where: {
          identifier: cleanPhone,
          createdAt: { gt: new Date(now - 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (recentOtp) {
        return res.status(429).json({
          success: false,
          message: 'Please wait 60 seconds before requesting another SMS verification code.',
        });
      }

      // Frequency limit
      const count15m = await prisma.otpCode.count({
        where: {
          identifier: cleanPhone,
          createdAt: { gt: new Date(now - 15 * 60 * 1000) },
        },
      });

      if (count15m >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Too many SMS requests. Please try again in 15 minutes.',
        });
      }

      const rawOtp = String(crypto.randomInt(100000, 1000000));
      const hashedOtp = hashOtp(cleanPhone, rawOtp);
      const expiresAt = new Date(now + 5 * 60 * 1000);

      // Invalidate existing unused OTPs
      await prisma.otpCode.updateMany({
        where: { identifier: cleanPhone, used: false },
        data: { used: true },
      });

      // Save hashed OTP
      await prisma.otpCode.create({
        data: {
          identifier: cleanPhone,
          identifierType: 'MOBILE',
          otp: hashedOtp,
          expiresAt,
          attempts: 0,
        },
      });

      // Send SMS
      const smsResult = await sendMobileOtpSms(cleanPhone, rawOtp);

      if (!smsResult.sent) {
        await prisma.otpCode.updateMany({
          where: { identifier: cleanPhone, used: false },
          data: { used: true },
        });
        return res.status(503).json({
          success: false,
          message: smsResult.error?.includes('FAST2SMS_API_KEY')
            ? 'SMS Service is currently being configured. Please use Email OTP or password login.'
            : 'Unable to send SMS verification code. Please check your mobile number or try again later.',
        });
      }

      return res.status(200).json({
        success: true,
        message: `Verification code sent via SMS to +91 ${cleanPhone}.`,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── 6. VERIFY MOBILE OTP: POST /api/auth/verify-mobile-otp ──────────────────
  static async verifyMobileOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { mobile, otp } = req.body;
      if (!mobile || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Both mobile number and 6-digit verification code are required.',
        });
      }

      const cleanPhone = normalizeIndianMobile(mobile.toString().trim());
      if (!cleanPhone) {
        return res.status(400).json({
          success: false,
          message: 'Invalid mobile number format.',
        });
      }

      const rawOtp = otp.toString().trim();
      if (!/^\d{6}$/.test(rawOtp)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid 6-digit numerical verification code.',
        });
      }

      // Find record
      const record = await prisma.otpCode.findFirst({
        where: {
          identifier: cleanPhone,
          used: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!record) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired verification code. Please request a new code.',
        });
      }

      if (record.attempts >= 5) {
        await prisma.otpCode.update({ where: { id: record.id }, data: { used: true } });
        return res.status(429).json({
          success: false,
          message: 'Too many incorrect attempts. Please request a new verification code.',
        });
      }

      if (new Date() > record.expiresAt) {
        await prisma.otpCode.update({ where: { id: record.id }, data: { used: true } });
        return res.status(401).json({
          success: false,
          message: 'Your verification code has expired. Please request a new code.',
        });
      }

      const computedHash = hashOtp(cleanPhone, rawOtp);
      const isMatch = record.otp === computedHash || record.otp === rawOtp;

      if (!isMatch) {
        await prisma.otpCode.update({
          where: { id: record.id },
          data: { attempts: record.attempts + 1 },
        });
        return res.status(401).json({
          success: false,
          message: 'Incorrect verification code. Please check and try again.',
        });
      }

      await prisma.otpCode.update({
        where: { id: record.id },
        data: { used: true },
      });

      let user = await UserRepository.findByMobile(cleanPhone);
      if (!user) {
        user = await UserRepository.createUser({
          email: `${cleanPhone}@goldenbowl.in`,
          mobile: cleanPhone,
          name: `Customer ${cleanPhone.slice(-4)}`,
          role: 'CUSTOMER',
          provider: 'mobile',
        });
      }

      const token = generateToken(user.id, user.role);

      return res.status(200).json({
        success: true,
        message: 'Verification successful. Welcome to Golden Food Bowl!',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── PASSWORD RESET REQUEST: POST /api/auth/request-reset ────────────────────
  static async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier, email } = req.body;
      const rawTarget = (email || identifier || '').toString().trim();

      if (!rawTarget) {
        return res.status(400).json({
          success: false,
          message: 'Please enter your registered email address.',
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
            message: 'Please enter a valid email address or 10-digit mobile number.',
          });
        }
        normalizedIdentifier = cleanPhone;
      }

      // Rate Limiting: 60-second cooldown between reset requests
      const now = Date.now();
      const recentRequest = await prisma.otpCode.findFirst({
        where: {
          identifier: `reset_${normalizedIdentifier}`,
          createdAt: { gt: new Date(now - 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (recentRequest) {
        return res.status(429).json({
          success: false,
          message: 'Please wait 60 seconds before requesting another password reset code.',
        });
      }

      // Look up the user (don't reveal if account exists for security)
      const user = await UserRepository.findByIdentifier(normalizedIdentifier);

      // Generate a secure reset token & 6-digit OTP
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHmac('sha256', OTP_SECRET).update(resetToken).digest('hex');
      const rawOtp = String(crypto.randomInt(100000, 1000000));
      const hashedOtp = hashOtp(normalizedIdentifier, rawOtp);
      const expiresAt = new Date(now + 15 * 60 * 1000); // 15 minutes

      // Invalidate any previous reset tokens & OTPs for this identifier
      await prisma.otpCode.updateMany({
        where: {
          OR: [
            { identifier: `reset_${normalizedIdentifier}`, used: false },
            { identifier: normalizedIdentifier, used: false },
          ],
        },
        data: { used: true },
      });

      // Store the hashed token
      await prisma.otpCode.create({
        data: {
          identifier: `reset_${normalizedIdentifier}`,
          identifierType: 'PASSWORD_RESET',
          email: isEmail ? normalizedIdentifier : undefined,
          otp: hashedToken,
          expiresAt,
          attempts: 0,
        },
      });

      // Store the hashed OTP
      await prisma.otpCode.create({
        data: {
          identifier: normalizedIdentifier,
          identifierType: isEmail ? 'EMAIL' : 'MOBILE',
          email: isEmail ? normalizedIdentifier : undefined,
          otp: hashedOtp,
          expiresAt,
          attempts: 0,
        },
      });

      // Only send the email/SMS if the user actually exists
      if (user) {
        if (isEmail) {
          try {
            await sendPasswordResetEmail(normalizedIdentifier, resetToken, user.name, rawOtp, user.role);
          } catch (emailErr: any) {
            console.error('Failed to send password reset email:', emailErr.message);
          }
        } else {
          // For mobile users, send an SMS with the OTP
          const { sendMobileOtpSms: sendSms } = await import('../services/smsService.js');
          try {
            await sendSms(normalizedIdentifier, rawOtp);
          } catch (smsErr: any) {
            console.error('Failed to send password reset SMS:', smsErr.message);
          }
        }
      }

      // Always return success to prevent account enumeration
      return res.status(200).json({
        success: true,
        message: isEmail
          ? `If an account exists for ${normalizedIdentifier}, an OTP and password reset link have been sent to your email.`
          : `If an account exists for +91 ${normalizedIdentifier}, an OTP has been sent via SMS.`,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── RESET PASSWORD: POST /api/auth/reset-password ───────────────────────────
  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, email, identifier, otp, password } = req.body;
      if (!password || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long.',
        });
      }

      let actualIdentifier: string | null = null;
      let matchedRecordId: string | null = null;

      // Case 1: Token-based reset
      if (token) {
        const hashedToken = crypto.createHmac('sha256', OTP_SECRET).update(token).digest('hex');
        const record = await prisma.otpCode.findFirst({
          where: {
            identifierType: 'PASSWORD_RESET',
            otp: hashedToken,
            used: false,
            expiresAt: { gt: new Date() },
          },
        });

        if (record) {
          actualIdentifier = record.identifier.replace(/^reset_/, '');
          matchedRecordId = record.id;
        }
      }

      // Case 2: OTP-based reset
      const targetUser = (email || identifier || '').toString().trim();
      if (!actualIdentifier && targetUser && otp) {
        const cleanTarget = targetUser.includes('@') ? targetUser.toLowerCase() : normalizeIndianMobile(targetUser) || targetUser;
        const rawOtp = otp.toString().trim();
        const computedHash = hashOtp(cleanTarget, rawOtp);

        const record = await prisma.otpCode.findFirst({
          where: {
            identifier: cleanTarget,
            used: false,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (record && (record.otp === computedHash || record.otp === rawOtp)) {
          actualIdentifier = cleanTarget;
          matchedRecordId = record.id;
        }
      }

      if (!actualIdentifier || !matchedRecordId) {
        return res.status(400).json({
          success: false,
          message: 'This reset code or link is invalid or has expired. Please request a new one.',
        });
      }

      // Find the user
      const user = await UserRepository.findByIdentifier(actualIdentifier);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'User associated with this reset request could not be found.',
        });
      }

      // Update the password with bcrypt hash
      const newHashedPassword = await hashPassword(password);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHashedPassword },
      });

      // Invalidate all tokens & OTPs for this identifier
      await prisma.otpCode.updateMany({
        where: {
          OR: [
            { identifier: actualIdentifier, used: false },
            { identifier: `reset_${actualIdentifier}`, used: false },
          ],
        },
        data: { used: true },
      });

      return res.status(200).json({
        success: true,
        message: 'Password reset successfully. You can now log in with your email and new password.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async googleLogin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ success: false, message: 'Google token is required.' });
      }

      let payload: any;
      try {
        const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);
        payload = await response.json();
      } catch (e) {
        return res.status(401).json({ success: false, message: 'Failed to connect to Google verification.' });
      }

      if (payload.error) {
        return res.status(401).json({ success: false, message: 'Invalid Google token.' });
      }

      const { email, name = 'Google User' } = payload;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Google account has no associated email.' });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Find existing user or create
      let user = await UserRepository.findByEmail(normalizedEmail);
      if (!user) {
        user = await UserRepository.createUser({
          email: normalizedEmail,
          name,
          role: 'CUSTOMER',
          provider: 'google',
        });
      }

      const sessionToken = generateToken(user.id, user.role);

      return res.status(200).json({
        success: true,
        message: 'Google Login successful!',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
        },
        token: sessionToken,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── 7. SESSION MANAGEMENT ───────────────────────────────────────────────────
  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        user: req.user,
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
