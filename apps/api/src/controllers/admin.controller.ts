import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const getAdminCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, page = '1', pageSize = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(pageSize, 10) || 20));
    const skip = (pageNum - 1) * limit;

    const where: any = { role: 'CUSTOMER' };
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { phone: { contains: search.trim() } },
      ];
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          orders: {
            where: { status: 'COMPLETED' },
            select: { total: true },
          },
          _count: {
            select: {
              orders: true,
              reservations: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const customers = users.map((u) => {
      const lifetimeSpend = u.orders.reduce((sum, o) => sum + Number(o.total), 0);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        createdAt: u.createdAt,
        totalOrders: u._count.orders,
        totalReservations: u._count.reservations,
        lifetimeSpend: parseFloat(lifetimeSpend.toFixed(2)),
      };
    });

    return res.json({
      customers,
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

export const getAdminCustomerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
          },
        },
        reservations: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Customer not found.' } });
    }

    const lifetimeSpend = user.orders
      .filter((o) => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + Number(o.total), 0);

    return res.json({
      customer: {
        ...user,
        lifetimeSpend: parseFloat(lifetimeSpend.toFixed(2)),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getAnalyticsOverview = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      todayOrders,
      todayRevenueRaw,
      pendingOrdersCount,
      activeReservationsCount,
      totalCustomersCount,
      recentOrders,
      recentReservations,
      popularDishesRaw,
    ] = await Promise.all([
      // 1. Today's orders count
      prisma.order.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      // 2. Today's revenue
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfToday },
          status: { not: 'CANCELLED' },
        },
        _sum: { total: true },
      }),
      // 3. Pending orders
      prisma.order.count({
        where: { status: 'PENDING' },
      }),
      // 4. Active reservations (today onwards and pending/confirmed)
      prisma.reservation.count({
        where: {
          date: { gte: startOfToday },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      }),
      // 5. Total customers
      prisma.user.count({
        where: { role: 'CUSTOMER' },
      }),
      // 6. Recent orders
      prisma.order.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
          items: true,
        },
      }),
      // 7. Recent reservations
      prisma.reservation.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          customer: { select: { name: true, phone: true } },
        },
      }),
      // 8. Popular dishes
      prisma.orderItem.groupBy({
        by: ['menuItemId', 'nameAtPurchase'],
        _sum: { quantity: true },
        orderBy: {
          _sum: { quantity: 'desc' },
        },
        take: 5,
      }),
    ]);

    const todayRevenue = todayRevenueRaw._sum.total ? Number(todayRevenueRaw._sum.total) : 0;

    return res.json({
      stats: {
        todayOrders,
        todayRevenue: parseFloat(todayRevenue.toFixed(2)),
        pendingOrdersCount,
        activeReservationsCount,
        totalCustomersCount,
      },
      recentOrders,
      recentReservations,
      popularDishes: popularDishesRaw.map((p) => ({
        menuItemId: p.menuItemId,
        name: p.nameAtPurchase,
        totalQuantity: p._sum.quantity || 0,
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const getAnalyticsRevenue = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: fourteenDaysAgo },
      },
      select: {
        createdAt: true,
        total: true,
        status: true,
        type: true,
      },
    });

    // Aggregate by day
    const dayMap = new Map<string, { date: string; label: string; orders: number; revenue: number }>();

    for (let i = 0; i < 14; i++) {
      const d = new Date(fourteenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dayMap.set(key, { date: key, label, orders: 0, revenue: 0 });
    }

    const typeBreakdown = {
      DINE_IN: 0,
      TAKEAWAY: 0,
      DELIVERY: 0,
    };

    for (const order of orders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      const dayData = dayMap.get(key);
      if (dayData) {
        dayData.orders += 1;
        if (order.status !== 'CANCELLED') {
          dayData.revenue += Number(order.total);
        }
      }

      if (typeBreakdown[order.type] !== undefined) {
        typeBreakdown[order.type] += 1;
      }
    }

    const dailyTrends = Array.from(dayMap.values()).map((d) => ({
      ...d,
      revenue: parseFloat(d.revenue.toFixed(2)),
    }));

    return res.json({
      dailyTrends,
      ordersByType: [
        { name: 'Dine-In', value: typeBreakdown.DINE_IN },
        { name: 'Takeaway', value: typeBreakdown.TAKEAWAY },
        { name: 'Delivery', value: typeBreakdown.DELIVERY },
      ],
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminDashboard = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      todayRevenueRaw,
      totalOrders,
      activeOrders,
      pendingReservations,
      totalCustomers,
      avgRatingRaw,
      recentOrders,
      recentReservations,
      pastWeekOrders,
    ] = await Promise.all([
      // 1. Today's revenue
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfToday },
          status: { not: 'CANCELLED' },
        },
        _sum: { total: true },
      }),
      // 2. Total orders all time
      prisma.order.count(),
      // 3. Active orders
      prisma.order.count({
        where: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] } },
      }),
      // 4. Pending reservations
      prisma.reservation.count({
        where: { status: 'PENDING' },
      }),
      // 5. Total customers
      prisma.user.count({
        where: { role: 'CUSTOMER' },
      }),
      // 6. Average rating and review count
      prisma.review.aggregate({
        where: { isHidden: false },
        _avg: { rating: true },
        _count: { id: true },
      }),
      // 7. Recent orders
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
          items: true,
        },
      }),
      // 8. Recent reservations
      prisma.reservation.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true, phone: true } },
        },
      }),
      // 9. Past 7 days orders for chart
      prisma.order.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, total: true, status: true },
      }),
    ]);

    const todayRevenue = todayRevenueRaw._sum.total ? Number(todayRevenueRaw._sum.total) : 0;
    const reviewCount = avgRatingRaw._count.id || 0;
    const avgRating = reviewCount > 0 && avgRatingRaw._avg.rating ? Number(avgRatingRaw._avg.rating) : 0;

    // Build 7-day revenue array
    const dayMap = new Map<string, { date: string; revenue: number; orders: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' });
      dayMap.set(key, { date: label, revenue: 0, orders: 0 });
    }

    for (const order of pastWeekOrders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      const dayData = dayMap.get(key);
      if (dayData) {
        dayData.orders += 1;
        if (order.status !== 'CANCELLED') {
          dayData.revenue += Number(order.total);
        }
      }
    }

    const revenueByDay = Array.from(dayMap.values()).map((d) => ({
      ...d,
      revenue: parseFloat(d.revenue.toFixed(2)),
    }));

    return res.json({
      todayRevenue: parseFloat(todayRevenue.toFixed(2)),
      totalOrders,
      activeOrders,
      pendingReservations,
      totalCustomers,
      reviewCount,
      avgRating: parseFloat(avgRating.toFixed(1)),
      revenueByDay,
      recentOrders,
      recentReservations,
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, role, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * pageSize;

    const where: any = {};
    if (role && (role === 'ADMIN' || role === 'CUSTOMER')) {
      where.role = role;
    }

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { phone: { contains: search.trim() } },
      ];
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return res.json({
      users,
      total: totalCount,
      pages: totalPages,
      pagination: {
        page: pageNum,
        pageSize,
        totalCount,
        totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
};
