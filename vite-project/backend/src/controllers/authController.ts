import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { UserRepository } from '../repositories/userRepository.js';

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
}
