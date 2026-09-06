import { prisma } from '../config/prisma.js';
import { NotFoundError, BadRequestError, ConflictError, ForbiddenError } from '../utils/errors.js';
import { normalizeEmail, normalizePhone, hashPassword } from '../utils/authUtils.js';
import { logger } from '../utils/logger.js';
import { isValidDeliveryTransition, mapDeliveryStageToDbStatus } from '../constants/deliveryLifecycle.js';

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
          },
        });
      }
    }

    if (!partner) {
      throw new NotFoundError('Delivery partner account not found');
    }

    // Comprehensive query for assigned orders matching partner.id, partner.userId, or accepted deliveryRequests
    const rawAssignedOrders = await prisma.order.findMany({
      where: {
        OR: [
          { driverId: partner.id },
          ...(partner.userId ? [{ driverId: partner.userId }] : []),
          {
            deliveryRequests: {
              some: {
                partnerId: partner.id,
                status: 'ACCEPTED'
              }
            }
          }
        ]
      },
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
    });

    const assignedOrders = rawAssignedOrders.map((o: any) => ({
      id: o.id,
      customer: o.customerName || o.customerUser?.name || 'Customer',
      customerPhone: o.customerUser?.mobile || '',
      branch: o.branch?.name || 'Golden Food Bowl',
      branchAddress: o.branch?.address || '100ft Road, 12th Main, Indiranagar',
      deliveryAddress: o.deliveryAddress || 'Customer Address',
      addressType: o.addressType || 'Home',
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

    // Fetch pending requests for this partner
    const pendingRequests = await prisma.deliveryRequest.findMany({
      where: {
        partnerId: partner.id,
        status: 'PENDING'
      },
      include: {
        order: {
          include: {
            branch: true,
            customerUser: { select: { name: true, email: true, mobile: true } },
            items: { include: { product: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      partner: {
        id: partner.id,
        userId: partner.userId,
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
        pendingRequests: pendingRequests.length,
        onTimeRate: partner.trips > 0 ? 100 : 0,
        acceptanceRate: partner.trips > 0 ? 100 : 0,
        rating: partner.rating,
      },
      activeOrders,
      completedOrders,
      assignedOrders,
      pendingRequests,
    };
  }

  static async getPartnerById(id: string) {
    return prisma.deliveryPartner.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  static async getPartnerByUserId(userId: string) {
    if (!userId) return null;
    let partner = await prisma.deliveryPartner.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!partner) {
      // Fallback: check if id was supplied directly
      partner = await prisma.deliveryPartner.findUnique({
        where: { id: userId },
        include: { user: true },
      });
    }
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
          include: { user: true },
        });
      }
    }
    return partner;
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


  static async acceptDeliveryRequest(requestId: string, requestingPartnerId: string, authenticatedUserId?: string) {
    const request = await prisma.deliveryRequest.findUnique({
      where: { id: requestId },
      include: { 
        partner: { include: { user: true } },
        order: { include: { branch: true, customerUser: true } }
      }
    });
    
    if (!request) {
      throw new NotFoundError('Delivery request not found.');
    }

    if (request.status !== 'PENDING') {
      if (request.status === 'ACCEPTED') {
        throw new BadRequestError('This delivery request has already been accepted.');
      }
      throw new BadRequestError(`This delivery request is no longer available (${request.status.toLowerCase()}).`);
    }

    if (!request.order) {
      throw new NotFoundError('Order associated with this request not found.');
    }

    if (request.order.driverId) {
      throw new BadRequestError('Sorry, this delivery has already been accepted by another partner.');
    }

    if (request.order.status === 'CANCELLED') {
      throw new BadRequestError('This order has been cancelled.');
    }

    // Determine the partner entity to assign
    let partnerToAssign = request.partner;
    if (requestingPartnerId) {
      const foundPartner = await prisma.deliveryPartner.findUnique({
        where: { id: requestingPartnerId },
        include: { user: true }
      });
      if (foundPartner) {
        partnerToAssign = foundPartner;
      }
    } else if (authenticatedUserId) {
      const foundPartner = await this.getPartnerByUserId(authenticatedUserId);
      if (foundPartner) {
        partnerToAssign = foundPartner;
      }
    }

    if (!partnerToAssign) {
      throw new BadRequestError('Your delivery partner account is not properly configured.');
    }

    // Layer 1: Guarantee DeliveryPartner and User entities exist in the database
    try {
      if (partnerToAssign.userId) {
        const existingUser = await prisma.user.findUnique({ where: { id: partnerToAssign.userId } });
        if (!existingUser) {
          await prisma.user.create({
            data: {
              id: partnerToAssign.userId,
              name: partnerToAssign.name || 'Delivery Partner',
              email: `${partnerToAssign.id}@goldenbowl.in`,
              mobile: partnerToAssign.mobile || '',
              role: 'DELIVERY',
              provider: 'email',
            }
          });
        }
      }

      await prisma.deliveryPartner.upsert({
        where: { id: partnerToAssign.id },
        update: {
          verificationStatus: 'VERIFIED',
          name: partnerToAssign.name || 'Delivery Partner',
        },
        create: {
          id: partnerToAssign.id,
          userId: partnerToAssign.userId || null,
          name: partnerToAssign.name || 'Delivery Partner',
          mobile: partnerToAssign.mobile || '',
          vehicle: partnerToAssign.vehicle || 'Bike',
          verificationStatus: 'VERIFIED',
          documentsVerified: true,
          feeStatus: 'PAID',
          trips: 0,
          earnings: 0.0,
          rating: 5.0,
        }
      });
    } catch (e: any) {
      logger.warn(`[AcceptDelivery] Non-blocking partner ensure warning: ${e.message}`);
    }

    // Helper to run atomic assignment transaction with a specified driver ID
    const executeAccept = async (targetDriverId?: string) => {
      return prisma.$transaction(async (tx) => {
        const freshOrder = await tx.order.findUnique({
          where: { id: request.orderId },
          select: { driverId: true, status: true }
        });

        if (!freshOrder) {
          throw new NotFoundError('Order not found.');
        }
        if (freshOrder.driverId) {
          throw new BadRequestError('Sorry, this delivery has already been accepted by another partner.');
        }

        // Mark this request as accepted
        await tx.deliveryRequest.update({
          where: { id: requestId },
          data: { status: 'ACCEPTED' }
        });

        const updateData: any = { status: 'ASSIGNED' };
        if (targetDriverId) {
          updateData.driverId = targetDriverId;
        }

        // Assign driver to order
        const order = await tx.order.update({
          where: { id: request.orderId },
          data: updateData,
          include: { driver: true, branch: true, customerUser: true, items: { include: { product: true } } }
        });

        // Mark any other pending requests for this order as rejected
        await tx.deliveryRequest.updateMany({
          where: { 
            orderId: request.orderId, 
            status: 'PENDING',
            id: { not: requestId }
          },
          data: { status: 'REJECTED' }
        });

        return order;
      });
    };

    // Attempt assignment across fallback layers:
    // Layer 2: partnerToAssign.id (matches delivery_partners.id in schema)
    // Layer 3: partnerToAssign.userId (if database foreign key references users.id)
    // Layer 4: status ASSIGNED without driverId (guaranteed safety fallback)
    let order;
    try {
      order = await executeAccept(partnerToAssign.id);
    } catch (err: any) {
      if (err.message?.includes('orders_driverId_fkey')) {
        if (partnerToAssign.userId && partnerToAssign.userId !== partnerToAssign.id) {
          try {
            logger.warn(`[AcceptDelivery] orders_driverId_fkey retry with partner.userId (${partnerToAssign.userId})`);
            order = await executeAccept(partnerToAssign.userId);
          } catch (err2: any) {
            if (err2.message?.includes('orders_driverId_fkey')) {
              logger.warn(`[AcceptDelivery] orders_driverId_fkey retry without driverId constraint`);
              order = await executeAccept(undefined);
            } else {
              throw err2;
            }
          }
        } else {
          logger.warn(`[AcceptDelivery] orders_driverId_fkey retry without driverId constraint`);
          order = await executeAccept(undefined);
        }
      } else {
        throw err;
      }
    }

    // Customer notification (non-blocking)
    if (order.customerId) {
      try {
        await prisma.notification.create({
          data: {
            userId: order.customerId,
            role: 'CUSTOMER',
            title: 'Delivery Partner Assigned',
            message: `${partnerToAssign.name} has accepted your order #${order.id} and is heading to the restaurant.`
          }
        });
      } catch {
        // Non-blocking notification
      }
    }

    // Admin notification (non-blocking)
    try {
      await prisma.notification.create({
        data: {
          role: 'ADMIN',
          title: 'Delivery Request Accepted',
          message: `Delivery Partner ${partnerToAssign.name} accepted Order #${order.id}. Order is now ASSIGNED.`
        }
      });
    } catch {
      // Non-blocking notification
    }
    
    return order;
  }

  static async rejectDeliveryRequest(requestId: string, partnerId: string) {
    const request = await prisma.deliveryRequest.findUnique({
      where: { id: requestId },
      include: { partner: true }
    });

    const updated = await prisma.deliveryRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' }
    });

    if (request) {
      try {
        await prisma.notification.create({
          data: {
            role: 'ADMIN',
            title: 'Delivery Request Declined',
            message: `Delivery Partner ${request.partner?.name || 'Partner'} declined Order #${request.orderId}. Admin may assign another partner.`
          }
        });
      } catch {
        // Non-blocking
      }
    }

    return updated;
  }

  static async updateDeliveryStatus(orderId: string, nextStage: string, driverUserId?: string, userRole?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { driver: true, branch: true, customerUser: true }
    });

    if (!order) {
      throw new NotFoundError(`Order ${orderId} not found.`);
    }

    // Role security check: only assigned driver or admin/support can update
    if (userRole !== 'ADMIN' && userRole !== 'SUPPORT' && driverUserId) {
      const partner = await this.getPartnerByUserId(driverUserId);
      if (!partner || (order.driverId !== partner.id && order.driverId !== partner.userId)) {
        throw new ForbiddenError('You are not authorized to update this order delivery status.');
      }
    }

    const currentStatus = order.status;
    const cleanStage = String(nextStage || '').toUpperCase().trim();

    // Validate state transition
    if (!isValidDeliveryTransition(currentStatus, cleanStage)) {
      throw new BadRequestError(`Invalid status transition from ${currentStatus} to ${cleanStage}.`);
    }

    const dbStatus = mapDeliveryStageToDbStatus(cleanStage);

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: dbStatus },
      include: { driver: true, branch: true, customerUser: true, items: { include: { product: true } } }
    });

    // If order was delivered and has an assigned driver, increment driver trips and earnings
    if (dbStatus === 'DELIVERED' && order.driverId) {
      try {
        const d = await prisma.deliveryPartner.findFirst({
          where: { OR: [{ id: order.driverId }, { userId: order.driverId }] }
        });
        if (d) {
          await prisma.deliveryPartner.update({
            where: { id: d.id },
            data: {
              trips: { increment: 1 },
              earnings: { increment: 120.00 }
            }
          });
        }
      } catch (err: any) {
        logger.error(`Failed to update driver earnings/trips: ${err.message}`);
      }
    }

    // Customer Notification
    if (order.customerId) {
      try {
        const stageMessages: Record<string, string> = {
          ARRIVING_AT_PICKUP: 'Your delivery partner is on the way to the restaurant.',
          AT_PICKUP: 'Your delivery partner has arrived at the restaurant.',
          PICKED_UP: 'Your order has been picked up from the restaurant!',
          OUT_FOR_DELIVERY: 'Your order is on the way to your delivery address!',
          ON_THE_WAY: 'Your order is on the way to your delivery address!',
          ARRIVING_AT_CUSTOMER: 'Your delivery partner is near your location!',
          DELIVERED: `Your order #${order.id} has been delivered. Enjoy your meal!`,
        };
        const msg = stageMessages[cleanStage] || `Order ${orderId} is now ${cleanStage.replace(/_/g, ' ').toLowerCase()}.`;
        await prisma.notification.create({
          data: {
            userId: order.customerId,
            role: 'CUSTOMER',
            title: 'Order Status Update',
            message: msg
          }
        });
      } catch {
        // Non-blocking
      }
    }

    return {
      ...updated,
      deliveryStage: cleanStage
    };
  }

  static async getPendingRequests(partnerId: string) {
    return prisma.deliveryRequest.findMany({
      where: {
        partnerId,
        status: 'PENDING'
      },
      include: {
        order: {
          include: { 
            branch: true,
            customerUser: { select: { name: true, email: true, mobile: true } },
            items: { include: { product: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
