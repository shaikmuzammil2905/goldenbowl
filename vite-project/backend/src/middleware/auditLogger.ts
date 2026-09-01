import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/prisma.js';
import { logger } from '../utils/logger.js';

export function logAuditAction(action: string, entity: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await prisma.auditLog.create({
            data: {
              userId: req.user?.id || null,
              action,
              entity,
              entityId: (req.params.id as string) || (req.body?.id ? String(req.body.id) : null),
              details: JSON.stringify({
                method: req.method,
                path: req.originalUrl,
                ip: req.ip,
              }),
            },
          });
        } catch (err: any) {
          logger.error('Failed to record audit log entry', err.message);
        }
      }
    });
    next();
  };
}
