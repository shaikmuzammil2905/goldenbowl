import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/prisma.js';


export class NotificationController {
  static async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      // Fetch notifications that are either specifically for this user or broadly for their role
      const notifications = await prisma.notification.findMany({
        where: {
          OR: [
            { userId: user.id },
            { role: user.role as any, userId: null }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      res.status(200).json({ success: true, data: notifications });
    } catch (error) {
      next(error);
    }
  }

  static async createNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, title, message, userId } = req.body;
      const notification = await prisma.notification.create({
        data: { role, title, message, userId },
      });
      res.status(201).json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const notification = await prisma.notification.update({
        where: { id },
        data: { read: true }
      });
      res.status(200).json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }
}

export class SettingsController {
  static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await prisma.systemSetting.findMany();
      res.status(200).json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  static async updateSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const { key, value } = req.body;
      const setting = await prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
      res.status(200).json({ success: true, data: setting });
    } catch (error) {
      next(error);
    }
  }
}
