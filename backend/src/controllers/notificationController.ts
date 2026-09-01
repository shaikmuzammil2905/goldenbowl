import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { Role } from '@prisma/client';

export class NotificationController {
  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.query;
      const notifications = await prisma.notification.findMany({
        where: role ? { role: (role as string).toUpperCase() as Role } : undefined,
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ success: true, data: notifications });
    } catch (error) {
      next(error);
    }
  }

  static async createNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, title, message } = req.body;
      const notification = await prisma.notification.create({
        data: { role, title, message },
      });
      res.status(201).json({ success: true, data: notification });
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
