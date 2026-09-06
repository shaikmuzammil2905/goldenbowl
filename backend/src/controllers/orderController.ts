import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { OrderService } from '../services/orderService.js';


export class OrderController {
  static async getOrders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      let { status, customer } = req.query;
      
      // Enforce data scoping for customers
      if (req.user?.role === 'CUSTOMER') {
        customer = req.user.id;
      }
      
      const orders = await OrderService.getOrders({
        status: status as string,
        customerId: customer as string,
      });
      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const order = await OrderService.getOrderById(req.params.id as string);
      res.status(200).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  static async createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const order = await OrderService.createOrder({
        customerId: req.user?.id,
        customerName: req.body.customerName || req.user?.name || 'Guest',
        branchId: req.body.branchId,
        orderType: req.body.orderType,
        deliveryMethod: req.body.deliveryMethod,
        deliveryAddress: req.body.deliveryAddress,
        addressType: req.body.addressType,
        items: req.body.items,
      });
      res.status(201).json({ success: true, message: 'Order created', data: order });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const order = await OrderService.updateOrderStatus(req.params.id as string, status);
      res.status(200).json({ success: true, message: 'Order status updated', data: order });
    } catch (error) {
      next(error);
    }
  }

  static async assignDriver(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { driverId } = req.body;
      const order = await OrderService.assignDriver(req.params.id as string, driverId);
      res.status(200).json({ success: true, message: 'Driver assigned to order', data: order });
    } catch (error) {
      next(error);
    }
  }

  static async requestDelivery(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { partnerId } = req.body;
      const request = await OrderService.sendDeliveryRequest(req.params.id as string, partnerId);
      res.status(200).json({ success: true, message: 'Delivery request sent to partner', data: request });
    } catch (error) {
      next(error);
    }
  }
}
