import { prisma } from '../config/prisma.js';

export class UserRepository {
  static async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  }

  static async findByMobile(mobile: string) {
    return prisma.user.findFirst({ where: { mobile: mobile.trim() } });
  }

  static async findByIdentifier(identifier: string) {
    const clean = identifier.trim();
    if (clean.includes('@')) {
      return prisma.user.findUnique({ where: { email: clean.toLowerCase() } });
    }
    // Search mobile
    const digits = clean.replace(/\D/g, '');
    const mobile10 = digits.length >= 10 ? digits.slice(-10) : digits;
    return prisma.user.findFirst({
      where: {
        OR: [
          { mobile: clean },
          { mobile: mobile10 },
          { mobile: `+91${mobile10}` },
          { email: `${mobile10}@goldenbowl.in` },
        ],
      },
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
        email: data.email.toLowerCase().trim(),
        name: data.name.trim(),
        role: (data.role?.toUpperCase() as any) || 'CUSTOMER',
        mobile: data.mobile?.trim() || null,
        password: data.password || null,
        provider: data.provider || 'email',
        cognitoSub: data.cognitoSub || null,
      },
    });
  }

  static async updatePassword(userId: string, password: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { password },
    });
  }

  static async listUsers(role?: string) {
    return prisma.user.findMany({
      where: role ? { role: (role.toUpperCase() as any) } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }
}
