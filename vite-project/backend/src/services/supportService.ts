import { prisma } from '../config/prisma.js';
import { NotFoundError } from '../utils/errors.js';
import { IssueStatus, IssuePriority } from '@prisma/client';

export class SupportService {
  static async getIssues() {
    return prisma.supportIssue.findMany({
      include: { order: true, customer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createIssue(data: {
    orderId?: string;
    customerId?: string;
    customerName?: string;
    subject: string;
    priority?: IssuePriority;
  }) {
    const issueId = `TKT-${Math.floor(900 + Math.random() * 100)}`;
    return prisma.supportIssue.create({
      data: {
        id: issueId,
        orderId: data.orderId,
        customerId: data.customerId,
        customerName: data.customerName || 'Guest Customer',
        subject: data.subject,
        priority: data.priority || 'Normal',
        status: 'OPEN',
      },
    });
  }

  static async updateIssueStatus(id: string, status: IssueStatus) {
    const issue = await prisma.supportIssue.findUnique({ where: { id } });
    if (!issue) throw new NotFoundError(`Ticket ${id} not found`);

    return prisma.supportIssue.update({
      where: { id },
      data: { status },
    });
  }
}
