import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/errors.js';

export function validateSchema(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errorMessages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return next(new BadRequestError(`Validation failed: ${errorMessages}`));
    }
    req.body = result.data;
    next();
  };
}

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or mobile is required'),
  password: z.string().optional(),
  role: z.enum(['ADMIN', 'SUPPORT', 'DELIVERY', 'CUSTOMER']).default('CUSTOMER'),
});

export const productSchema = z.object({
  categoryId: z.string().optional(),
  category: z.string().optional(),
  name: z.string().optional(),
  price: z.union([z.number(), z.string()]).transform((val) => Number(val)).optional(),
  originalPrice: z.union([z.number(), z.string()]).transform((val) => Number(val)).optional(),
  calories: z.union([z.number(), z.string()]).transform((val) => Number(val)).optional(),
  portion: z.string().optional(),
  rating: z.number().optional(),
  imageUrl: z.string().optional(),
  image: z.string().optional(),
  adminImage: z.string().optional(),
  description: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
  available: z.boolean().optional(),
  veg: z.boolean().optional(),
  vegan: z.boolean().optional(),
  sugarFree: z.boolean().optional(),
});

export const createOrderSchema = z.object({
  branchId: z.number().optional(),
  customerName: z.string().min(1),
  orderType: z.string().default('Delivery'),
  items: z.array(
    z.object({
      productId: z.number(),
      quantity: z.number().min(1),
    })
  ).min(1, 'Order must contain at least one item'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'CONFIRMED',
    'PREPARING',
    'READY_FOR_PICKUP',
    'ASSIGNED',
    'PICKED_UP',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ]),
});

export const createIssueSchema = z.object({
  orderId: z.string().optional(),
  customerName: z.string().optional(),
  subject: z.string().min(3),
  priority: z.enum(['Low', 'Normal', 'High']).default('Normal'),
});

export const presignedUrlSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  folder: z.enum(['products', 'documents', 'logos', 'profiles']).default('products'),
});
