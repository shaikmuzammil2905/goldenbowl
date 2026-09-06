import { OrderRepository } from '../repositories/orderRepository.js';
import { ProductRepository } from '../repositories/productRepository.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { isValidDeliveryTransition, mapDeliveryStageToDbStatus } from '../constants/deliveryLifecycle.js';

import { prisma } from '../config/prisma.js';

export class OrderService {
  static async getOrders(params: { status?: string; customerId?: string }) {
    return OrderRepository.findAll(params);
  }

  static async getOrderById(id: string) {
    const order = await OrderRepository.findById(id);
    if (!order) throw new NotFoundError(`Order ${id} not found`);
    return order;
  }

  static async createOrder(payload: {
    customerId?: string;
    branchId?: number;
    customerName: string;
    orderType?: string;
    deliveryMethod?: string;
    deliveryAddress?: string;
    addressType?: string;
    items: { productId: number; quantity: number }[];
  }) {
    const orderId = `BWL${Math.floor(10000 + Math.random() * 90000)}`;

    let totalAmount = 0;
    const orderItems: { productId: number; quantity: number; unitPrice: number; subtotal: number }[] = [];

    for (const item of payload.items) {
      const product = await ProductRepository.findById(item.productId);
      if (!product || !product.available) {
        throw new BadRequestError(`Product ${item.productId} is not available for order`);
      }
      const unitPrice = Number(product.price);
      const subtotal = unitPrice * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice,
        subtotal,
      });
    }

    const order = await OrderRepository.create({
      id: orderId,
      customerId: payload.customerId,
      branchId: payload.branchId,
      customerName: payload.customerName,
      totalAmount,
      orderType: payload.orderType || 'Delivery',
      deliveryMethod: payload.deliveryMethod || 'DIRECT',
      deliveryAddress: payload.deliveryAddress,
      addressType: payload.addressType,
      items: orderItems,
    });

    if (payload.deliveryMethod === 'PARTNER') {
      // Order created but NO auto-assignment or broadcasting of requests.
      // Admin will manually send a request later.
    }

    // Notify Admin and Support
    await prisma.notification.createMany({
      data: [
        { role: 'ADMIN', title: 'New Order Received', message: `Order ${orderId} placed for ₹${totalAmount}` },
        { role: 'SUPPORT', title: 'Order Monitoring', message: `Order ${orderId} needs active monitoring` },
      ],
    });

    return order;
  }

  static async sendDeliveryRequest(orderId: string, partnerId: string) {
    const order = await this.getOrderById(orderId);
    if (!order) throw new NotFoundError(`Order ${orderId} not found`);
    if (order.driverId) throw new BadRequestError(`Order ${orderId} is already assigned`);

    const partner = await prisma.deliveryPartner.findUnique({
      where: { id: partnerId }
    });
    if (!partner || partner.verificationStatus !== 'VERIFIED') {
      throw new BadRequestError('Selected partner is not eligible for delivery');
    }

    // Check if a pending request already exists for this partner and order
    const existingReq = await prisma.deliveryRequest.findFirst({
      where: { orderId, partnerId, status: 'PENDING' }
    });
    
    if (existingReq) {
       return existingReq;
    }

    // Create delivery request
    const request = await prisma.deliveryRequest.create({
      data: {
        orderId: order.id,
        partnerId: partner.id,
        status: 'PENDING'
      }
    });

    // Notify partner
    try {
      if (partner.userId) {
        await prisma.notification.create({
          data: {
            userId: partner.userId,
            role: 'DELIVERY',
            title: 'New Delivery Request',
            message: `Order ${orderId} is available for pickup. Please check your Pending Requests.`
          }
        });
      }
    } catch {
      // Non-blocking notification
    }

    return request;
  }

  static async updateOrderStatus(id: string, statusInput: string) {
    const order = await this.getOrderById(id);
    if (!order) throw new NotFoundError(`Order ${id} not found`);

    const cleanInput = String(statusInput || '').toUpperCase().trim();
    if (!isValidDeliveryTransition(order.status, cleanInput)) {
      throw new BadRequestError(`Invalid status transition from ${order.status} to ${cleanInput}`);
    }

    const dbStatus = mapDeliveryStageToDbStatus(cleanInput);
    const updated = await OrderRepository.updateStatus(id, dbStatus);

    // If order was delivered and has an assigned driver, increment trips and earnings
    if (dbStatus === 'DELIVERED' && order.driverId) {
      try {
        const partner = await prisma.deliveryPartner.findFirst({
          where: { OR: [{ id: order.driverId }, { userId: order.driverId }] }
        });
        if (partner) {
          await prisma.deliveryPartner.update({
            where: { id: partner.id },
            data: {
              trips: { increment: 1 },
              earnings: { increment: 120.00 },
            },
          });
        }
      } catch (err) {
        console.error('Failed to update driver earnings/trips:', err);
      }
    }

    if (['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(dbStatus)) {
      try {
        await prisma.deliveryRequest.updateMany({
          where: { orderId: id, status: 'PENDING' },
          data: { status: 'ACCEPTED' }
        });
      } catch {
        // Non-blocking
      }
    }

    if (dbStatus === 'CANCELLED') {
      await prisma.deliveryRequest.updateMany({
        where: { orderId: id, status: 'PENDING' },
        data: { status: 'CANCELLED' }
      });
    }

    // Notify Customer
    if (order.customerId) {
      try {
        const stageMessages: Record<string, string> = {
          ARRIVING_AT_PICKUP: 'Your delivery partner is on the way to the restaurant.',
          AT_PICKUP: 'Your delivery partner has arrived at the restaurant.',
          PICKED_UP: 'Your order has been picked up from the restaurant!',
          OUT_FOR_DELIVERY: 'Your order is on the way to your delivery address!',
          ON_THE_WAY: 'Your order is on the way to your delivery address!',
          ARRIVING_AT_CUSTOMER: 'Your delivery partner is near your location!',
          DELIVERED: `Your order #${id} has been delivered. Enjoy your meal!`,
        };
        const msg = stageMessages[cleanInput] || `Order ${id} is now ${dbStatus.replace(/_/g, ' ').toLowerCase()}.`;
        await prisma.notification.create({
          data: {
            userId: order.customerId,
            role: 'CUSTOMER',
            title: 'Order Status Update',
            message: msg,
          },
        });
      } catch {
        // Non-blocking notification
      }
    }

    return {
      ...updated,
      deliveryStage: cleanInput
    };
  }

  static async assignDriver(id: string, driverId: string) {
    await this.getOrderById(id);
    const updated = await OrderRepository.assignDriver(id, driverId);

    // Notify Delivery Partner
    const driver = await prisma.deliveryPartner.findUnique({ where: { id: driverId } });
    if (driver?.userId) {
      await prisma.notification.create({
        data: {
          userId: driver.userId,
          role: 'DELIVERY',
          title: 'New Delivery Assigned',
          message: `Order ${id} has been assigned to you for pickup.`,
        },
      });
    }

    return updated;
  }
}
