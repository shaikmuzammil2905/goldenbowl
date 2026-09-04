import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    logger.warn(`Operational Error: [${err.statusCode}] ${err.message}`);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  logger.error('Unhandled Application Exception', err);

  // Avoid leaking raw database error messages or internal AWS stack traces to the frontend
  let message = 'Internal Server Error';
  if (err.message) {
    if (err.message.includes('Prisma') || err.message.toLowerCase().includes('database') || err.message.includes('aws-sdk')) {
      message = 'An unexpected database or service error occurred. Please try again.';
    } else {
      message = err.message;
    }
  }

  return res.status(500).json({
    success: false,
    message,
  });
}
