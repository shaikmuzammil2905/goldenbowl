import { ProductRepository } from '../repositories/productRepository.js';
import { prisma } from '../config/prisma.js';
import { NotFoundError } from '../utils/errors.js';

export class ProductService {
  static async getProducts(params: { categoryId?: string; search?: string; vegOnly?: boolean }) {
    return ProductRepository.findAll(params);
  }

  static async getProductById(id: number) {
    const product = await ProductRepository.findById(id);
    if (!product) throw new NotFoundError(`Product with ID ${id} not found`);
    return product;
  }

  static async createProduct(data: any) {
    return ProductRepository.create(data);
  }

  static async updateProduct(id: number, data: any) {
    await this.getProductById(id);
    return ProductRepository.update(id, data);
  }

  static async toggleAvailability(id: number) {
    await this.getProductById(id);
    return ProductRepository.toggleAvailability(id);
  }

  static async deleteProduct(id: number) {
    await this.getProductById(id);
    return ProductRepository.delete(id);
  }

  static async getCategories() {
    return prisma.category.findMany({ orderBy: { displayOrder: 'asc' } });
  }

  static async createCategory(data: { id: string; name: string; icon?: string }) {
    return prisma.category.create({ data });
  }
}
