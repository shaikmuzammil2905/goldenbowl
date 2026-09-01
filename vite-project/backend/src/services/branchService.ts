import { prisma } from '../config/prisma.js';
import { NotFoundError } from '../utils/errors.js';

export class BranchService {
  static async getBranches() {
    return prisma.branch.findMany({ orderBy: { id: 'asc' } });
  }

  static async getBranchById(id: number) {
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundError(`Branch ${id} not found`);
    return branch;
  }

  static async createBranch(data: { name: string; area: string; distance?: string; open?: boolean }) {
    return prisma.branch.create({ data });
  }

  static async duplicateBranchMenu(sourceBranchId: number, newBranchData: { name: string; area: string }) {
    const sourceBranch = await this.getBranchById(sourceBranchId);

    const newBranch = await prisma.branch.create({
      data: {
        name: newBranchData.name,
        area: newBranchData.area,
        menuCopiedFrom: sourceBranch.name,
      },
    });

    await prisma.notification.create({
      data: {
        role: 'ADMIN',
        title: 'Branch Duplicated',
        message: `${newBranch.name} menu copied from ${sourceBranch.name}.`,
      },
    });

    return newBranch;
  }
}
