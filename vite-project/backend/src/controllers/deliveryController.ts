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

  static async getCurrentPartner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const dashboardData = await DeliveryService.getCurrentPartnerDashboard(userId);
      res.status(200).json({ success: true, data: dashboardData });
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

  static async getPendingRequests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      const partner = await DeliveryService.getPartnerByUserId(userId);
      const requests = await DeliveryService.getPendingRequests(partner?.id || '');
      res.status(200).json({ success: true, data: requests });
    } catch (error) {
      next(error);
    }
  }

  static async acceptRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestId = req.params.id as string;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const partner = await DeliveryService.getPartnerByUserId(userId);
      if (!partner) {
        return res.status(400).json({ 
          success: false, 
          message: 'Your delivery partner account is not properly configured.' 
        });
      }

      const order = await DeliveryService.acceptDeliveryRequest(requestId, partner.id, userId);
      res.status(200).json({ success: true, message: 'Delivery accepted successfully', data: order });
    } catch (error: any) {
      const statusCode = error.statusCode || (error.name === 'NotFoundError' ? 404 : 400);
      const safeMessage = error.message && !error.message.includes('prisma.') 
        ? error.message 
        : 'Unable to accept this delivery right now. Please try again.';
      res.status(statusCode).json({ success: false, message: safeMessage });
    }
  }

  static async updateDeliveryStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orderId = (req.params.orderId || req.params.id) as string;
      const { status } = req.body;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
      }

      const result = await DeliveryService.updateDeliveryStatus(orderId, status, userId, userRole);
      res.status(200).json({ success: true, message: 'Delivery status updated', data: result });
    } catch (error: any) {
      const statusCode = error.statusCode || (error.name === 'NotFoundError' ? 404 : 400);
      const safeMessage = error.message && !error.message.includes('prisma.')
        ? error.message
        : 'Unable to update delivery status. Please try again.';
      res.status(statusCode).json({ success: false, message: safeMessage });
    }
  }

  static async rejectRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestId = req.params.id as string;
      const userId = req.user?.id;
      const partner = await DeliveryService.getPartnerByUserId(userId || '');
      if (!partner) throw new Error('Partner profile not found for this user');
      await DeliveryService.rejectDeliveryRequest(requestId, partner.id);
      res.status(200).json({ success: true, message: 'Request rejected' });
    } catch (error) {
      next(error);
    }
  }
}
