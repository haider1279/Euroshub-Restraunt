import { Response, NextFunction } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../prisma';
import { AuthRequest, OrderStatus } from '../types';
import { generateOrderNumber, isValidStatusTransition, ALLOWED_STATUS_TRANSITIONS } from '../services/order.service';

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const {
      type,
      items: incomingItems,
      contactPhone,
      deliveryAddress,
      deliveryNotes,
      tableNumber,
      paymentMethod,
    } = req.body;

    // 1. Fetch restaurant settings for delivery fee & status
    const settings = await prisma.restaurantSettings.findUnique({
      where: { id: 'singleton' },
    });

    if (type === 'DELIVERY' && settings && !settings.deliveryEnabled) {
      return res.status(400).json({
        error: {
          code: 'DELIVERY_DISABLED',
          message: 'Delivery service is currently unavailable. Please select Takeaway or Dine-In.',
        },
      });
    }

    // Validate table if DINE_IN and provided
    let finalTableNumber: string | null = null;
    if (type === 'DINE_IN' && tableNumber) {
      finalTableNumber = String(tableNumber).trim();
      const tableRecord = await prisma.restaurantTable.findUnique({
        where: { tableNumber: finalTableNumber },
      });
      if (!tableRecord || !tableRecord.isActive) {
        return res.status(400).json({
          error: {
            code: 'TABLE_INACTIVE',
            message: `Table ${finalTableNumber} is currently not available for dining.`,
          },
        });
      }

      // Enforce single active occupancy: table cannot have another active order
      const activeOrderOnTable = await prisma.order.findFirst({
        where: {
          type: 'DINE_IN',
          tableNumber: finalTableNumber,
          status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
        },
      });

      if (activeOrderOnTable) {
        return res.status(400).json({
          error: {
            code: 'TABLE_OCCUPIED',
            message: `Table ${finalTableNumber} is currently occupied by an active order. Please select another table.`,
          },
        });
      }
    }

    // 2. Fetch all menu items from database with variants and addons to re-price and re-validate
    const itemIds: string[] = incomingItems.map((i: { menuItemId: string }) => i.menuItemId);
    const dbMenuItems = await prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
      include: {
        variants: true,
        addonLinks: {
          include: { addon: true },
        },
      },
    });

    const dbItemMap = new Map(dbMenuItems.map((item: any) => [item.id, item]));

    // Check all items exist and are available
    for (const itemReq of incomingItems) {
      const dbItem: any = dbItemMap.get(itemReq.menuItemId);
      if (!dbItem) {
        return res.status(400).json({
          error: {
            code: 'MENU_ITEM_NOT_FOUND',
            message: `Menu item with ID ${itemReq.menuItemId} was not found.`,
          },
        });
      }

      if (!dbItem.isAvailable) {
        return res.status(400).json({
          error: {
            code: 'ITEM_UNAVAILABLE',
            message: `Item "${dbItem.name}" is currently unavailable/sold out. Please remove it from your cart.`,
          },
        });
      }
    }

    // 3. Compute pricing server-side using current DB prices (never trust client)
    let subtotalDecimal = new Decimal(0);
    const preparedOrderItems: Array<{
      menuItemId: string;
      variantId?: string | null;
      nameAtPurchase: string;
      variantNameAtPurchase?: string | null;
      priceAtPurchase: Decimal;
      addonsSnapshot?: any;
      quantity: number;
    }> = [];

    for (const itemReq of incomingItems) {
      const dbItem: any = dbItemMap.get(itemReq.menuItemId)!;

      // Determine variant pricing & snapshot
      let unitPrice: Decimal;
      let variantName: string | null = null;
      let matchedVariantId: string | null = null;

      if (itemReq.variantId) {
        const matchedVariant = dbItem.variants.find((v: any) => v.id === itemReq.variantId);
        if (!matchedVariant) {
          return res.status(400).json({
            error: {
              code: 'VARIANT_NOT_FOUND',
              message: `Variant with ID ${itemReq.variantId} not found for item "${dbItem.name}".`,
            },
          });
        }
        if (!matchedVariant.isAvailable) {
          return res.status(400).json({
            error: {
              code: 'VARIANT_UNAVAILABLE',
              message: `Variant "${matchedVariant.name}" for "${dbItem.name}" is currently unavailable.`,
            },
          });
        }
        unitPrice = new Decimal(matchedVariant.price);
        variantName = matchedVariant.name;
        matchedVariantId = matchedVariant.id;
      } else if (dbItem.variants && dbItem.variants.length > 0) {
        // Fallback to first available variant if client didn't specify variantId
        const defaultVariant = dbItem.variants.find((v: any) => v.isAvailable) || dbItem.variants[0];
        unitPrice = new Decimal(defaultVariant.price);
        variantName = defaultVariant.name;
        matchedVariantId = defaultVariant.id;
      } else {
        unitPrice = new Decimal(dbItem.price);
      }

      // Addons processing
      let addonsSum = new Decimal(0);
      let addonsSnapshot: Array<{ id: string; name: string; price: number }> | null = null;

      if (itemReq.addonIds && Array.isArray(itemReq.addonIds) && itemReq.addonIds.length > 0) {
        const validAddons = dbItem.addonLinks
          .map((al: { addon: { id: string; name: string; price: unknown; isAvailable: boolean } }) => al.addon)
          .filter((a: { id: string; name: string; price: unknown; isAvailable: boolean }) => itemReq.addonIds.includes(a.id) && a.isAvailable);

        if (validAddons.length > 0) {
          addonsSnapshot = validAddons.map((a: { id: string; name: string; price: unknown; isAvailable: boolean }) => ({
            id: a.id,
            name: a.name,
            price: Number(a.price),
          }));
          for (const a of validAddons as Array<{ id: string; name: string; price: unknown; isAvailable: boolean }>) {
            addonsSum = addonsSum.add(new Decimal(Number(a.price)));
          }
        }
      }

      const totalItemUnitPrice = unitPrice.add(addonsSum);
      const lineTotal = totalItemUnitPrice.mul(itemReq.quantity);
      subtotalDecimal = subtotalDecimal.add(lineTotal);

      preparedOrderItems.push({
        menuItemId: dbItem.id,
        variantId: matchedVariantId,
        nameAtPurchase: dbItem.name,
        variantNameAtPurchase: variantName,
        priceAtPurchase: totalItemUnitPrice,
        addonsSnapshot: addonsSnapshot ? (addonsSnapshot as any) : null,
        quantity: itemReq.quantity,
      });
    }

    const deliveryFeeDecimal =
      type === 'DELIVERY' && settings
        ? new Decimal(Number(settings.deliveryFee))
        : new Decimal(0);

    const totalDecimal = subtotalDecimal.add(deliveryFeeDecimal);
    const orderNumber = await generateOrderNumber();

    // 4. Persist order in a database transaction
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: req.user.userId,
        type,
        status: 'PENDING',
        subtotal: subtotalDecimal,
        deliveryFee: deliveryFeeDecimal,
        total: totalDecimal,
        deliveryAddress: type === 'DELIVERY' ? deliveryAddress : null,
        deliveryNotes: deliveryNotes || null,
        tableNumber: type === 'DINE_IN' ? finalTableNumber : null,
        contactPhone,
        paymentMethod: paymentMethod || 'PAY_AT_RESTAURANT',
        items: {
          create: preparedOrderItems as any,
        },
      },
      include: {
        items: {
          include: {
            menuItem: {
              select: { imageUrl: true },
            },
          },
        },
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    return res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
};

