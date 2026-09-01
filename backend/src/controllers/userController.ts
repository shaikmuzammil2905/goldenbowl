import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../repositories/userRepository.js';
import { Role } from '@prisma/client';

export class UserController {
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.query;
      const users = await UserRepository.listUsers(role as Role);
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserRepository.findById(req.params.id as string);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
}
