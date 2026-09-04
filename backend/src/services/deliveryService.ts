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

  static async getCurrentPartnerDashboard(userId: string) {
    let partner = await prisma.deliveryPartner.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, name: true, email: true, mobile: true, role: true },
        },
        assignedOrders: {
          include: {
            items: {
              include: { product: true },
            },
            branch: true,
            customerUser: {
              select: { name: true, email: true, mobile: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!partner) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        partner = await prisma.deliveryPartner.create({
          data: {
            userId: user.id,
            name: user.name,
            mobile: user.mobile || '',
            vehicle: 'Bike',
            verificationStatus: 'VERIFIED',
            documentsVerified: true,
            feeStatus: 'PAID',
            trips: 0,
            earnings: 0.0,
            rating: 5.0,
          },
          include: {
            user: {
              select: { id: true, name: true, email: true, mobile: true, role: true },
            },
            assignedOrders: {
              include: {
                items: {
                  include: { product: true },
                },
                branch: true,
                customerUser: {
                  select: { name: true, email: true, mobile: true },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        });
      }
    }

    if (!partner) {
      throw new NotFoundError('Delivery partner account not found');
    }

    const assignedOrders = (partner.assignedOrders || []).map((o: any) => ({
      id: o.id,
      customer: o.customerName || o.customerUser?.name || 'Customer',
      customerPhone: o.customerUser?.mobile || '',
      branch: o.branch?.name || 'Golden Food Bowl',
      branchAddress: o.branch?.address || '100ft Road, 12th Main, Indiranagar',
      total: Number(o.totalAmount || 0),
      status: o.status,
      orderType: o.orderType || 'Delivery',
      eta: o.etaMinutes || 25,
      createdAt: o.createdAt,
      items: o.items || [],
    }));

    const activeOrders = assignedOrders.filter(
      (o: any) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
    );
    const completedOrders = assignedOrders.filter(
      (o: any) => o.status === 'DELIVERED'
    );

    return {
      partner: {
        id: partner.id,
        name: partner.name,
        email: partner.user?.email || '',
        mobile: partner.mobile || partner.user?.mobile || '',
        vehicle: partner.vehicle,
        verificationStatus: partner.verificationStatus,
        documentsVerified: partner.documentsVerified,
        feeStatus: partner.feeStatus,
        trips: partner.trips,
        earnings: Number(partner.earnings),
        rating: partner.rating,
      },
      stats: {
        todayPay: Number(partner.earnings),
        trips: partner.trips,
        completedTrips: completedOrders.length,
        activeTrips: activeOrders.length,
        onTimeRate: partner.trips > 0 ? 100 : 0,
        acceptanceRate: partner.trips > 0 ? 100 : 0,
        rating: partner.rating,
      },
      activeOrders,
      completedOrders,
      assignedOrders,
    };
  }

  static async getPartnerById(id: string) {
    return prisma.deliveryPartner.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  static async updatePartnerProfile(id: string, data: any) {
    const updateData: any = {};
    if (data.vehicle !== undefined) updateData.vehicle = data.vehicle;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.mobile !== undefined) updateData.mobile = data.mobile;

    return prisma.deliveryPartner.update({
      where: { id },
      data: updateData,
      include: { user: true },
    });
  }
}
