import { prisma } from '../config/prisma.js';
import { NotFoundError } from '../utils/errors.js';


export class DeliveryService {
  static async getPartners() {
    return prisma.deliveryPartner.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async registerPartner(data: {
    userId?: string;
    name: string;
    mobile: string;
    vehicle?: string;
  }) {
    const partner = await prisma.deliveryPartner.create({
      data: {
        userId: data.userId,
        name: data.name,
        mobile: data.mobile,
        vehicle: data.vehicle || 'Bike',
        verificationStatus: 'PENDING',
        feeAmount: 700.00,
        feeStatus: 'PENDING',
      },
    });

    await prisma.notification.create({
      data: {
        role: 'ADMIN',
        title: 'New Delivery Partner Application',
        message: `${partner.name} applied for delivery partner onboarding.`,
      },
    });

    return partner;
  }

  static async updateVerificationStatus(id: string, verificationStatus: string, feeStatus: string = 'PAID') {
    const partner = await prisma.deliveryPartner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundError(`Delivery partner ${id} not found`);

    return prisma.deliveryPartner.update({
      where: { id },
      data: {
        verificationStatus: (verificationStatus as any),
        feeStatus: (feeStatus as any),
        documentsVerified: verificationStatus === 'VERIFIED',
      },
    });
  }
}
