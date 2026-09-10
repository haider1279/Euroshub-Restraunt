import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.menuCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            items: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });
    return res.json({ categories });
  } catch (err) {
    next(err);
  }
};

export const getMenuItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      categoryId,
      search,
      tag,
      sort,
      isAvailable,
      page = '1',
      pageSize = '50',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(pageSize, 10) || 50));
    const skip = (pageNum - 1) * limit;

    const where: any = { deletedAt: null };

    // For public endpoint, default to only available items unless explicitly queried
    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable === 'true';
    } else {
      where.isAvailable = true;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { sortOrder: 'asc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    if (sort === 'popular') orderBy = { isPopular: 'desc' };

    const [items, totalCount] = await Promise.all([
      prisma.menuItem.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: {
            select: { id: true, name: true },
          },
          variants: {
            orderBy: { sortOrder: 'asc' },
          },
          addonLinks: {
            include: { addon: true },
          },
        },
      }),
      prisma.menuItem.count({ where }),
    ]);

    return res.json({
      items,
      pagination: {
        page: pageNum,
        pageSize: limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getChefSpecialItems = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.menuItem.findMany({
      where: {
        isChefSpecial: true,
        isAvailable: true,
        deletedAt: null,
      },
      include: {
        category: true,
        variants: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return res.json({ items });
  } catch (err) {
    next(err);
  }
};

export const getFeaturedItems = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.menuItem.findMany({
      where: {
        isFeatured: true,
        isAvailable: true,
        deletedAt: null,
      },
      include: {
        category: true,
        variants: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return res.json({ items });
  } catch (err) {
    next(err);
  }
};

export const getPopularItems = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Only compute from REAL completed orders. If none exist, return []
    const popularAggregation = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: { status: 'COMPLETED' },
        menuItemId: { not: null },
      },
      _sum: { quantity: true },
      orderBy: {
        _sum: { quantity: 'desc' },
      },
      take: 6,
    });

    const popularIds = popularAggregation
      .map((p) => p.menuItemId)
      .filter((id): id is string => id !== null);

    if (popularIds.length === 0) {
      return res.json({ items: [] });
    }

    const items = await prisma.menuItem.findMany({
      where: {
        id: { in: popularIds },
        isAvailable: true,
        deletedAt: null,
      },
      include: {
        category: true,
        variants: { orderBy: { sortOrder: 'asc' } },
      },
    });

    // Sort matching the aggregation order
    const sorted = popularIds
      .map((id) => items.find((i) => i.id === id))
      .filter((i): i is typeof items[0] => i !== undefined);

    return res.json({ items: sorted });
  } catch (err) {
    next(err);
  }
};

export const getMenuItemById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const item = await prisma.menuItem.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        variants: {
          orderBy: { sortOrder: 'asc' },
        },
        addonLinks: {
          include: { addon: true },
        },
      },
    });

    if (!item) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Menu item not found.' },
      });
    }

    // Fetch up to 4 related dishes from the same category
    const relatedItems = await prisma.menuItem.findMany({
      where: {
        categoryId: item.categoryId,
        id: { not: item.id },
        isAvailable: true,
        deletedAt: null,
      },
      include: {
        variants: { orderBy: { sortOrder: 'asc' } },
      },
      take: 4,
    });

    return res.json({ item, relatedItems });
  } catch (err) {
    next(err);
  }
};

// Admin: Get all items with full operational details
export const getAdminMenuItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      categoryId,
      search,
      isAvailable,
      page = '1',
      pageSize = '50',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(pageSize, 10) || 50));
    const skip = (pageNum - 1) * limit;

    const where: any = { deletedAt: null };
    if (categoryId) where.categoryId = categoryId;
    if (isAvailable !== undefined && isAvailable !== 'all') {
      where.isAvailable = isAvailable === 'true';
    }
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [items, totalCount] = await Promise.all([
      prisma.menuItem.findMany({
        where,
        orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }, { updatedAt: 'desc' }],
        skip,
        take: limit,
        include: {
          category: true,
          variants: { orderBy: { sortOrder: 'asc' } },
          addonLinks: { include: { addon: true } },
        },
      }),
      prisma.menuItem.count({ where }),
    ]);

    return res.json({
      items,
      pagination: {
        page: pageNum,
        pageSize: limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const createMenuItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { variants, addonIds, ...productData } = req.body;

    const item = await prisma.menuItem.create({
      data: {
        ...productData,
        variants:
          variants && Array.isArray(variants) && variants.length > 0
            ? {
                create: variants.map((v: any, index: number) => ({
                  name: v.name,
                  price: Number(v.price),
                  sortOrder: v.sortOrder !== undefined ? v.sortOrder : index + 1,
                  isAvailable: v.isAvailable !== undefined ? Boolean(v.isAvailable) : true,
                })),
              }
            : undefined,
      },
      include: {
        category: true,
        variants: true,
      },
    });

    return res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
};

export const updateMenuItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { variants, ...productData } = req.body;

    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Menu item not found.' } });
    }

    // If variants array provided, update or sync
    if (variants && Array.isArray(variants)) {
      await prisma.productVariant.deleteMany({ where: { productId: id } });
      await prisma.productVariant.createMany({
        data: variants.map((v: any, index: number) => ({
          productId: id,
          name: v.name,
          price: Number(v.price),
          sortOrder: v.sortOrder !== undefined ? v.sortOrder : index + 1,
          isAvailable: v.isAvailable !== undefined ? Boolean(v.isAvailable) : true,
        })),
      });
    }

    const item = await prisma.menuItem.update({
      where: { id },
      data: productData,
      include: {
        category: true,
        variants: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return res.json({ item });
  } catch (err) {
    next(err);
  }
};

export const deleteMenuItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = await prisma.menuItem.findUnique({
      where: { id },
      include: { orderItems: { take: 1 } },
    });

    if (!existing) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Menu item not found.' } });
    }

    // Always soft-delete to preserve historical orders and line item integrity
    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isAvailable: false,
      },
    });

    return res.json({
      message: 'Menu item soft-deleted successfully (historical orders preserved).',
      item,
    });
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await prisma.menuCategory.create({
      data: req.body,
      include: { _count: { select: { items: true } } },
    });
    return res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = await prisma.menuCategory.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Category not found.' } });
    }
    const category = await prisma.menuCategory.update({
      where: { id },
      data: req.body,
      include: { _count: { select: { items: true } } },
    });
    return res.json({ category });
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = await prisma.menuCategory.findUnique({
      where: { id },
      include: { items: { where: { deletedAt: null }, take: 1 } },
    });
    if (!existing) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Category not found.' } });
    }
    if (existing.items.length > 0) {
      return res.status(400).json({
        error: {
          code: 'CATEGORY_HAS_ITEMS',
          message: 'Cannot delete a category that still has active menu items. Reassign or delete the items first.',
        },
      });
    }
    await prisma.menuCategory.delete({ where: { id } });
    return res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
