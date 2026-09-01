import { prisma } from '../config/prisma.js';
import { Role } from '@prisma/client';

export class UserRepository {
  static async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  static async findByCognitoSub(cognitoSub: string) {
    return prisma.user.findUnique({ where: { cognitoSub } });
  }

  static async createUser(data: { email: string; name: string; role?: Role; mobile?: string; cognitoSub?: string }) {
    return prisma.user.create({ data });
  }

  static async listUsers(role?: Role) {
    return prisma.user.findMany({
      where: role ? { role } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }
}
