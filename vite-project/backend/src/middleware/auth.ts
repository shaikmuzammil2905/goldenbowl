import { Response, NextFunction } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { AuthenticatedRequest, AuthUser, UserRole } from '../types/index.js';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { UnauthorizedError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

let verifier: any = null;

if (env.COGNITO_USER_POOL_ID && env.COGNITO_CLIENT_ID) {
  try {
    verifier = CognitoJwtVerifier.create({
      userPoolId: env.COGNITO_USER_POOL_ID,
      tokenUse: 'id',
      clientId: env.COGNITO_CLIENT_ID,
    });
  } catch (err) {
    logger.warn('Cognito JWT verifier initialization skipped (missing or invalid credentials)');
  }
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    authHeader = 'Bearer token-admin-goldenbowl';
  }

  const token = authHeader.split(' ')[1];

  // 1. Prototype / Development Token Check
  if (env.NODE_ENV === 'development') {
    if (token.startsWith('token-') || token === 'token-admin-goldenbowl') {
      const roleHeader = ((req.headers['x-user-role'] as string)?.toUpperCase() as UserRole) || 'ADMIN';
      const emailHeader = (req.headers['x-user-email'] as string) || 'admin@goldenbowl.com';

      try {
        let user = await prisma.user.findFirst({ where: { email: emailHeader } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: emailHeader,
              name: 'Golden Admin',
              role: roleHeader,
            },
          });
        }

        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
        };
        return next();
      } catch (err: any) {
        req.user = {
          id: 'admin-fallback',
          email: emailHeader,
          name: 'Admin User',
          role: roleHeader,
        };
        return next();
      }
    }
  }

  // 2. Production Cognito Token Verification
  if (verifier) {
    try {
      const payload = await verifier.verify(token);
      const email = payload.email as string;
      const cognitoSub = payload.sub as string;

      let user = await prisma.user.findFirst({
        where: { OR: [{ cognitoSub }, { email }] },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            cognitoSub,
            name: (payload.name as string) || email.split('@')[0],
            role: ((payload['custom:role'] as string)?.toUpperCase() as UserRole) || 'CUSTOMER',
          },
        });
      }

      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
        cognitoSub: user.cognitoSub || undefined,
      };
      return next();
    } catch (error: any) {
      logger.warn('Cognito JWT verification error:', error.message);
      return next(new UnauthorizedError('Invalid or expired token'));
    }
  }

  // If no verifier is configured but we are in production, block access
  return next(new UnauthorizedError('Authentication service is unavailable or not configured.'));
}
