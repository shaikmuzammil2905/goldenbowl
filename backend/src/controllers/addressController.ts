import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';

export const addressController = {
  getAddresses: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const authUser = (req as any).user;
      if (authUser && authUser.role !== 'ADMIN' && authUser.id !== id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to access addresses for this account' });
      }

      const addresses = await prisma.savedAddress.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ success: true, data: addresses });
    } catch (error) {
      next(error);
    }
  },

  createAddress: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const authUser = (req as any).user;
      if (authUser && authUser.role !== 'ADMIN' && authUser.id !== id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to create addresses for this account' });
      }

      const { type, address, isDefault } = req.body;

      if (isDefault) {
        await prisma.savedAddress.updateMany({
          where: { userId: id },
          data: { isDefault: false },
        });
      }

      const newAddress = await prisma.savedAddress.create({
        data: {
          userId: id,
          type: type || 'Other',
          address,
          isDefault: isDefault || false,
        },
      });

      res.status(201).json({ success: true, data: newAddress });
    } catch (error) {
      next(error);
    }
  },

  updateAddress: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const addressId = req.params.addressId as string;
      const authUser = (req as any).user;
      if (authUser && authUser.role !== 'ADMIN' && authUser.id !== id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to update addresses for this account' });
      }

      const existing = await prisma.savedAddress.findUnique({
        where: { id: Number(addressId) },
      });
      if (!existing || (existing.userId !== id && authUser?.role !== 'ADMIN')) {
        return res.status(404).json({ success: false, message: 'Address not found or unauthorized' });
      }

      const { type, address, isDefault } = req.body;

      if (isDefault) {
        await prisma.savedAddress.updateMany({
          where: { userId: id },
          data: { isDefault: false },
        });
      }

      const updatedAddress = await prisma.savedAddress.update({
        where: { id: Number(addressId) },
        data: { type, address, isDefault },
      });

      res.status(200).json({ success: true, data: updatedAddress });
    } catch (error) {
      next(error);
    }
  },

  deleteAddress: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const addressId = req.params.addressId as string;
      const authUser = (req as any).user;
      if (authUser && authUser.role !== 'ADMIN' && authUser.id !== id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to delete this address' });
      }

      const existing = await prisma.savedAddress.findUnique({
        where: { id: Number(addressId) },
      });
      if (!existing || (existing.userId !== id && authUser?.role !== 'ADMIN')) {
        return res.status(404).json({ success: false, message: 'Address not found or unauthorized' });
      }

      await prisma.savedAddress.delete({
        where: { id: Number(addressId) },
      });
      res.status(200).json({ success: true, message: 'Address deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
