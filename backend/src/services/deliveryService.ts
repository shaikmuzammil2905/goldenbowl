import { prisma } from '../config/prisma.js';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors.js';
import { normalizeEmail, normalizePhone, hashPassword } from '../utils/authUtils.js';

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
    const cleanName = String(data.name || '').trim();
    const cleanEmail = normalizeEmail(data.email) || `${normalizePhone(data.mobile)}@goldenbowl.in`;
    const cleanMobile = normalizePhone(data.mobile);
    const vehicle = data.vehicle || 'Bike';

    if (!cleanName || cleanName.length < 2) {
      throw new BadRequestError('Please enter a valid full name (minimum 2 characters).');
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new BadRequestError('Please enter a valid email address.');
    }

    if (!cleanMobile || cleanMobile.length !== 10) {
      throw new BadRequestError('Please enter a valid 10-digit mobile number.');
    }

    if (!data.password || data.password.length < 6) {
      throw new BadRequestError('Password must be at least 6 characters long.');
    }

    const passwordHash = await hashPassword(data.password);
    let userId: string;
    let partner: any;

    // Check if an account already exists with this normalized email
    const existingByEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { deliveryProfile: true },
    });

    if (existingByEmail) {
      // Account exists — update details, set delivery role and new bcrypt password
      userId = existingByEmail.id;
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: cleanName,
          mobile: cleanMobile,
          password: passwordHash,
          role: 'DELIVERY',
          provider: 'email',
        },
      });

      if (existingByEmail.deliveryProfile) {
        partner = await prisma.deliveryPartner.update({
          where: { id: existingByEmail.deliveryProfile.id },
          data: {
            name: cleanName,
            mobile: cleanMobile,
            vehicle: vehicle,
          },
          include: { user: true },
        });
      } else {
        // Link any unattached partner record with same mobile or create new profile
        const unattachedPartner = await prisma.deliveryPartner.findFirst({
          where: { mobile: cleanMobile, userId: null },
        });

        if (unattachedPartner) {
          partner = await prisma.deliveryPartner.update({
            where: { id: unattachedPartner.id },
            data: {
              userId: userId,
              name: cleanName,
              vehicle: vehicle,
            },
            include: { user: true },
          });
        } else {
          partner = await prisma.deliveryPartner.create({
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
        }
      }
    } else {
      // Check if user exists by mobile
      const existingByMobile = await prisma.user.findFirst({
        where: { mobile: cleanMobile },
        include: { deliveryProfile: true },
      });

      if (existingByMobile) {
        userId = existingByMobile.id;
        await prisma.user.update({
          where: { id: userId },
          data: {
            name: cleanName,
            email: cleanEmail,
            password: passwordHash,
            role: 'DELIVERY',
            provider: 'email',
          },
        });

        if (existingByMobile.deliveryProfile) {
          partner = await prisma.deliveryPartner.update({
            where: { id: existingByMobile.deliveryProfile.id },
            data: {
              name: cleanName,
              vehicle: vehicle,
            },
            include: { user: true },
          });
        } else {
          partner = await prisma.deliveryPartner.create({
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
        }
      } else {
        // Create brand-new user with bcrypt password and DELIVERY role
        const newUser = await prisma.user.create({
          data: {
            name: cleanName,
            email: cleanEmail,
            mobile: cleanMobile,
            password: passwordHash,
            role: 'DELIVERY',
            provider: 'email',
          },
        });
        userId = newUser.id;

        partner = await prisma.deliveryPartner.create({
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
      }
    }

    try {
      await prisma.notification.create({
        data: {
          role: 'ADMIN',
          title: 'New Delivery Partner Application',
          message: `${partner.name} (${cleanEmail}) applied for delivery partner onboarding.`,
        },
      });
    } catch {}

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
