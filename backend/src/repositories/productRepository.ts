import { prisma } from '../config/prisma.js';

export class ProductRepository {
  static async findAll(params: { categoryId?: string; search?: string; vegOnly?: boolean }) {
    const where: any = {};

    if (params.categoryId && params.categoryId !== 'all') {
      where.categoryId = params.categoryId;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.vegOnly) {
      where.veg = true;
    }

    return prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { id: 'asc' },
    });
  }

  static async findById(id: number) {
    return prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  static async create(data: any) {
    const categoryId = data.categoryId || data.category || 'bowls';
    const imageUrl = data.imageUrl || data.image || data.adminImage || 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85';

    // Verify target category exists or connect to bowls
    const catExists = await prisma.category.findUnique({ where: { id: categoryId } });
    const targetCatId = catExists ? categoryId : 'bowls';

    return prisma.product.create({
      data: {
        name: String(data.name || 'Golden Bowl Dish'),
        price: Number(data.price || 0),
        originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
        calories: Number(data.calories || 0),
        portion: String(data.portion || '1 portion'),
        rating: Number(data.rating || 4.5),
        imageUrl: String(imageUrl),
        description: String(data.description || ''),
        ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
        available: data.available !== false,
        veg: data.veg !== false,
        vegan: !!data.vegan,
        sugarFree: !!data.sugarFree,
        category: {
          connect: { id: targetCatId },
        },
      },
      include: { category: true },
    });
  }

  static async update(id: number, data: any) {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = String(data.name);
    if (data.price !== undefined) updateData.price = Number(data.price);
    if (data.originalPrice !== undefined) updateData.originalPrice = data.originalPrice ? Number(data.originalPrice) : null;
    if (data.calories !== undefined) updateData.calories = Number(data.calories);
    if (data.portion !== undefined) updateData.portion = String(data.portion);
    if (data.rating !== undefined) updateData.rating = Number(data.rating);
    if (data.description !== undefined) updateData.description = String(data.description);
    if (data.available !== undefined) updateData.available = data.available !== false;
    if (data.veg !== undefined) updateData.veg = data.veg !== false;
    if (data.vegan !== undefined) updateData.vegan = !!data.vegan;
    if (data.sugarFree !== undefined) updateData.sugarFree = !!data.sugarFree;
    if (Array.isArray(data.ingredients)) updateData.ingredients = data.ingredients;

    const imageUrl = data.imageUrl || data.image || data.adminImage;
    if (imageUrl) updateData.imageUrl = String(imageUrl);

    const categoryId = data.categoryId || data.category;
    if (categoryId) {
      const catExists = await prisma.category.findUnique({ where: { id: categoryId } });
      if (catExists) {
        updateData.category = { connect: { id: categoryId } };
      }
    }

    return prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });
  }

  static async toggleAvailability(id: number) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return null;
    return prisma.product.update({
      where: { id },
      data: { available: !product.available },
      include: { category: true },
    });
  }

  static async delete(id: number) {
    return prisma.product.update({
      where: { id },
      data: { available: false },
      include: { category: true },
    });
  }
}
