import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService.js';

export class ProductController {
  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, search, vegOnly } = req.query;
      const products = await ProductService.getProducts({
        categoryId: category as string,
        search: search as string,
        vegOnly: vegOnly === 'true',
      });
      res.status(200).json({ success: true, data: products });
    } catch (error) {
      next(error);
    }
  }

  static async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      const product = await ProductService.getProductById(id);
      res.status(200).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.createProduct(req.body);
      res.status(201).json({ success: true, message: 'Product created', data: product });
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      const product = await ProductService.updateProduct(id, req.body);
      res.status(200).json({ success: true, message: 'Product updated', data: product });
    } catch (error) {
      next(error);
    }
  }

  static async toggleAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      const product = await ProductService.toggleAvailability(id);
      res.status(200).json({ success: true, message: 'Product availability toggled', data: product });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      await ProductService.deleteProduct(id);
      res.status(200).json({ success: true, message: 'Product marked unavailable' });
    } catch (error) {
      next(error);
    }
  }
}

export class CategoryController {
  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await ProductService.getCategories();
      res.status(200).json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await ProductService.createCategory(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }
}
