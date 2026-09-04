import { prisma } from '../config/prisma.js';
import { NotFoundError } from '../utils/errors.js';
import crypto from 'crypto';

const PASSWORD_SALT = process.env.PASSWORD_SALT || 'goldenbowl_password_salt_2026';

function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, PASSWORD_SALT, 10000, 64, 'sha512').toString('hex');
}


export class DeliveryService {
  static async getPartners() {
    return prisma.deliveryPartner.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async registerPartner(data: {
    name: string;
    mobile: string;
    vehicle?: string;
    password?: string;
  }) {
    let userId: string | undefined = undefined;

    // Create User record for the delivery partner if password is provided
    if (data.password) {
      const email = `${data.mobile}@goldenbowl.in`;
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({ where: { mobile: data.mobile } });
      if (!existingUser) {
        const user = await prisma.user.create({
          data: {
            name: data.name,
            mobile: data.mobile,
            email: email,
            password: hashPassword(data.password),
            role: 'DELIVERY',
            provider: 'mobile',
          }
        });
        userId = user.id;
      } else {
        // If user exists, update password and role
        const user = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            password: hashPassword(data.password),
            role: 'DELIVERY',
          }
        });
        userId = user.id;
      }
    }

    const partner = await prisma.deliveryPartner.create({
      data: {
        userId: userId,
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

  static async getPartnerById(id: string) {
    return prisma.deliveryPartner.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  static async updatePartnerProfile(id: string, data: any) {
    return prisma.deliveryPartner.update({
      where: { id },
      data: {
        vehicle: data.vehicle,
      },
    });
  }
}
