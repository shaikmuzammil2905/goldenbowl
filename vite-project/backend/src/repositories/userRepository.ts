import { prisma } from '../config/prisma.js';
import { normalizeEmail, normalizePhone } from '../utils/authUtils.js';

export class UserRepository {
  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { deliveryProfile: true },
    });
  }

  static async findByEmail(email: string) {
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) return null;
    return prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { deliveryProfile: true },
    });
  }

  static async findByMobile(mobile: string) {
    const digits = normalizePhone(mobile);
    if (!digits) return null;
    return prisma.user.findFirst({
      where: {
        OR: [
          { mobile: digits },
          { mobile: `+91${digits}` },
          { deliveryProfile: { mobile: digits } },
          { deliveryProfile: { mobile: `+91${digits}` } },
        ],
      },
      include: { deliveryProfile: true },
    });
  }

  static async findByIdentifier(identifier: string) {
    const raw = String(identifier || '').trim();
    if (!raw) return null;

    if (raw.includes('@')) {
      const cleanEmail = normalizeEmail(raw);
      return prisma.user.findUnique({
        where: { email: cleanEmail },
        include: { deliveryProfile: true },
      });
    }

    // Search by mobile digits
    const digits = normalizePhone(raw);
    return prisma.user.findFirst({
      where: {
        OR: [
          { mobile: raw },
          { mobile: digits },
          { mobile: `+91${digits}` },
          { email: `${digits}@goldenbowl.in` },
          { deliveryProfile: { mobile: raw } },
          { deliveryProfile: { mobile: digits } },
          { deliveryProfile: { mobile: `+91${digits}` } },
        ],
      },
      include: { deliveryProfile: true },
    });
  }

  static async findByCognitoSub(cognitoSub: string) {
    return prisma.user.findUnique({ where: { cognitoSub } });
  }

  static async createUser(data: {
    email: string;
    name: string;
    role?: string;
    mobile?: string;
    password?: string;
    provider?: string;
    cognitoSub?: string;
  }) {
    return prisma.user.create({
      data: {
        email: normalizeEmail(data.email),
        name: data.name.trim(),
        role: (data.role?.toUpperCase() as any) || 'CUSTOMER',
        mobile: data.mobile ? normalizePhone(data.mobile) : null,
        password: data.password || null,
        provider: data.provider || 'email',
        cognitoSub: data.cognitoSub || null,
      },
      include: { deliveryProfile: true },
    });
  }

  static async updatePassword(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    });
  }

  static async listUsers(role?: string) {
    return prisma.user.findMany({
      where: role ? { role: (role.toUpperCase() as any) } : undefined,
      include: { deliveryProfile: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
