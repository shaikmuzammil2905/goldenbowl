import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';

export const savedPaymentController = {
  getSavedPayments: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const authUser = (req as any).user;
      if (authUser && authUser.role !== 'ADMIN' && authUser.id !== id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to access payment methods for this account' });
      }

      const payments = await prisma.savedPaymentMethod.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  },

  createSavedPayment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const authUser = (req as any).user;
      if (authUser && authUser.role !== 'ADMIN' && authUser.id !== id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to save payment methods for this account' });
      }

      const { type, name, detail, isDefault } = req.body;

      if (!name || !detail) {
        return res.status(400).json({ success: false, message: 'Payment method name and detail are required' });
      }

      // Security check: NEVER store CVV, raw card numbers, passwords, PINs
      let sanitizedDetail = String(detail).trim();
      if (/^\d{12,19}$/.test(sanitizedDetail.replace(/[\s-]/g, ''))) {
        const rawDigits = sanitizedDetail.replace(/[\s-]/g, '');
        sanitizedDetail = `•••• ${rawDigits.slice(-4)}`;
      }

      if (isDefault) {
        await prisma.savedPaymentMethod.updateMany({
          where: { userId: id },
          data: { isDefault: false },
        });
      }

      const newPayment = await prisma.savedPaymentMethod.create({
        data: {
          userId: id,
          type: type || 'UPI',
          name: String(name).trim(),
          detail: sanitizedDetail,
          isDefault: isDefault || false,
        },
      });

      res.status(201).json({ success: true, data: newPayment });
    } catch (error) {
      next(error);
    }
  },

  deleteSavedPayment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const paymentId = req.params.paymentId as string;
      const authUser = (req as any).user;
      if (authUser && authUser.role !== 'ADMIN' && authUser.id !== id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to delete payment method' });
      }

      const existing = await prisma.savedPaymentMethod.findUnique({
        where: { id: Number(paymentId) },
      });
      if (!existing || (existing.userId !== id && authUser?.role !== 'ADMIN')) {
        return res.status(404).json({ success: false, message: 'Payment method not found or unauthorized' });
      }

      await prisma.savedPaymentMethod.delete({
        where: { id: Number(paymentId) },
      });
      res.status(200).json({ success: true, message: 'Payment method deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
