import { Request, Response, NextFunction } from 'express';
import { DeliveryService } from '../services/deliveryService.js';
import { AuthenticatedRequest } from '../types/index.js';

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

  static async getPartnerProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const partnerId = req.params.id as string;
      // IDOR Protection: Admin can view any, partner can only view their own.
      const partner = await DeliveryService.getPartnerById(partnerId);
      
      if (!partner) {
        return res.status(404).json({ success: false, message: 'Partner not found' });
      }

      if (req.user?.role !== 'ADMIN' && partner.userId !== req.user?.id) {
        return res.status(403).json({ success: false, message: 'Access denied: You can only view your own profile.' });
      }

      res.status(200).json({ success: true, data: partner });
    } catch (error) {
      next(error);
    }
  }

  static async updatePartnerProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const partnerId = req.params.id as string;
      
      // IDOR Protection check
      const partner = await DeliveryService.getPartnerById(partnerId);
      if (!partner) {
        return res.status(404).json({ success: false, message: 'Partner not found' });
      }
      if (req.user?.role !== 'ADMIN' && partner.userId !== req.user?.id) {
        return res.status(403).json({ success: false, message: 'Access denied: You can only update your own profile.' });
      }

      const updatedPartner = await DeliveryService.updatePartnerProfile(partnerId, req.body);
      res.status(200).json({ success: true, message: 'Profile updated', data: updatedPartner });
    } catch (error) {
      next(error);
    }
  }
}
