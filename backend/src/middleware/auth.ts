import { Response, NextFunction } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { AuthenticatedRequest, AuthUser, UserRole } from '../types/index.js';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { UnauthorizedError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

let verifier: any = null;

// Only initialize Cognito verifier if valid production pool ID is supplied (not placeholder)
if (
  env.COGNITO_USER_POOL_ID &&
  env.COGNITO_CLIENT_ID &&
  !env.COGNITO_USER_POOL_ID.includes('xxxx') &&
  !env.COGNITO_USER_POOL_ID.endsWith('_goldenbowl')
) {
  try {
    verifier = CognitoJwtVerifier.create({
      userPoolId: env.COGNITO_USER_POOL_ID,
      tokenUse: 'id',
      clientId: env.COGNITO_CLIENT_ID,
    });
  } catch (err) {
    logger.warn('Cognito JWT verifier initialization skipped');
  }
}

import jwt from 'jsonwebtoken';

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization required', code: 'AUTH_REQUIRED' });
  }

  const token = authHeader.split(' ')[1];
  let isExpired = false;
  let failureReason = 'unknown';

  // 1. Application Native JWT Check
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as any;
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
      };
      logger.info(`[Auth] User authenticated: ${user.id} (${user.role}) for ${req.method} ${req.originalUrl}`);
      return next();
    } else {
      failureReason = 'user_not_found_in_db';
    }
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      isExpired = true;
      failureReason = 'token_expired';
    } else {
      failureReason = err.message || 'invalid_jwt';
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
      logger.info(`[Auth] Cognito user authenticated: ${user.id} (${user.role}) for ${req.method} ${req.originalUrl}`);
      return next();
    } catch (error: any) {
      failureReason = `cognito_${error.message}`;
    }
  }

  logger.warn(`[Auth] Unauthorized request: ${req.method} ${req.originalUrl} - reason: ${failureReason}`);
  return res.status(401).json({
    success: false,
    message: 'Invalid or expired token',
    code: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID'
  });
}
