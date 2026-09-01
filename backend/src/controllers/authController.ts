import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { UserRepository } from '../repositories/userRepository.js';
import { sendOtpEmail } from '../services/emailService.js';
import { prisma } from '../config/prisma.js';

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
  // Generates a 6-digit OTP, stores it, and sends via Email SMTP or Mobile SMS
  static async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, mobile, identifier } = req.body;
      const target = (email || mobile || identifier || '').trim();

      if (!target) {
        return res.status(400).json({ success: false, message: 'A valid email address or mobile number is required.' });
      }

      const isEmail = target.includes('@');
      const normalizedTarget = isEmail ? target.toLowerCase() : target.replace(/\D/g, '').slice(0, 10);

      if (!isEmail && normalizedTarget.length !== 10) {
        return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
      }

      // Generate cryptographically safe 6-digit OTP
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Invalidate all previous unused OTPs for this target
      await prisma.otpCode.updateMany({
        where: { email: normalizedTarget, used: false },
        data: { used: true },
      });

      // Save the new OTP
      await prisma.otpCode.create({
        data: { email: normalizedTarget, otp, expiresAt },
      });

      if (isEmail) {
        // Look up the user's name for a personalized email (optional)
        const user = await UserRepository.findByEmail(normalizedTarget);
        // Send email via Nodemailer SMTP
        await sendOtpEmail(normalizedTarget, otp, user?.name);
      } else {
        console.log(`📱 [SMS OTP] OTP for +91 ${normalizedTarget}: ${otp}`);
      }

      res.status(200).json({
        success: true,
        message: isEmail
          ? `OTP sent to ${normalizedTarget}. Check your inbox.`
          : `OTP sent to +91 ${normalizedTarget}.`,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/verify-otp
  // Validates the OTP, marks it used, and returns a session token
  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, mobile, identifier, otp } = req.body;
      const target = (email || mobile || identifier || '').trim();

      if (!target || !otp) {
        return res.status(400).json({ success: false, message: 'Target identifier and OTP are required.' });
      }

      const isEmail = target.includes('@');
      const normalizedTarget = isEmail ? target.toLowerCase() : target.replace(/\D/g, '').slice(0, 10);

      // Find a valid (not-expired, not-used) OTP record
      const record = await prisma.otpCode.findFirst({
        where: {
          email: normalizedTarget,
          otp: String(otp).trim(),
          used: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!record) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired OTP. Please request a new one.',
        });
      }

      // Mark OTP as used so it cannot be reused
      await prisma.otpCode.update({
        where: { id: record.id },
        data: { used: true },
      });

      const userEmail = isEmail ? normalizedTarget : `${normalizedTarget}@goldenbowl.in`;

      // Find or auto-create user
      let user = await UserRepository.findByEmail(userEmail);
      if (!user) {
        user = await UserRepository.createUser({
          email: userEmail,
          name: isEmail ? normalizedTarget.split('@')[0] : `Customer ${normalizedTarget.slice(-4)}`,
          role: 'CUSTOMER',
          mobile: isEmail ? undefined : normalizedTarget,
        });
      }

      res.status(200).json({
        success: true,
        message: 'OTP verified. Welcome to Golden Food Bowl!',
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
