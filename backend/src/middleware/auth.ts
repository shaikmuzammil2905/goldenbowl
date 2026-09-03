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

import jwt from 'jsonwebtoken';

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization required' });
  }

  const token = authHeader.split(' ')[1];

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
      return next();
    }
  } catch (err) {
    // If it's not a valid native JWT, we'll let it fall through to Cognito (if configured).
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
    }
  }

  return res.status(401).json({ success: false, message: 'Invalid or expired token' });
}
