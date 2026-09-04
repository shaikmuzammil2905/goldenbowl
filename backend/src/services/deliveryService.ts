import { prisma } from '../config/prisma.js';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors.js';
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
    email?: string;
    mobile: string;
    vehicle?: string;
    password?: string;
  }) {
    const cleanName = data.name?.trim();
    const cleanEmail = data.email?.trim().toLowerCase() || `${data.mobile?.trim()}@goldenbowl.in`;
    const cleanMobile = data.mobile?.trim();
    const vehicle = data.vehicle || 'Bike';

    if (!cleanName || cleanName.length < 2) {
      throw new BadRequestError('Please enter a valid full name (minimum 2 characters).');
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new BadRequestError('Please enter a valid email address.');
    }

    if (!cleanMobile || !/^\d{10}$/.test(cleanMobile)) {
      throw new BadRequestError('Please enter a valid 10-digit mobile number.');
    }

    if (!data.password || data.password.length < 6) {
      throw new BadRequestError('Password must be at least 6 characters long.');
    }

    // Check if user already exists with this email
    const existingByEmail = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingByEmail) {
      throw new ConflictError('An account with this email address already exists. Please sign in.');
    }

    let userId: string;
    // Check if user already exists by mobile
    const existingByMobile = await prisma.user.findFirst({ where: { mobile: cleanMobile } });
    if (existingByMobile) {
      // Update existing user to delivery role and new password
      const updatedUser = await prisma.user.update({
        where: { id: existingByMobile.id },
        data: {
          name: cleanName,
          email: cleanEmail,
          password: hashPassword(data.password),
          role: 'DELIVERY',
          provider: 'email',
        },
      });
      userId = updatedUser.id;
    } else {
      const newUser = await prisma.user.create({
        data: {
          name: cleanName,
          email: cleanEmail,
          mobile: cleanMobile,
          password: hashPassword(data.password),
          role: 'DELIVERY',
          provider: 'email',
        },
      });
      userId = newUser.id;
    }

    const partner = await prisma.deliveryPartner.create({
      data: {
        userId: userId,
        name: cleanName,
        mobile: cleanMobile,
        vehicle: vehicle,
        verificationStatus: 'PENDING',
        feeAmount: 700.00,
        feeStatus: 'PENDING',
      },
      include: { user: true },
    });

    await prisma.notification.create({
      data: {
        role: 'ADMIN',
        title: 'New Delivery Partner Application',
        message: `${partner.name} (${cleanEmail}) applied for delivery partner onboarding.`,
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