export const getCustomerOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const { page = '1', pageSize = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(pageSize, 10) || 20));
    const skip = (pageNum - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: req.user.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          items: {
            include: {
              menuItem: { select: { imageUrl: true } },
            },
          },
          review: true,
        },
      }),
      prisma.order.count({ where: { customerId: req.user.userId } }),
    ]);

    return res.json({
      orders,
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

export const getOrderById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: { select: { id: true, name: true, imageUrl: true } },
          },
        },
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        review: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found.' } });
    }

    // Server-side ownership re-validation: customer can only view own order, admin can view all
    if (order.customerId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found.' } });
    }

    return res.json({ order });
  } catch (err) {
    next(err);
  }
};

export const getAdminOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      status,
      type,
      search,
      page = '1',
      pageSize = '30',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(pageSize, 10) || 30));
    const skip = (pageNum - 1) * limit;

    const where: any = {};
    if (status) where.status = status as OrderStatus;
    if (type) where.type = type;
    if (search && search.trim()) {
      where.OR = [
        { orderNumber: { contains: search.trim(), mode: 'insensitive' } },
        { customer: { name: { contains: search.trim(), mode: 'insensitive' } } },
        { contactPhone: { contains: search.trim() } },
        { tableNumber: { contains: search.trim() } },
      ];
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          items: true,
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
          review: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return res.json({
      orders,
      total: totalCount,
      pages: totalPages,
      pagination: {
        page: pageNum,
        pageSize: limit,
        totalCount,
        totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status: nextStatus } = req.body as { status: OrderStatus };

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found.' } });
    }

    // Server-side state machine transition enforcement
    if (!isValidStatusTransition(order.status as OrderStatus, nextStatus)) {
      const allowed = ALLOWED_STATUS_TRANSITIONS[order.status as OrderStatus] || [];
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Cannot transition order status from '${order.status}' to '${nextStatus}'. Allowed transitions: ${
            allowed.length > 0 ? allowed.join(', ') : 'None (Terminal state)'
          }`,
        },
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: nextStatus },
      include: {
        items: true,
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    return res.json({ order: updatedOrder });
  } catch (err) {
    next(err);
  }
};
