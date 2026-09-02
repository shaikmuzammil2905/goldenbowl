import { prisma } from '../config/prisma.js';

export class UserRepository {
  static async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  static async findByMobile(mobile: string) {
    return prisma.user.findFirst({ where: { mobile } });
  }

  static async findByCognitoSub(cognitoSub: string) {
    return prisma.user.findUnique({ where: { cognitoSub } });
  }

  static async createUser(data: { email: string; name: string; role?: string; mobile?: string; password?: string; cognitoSub?: string }) {
    return prisma.user.create({ data });
  }

  static async updatePassword(userId: string, password: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { password },
    });
  }

  static async listUsers(role?: string) {
    return prisma.user.findMany({
      where: role ? { role } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }
}
