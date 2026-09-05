import { OrderRepository } from '../repositories/orderRepository.js';
import { ProductRepository } from '../repositories/productRepository.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

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
      deliveryAddress: payload.deliveryAddress,
      addressType: payload.addressType,
      items: orderItems,
    });

    // Notify Admin and Support
    await prisma.notification.createMany({
      data: [
        { role: 'ADMIN', title: 'New Order Received', message: `Order ${orderId} placed for ₹${totalAmount}` },
        { role: 'SUPPORT', title: 'Order Monitoring', message: `Order ${orderId} needs active monitoring` },
      ],
    });

    return order;
  }

  static async updateOrderStatus(id: string, status: string) {
    const order = await this.getOrderById(id);
    const updated = await OrderRepository.updateStatus(id, status);

    // If order was delivered and has an assigned driver, increment trips and earnings
    if (status === 'DELIVERED' && order.driverId) {
      try {
        await prisma.deliveryPartner.update({
          where: { id: order.driverId },
          data: {
            trips: { increment: 1 },
            earnings: { increment: 120.00 },
          },
        });
      } catch (err) {
        console.error('Failed to update driver earnings/trips:', err);
      }
    }

    // Notify Customer
    if (order.customerId) {
      await prisma.notification.create({
        data: {
          userId: order.customerId,
          role: 'CUSTOMER',
          title: 'Order Status Update',
          message: `Order ${id} is now ${status.replace(/_/g, ' ').toLowerCase()}.`,
        },
      });
    }

    return updated;
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
