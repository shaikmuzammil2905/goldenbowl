import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { UserRepository } from '../repositories/userRepository.js';
import nodemailer from 'nodemailer';

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

  static async requestReset(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { identifier } = req.body;
      const email = identifier.includes('@') ? identifier : `${identifier}@example.com`;

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'muzammilshaik826@gmail.com',
          pass: 'gfge zbjv zlsx ouhx'
        }
      });

      const mailOptions = {
        from: 'muzammilshaik826@gmail.com',
        to: email,
        subject: 'Password Reset Request',
        html: `
          <h1>Password Reset</h1>
          <p>You requested a password reset. Click the link below to set a new password:</p>
          <a href="http://localhost:5173/customer/login">Reset Password</a>
          <p>If you did not request this, please ignore this email.</p>
        `
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({
        success: true,
        message: 'Password reset link sent successfully to your email.'
      });
    } catch (error) {
      console.error('SMTP Error:', error);
      next(error);
    }
  }
}
