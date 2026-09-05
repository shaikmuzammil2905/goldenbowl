import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';

export const addressController = {
  getAddresses: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
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
      const addressId = req.params.addressId as string;
      await prisma.savedAddress.delete({
        where: { id: Number(addressId) },
      });
      res.status(200).json({ success: true, message: 'Address deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
