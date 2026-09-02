import { prisma } from '../config/prisma.js';

export class OrderRepository {
  static async findAll(params: { status?: string; customerId?: string }) {
    return prisma.order.findMany({
      where: {
        status: (params.status as any),
        customerId: params.customerId,
      },
      include: {
        items: { include: { product: true } },
        branch: true,
        driver: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        branch: true,
        driver: true,
        issues: true,
      },
    });
  }

  static async create(data: {
    id: string;
    customerId?: string;
    branchId?: number;
    customerName: string;
    totalAmount: number;
    orderType: string;
    items: { productId: number; quantity: number; unitPrice: number; subtotal: number }[];
  }) {
    return prisma.order.create({
      data: {
        id: data.id,
        customerId: data.customerId,
        branchId: data.branchId,
        customerName: data.customerName,
        totalAmount: data.totalAmount,
        orderType: data.orderType,
        items: {
          create: data.items,
        },
      },
      include: {
        items: { include: { product: true } },
        branch: true,
      },
    });
  }

  static async updateStatus(id: string, status: string) {
    return prisma.order.update({
      where: { id },
      data: { status: (status as any) },
      include: { items: true, branch: true, driver: true },
    });
  }

  static async assignDriver(id: string, driverId: string) {
    return prisma.order.update({
      where: { id },
      data: { driverId, status: 'ASSIGNED' },
      include: { driver: true },
    });
  }
}
