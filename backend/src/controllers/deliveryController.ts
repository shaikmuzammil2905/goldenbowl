import { Request, Response, NextFunction } from 'express';
import { DeliveryService } from '../services/deliveryService.js';

export class DeliveryController {
  static async getPartners(req: Request, res: Response, next: NextFunction) {
    try {
      const partners = await DeliveryService.getPartners();
      res.status(200).json({ success: true, data: partners });
    } catch (error) {
      next(error);
    }
  }

  static async registerPartner(req: Request, res: Response, next: NextFunction) {
    try {
      const partner = await DeliveryService.registerPartner(req.body);
      res.status(201).json({ success: true, message: 'Delivery partner registered', data: partner });
    } catch (error) {
      next(error);
    }
  }

  static async updateVerificationStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { verificationStatus, feeStatus } = req.body;
      const partner = await DeliveryService.updateVerificationStatus(req.params.id as string, verificationStatus, feeStatus);
      res.status(200).json({ success: true, message: 'Partner verification updated', data: partner });
    } catch (error) {
      next(error);
    }
  }
}
