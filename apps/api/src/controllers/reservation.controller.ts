import { Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { AuthRequest, ReservationStatus } from '../types';
import { validateReservationTimeAndCapacity } from '../services/reservation.service';

export const createReservation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const { date, partySize, notes } = req.body;
    const reservationDate = new Date(date);

    // Validate opening hours and capacity
    const validation = await validateReservationTimeAndCapacity(reservationDate, partySize);
    if (!validation.valid) {
      const statusCode = (validation as any).isOutsideHours ? 422 : 400;
      const code = (validation as any).isOutsideHours ? 'OUTSIDE_OPENING_HOURS' : 'INVALID_RESERVATION';
      return res.status(statusCode).json({
        error: {
          code,
          message: validation.message,
        },
      });
    }

    const reservation = await prisma.reservation.create({
      data: {
        customerId: req.user.userId,
        date: reservationDate,
        partySize,
        notes: notes || null,
        status: 'PENDING',
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    return res.status(201).json({ reservation });
  } catch (err) {
    next(err);
  }
};

export const getCustomerReservations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const reservations = await prisma.reservation.findMany({
      where: { customerId: req.user.userId },
      orderBy: { date: 'desc' },
    });

    return res.json({ reservations });
  } catch (err) {
    next(err);
  }
};

export const getAdminReservations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', pageSize = '30' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(pageSize, 10) || 30));
    const skip = (pageNum - 1) * limit;

    const where: any = {};
    if (status) where.status = status as ReservationStatus;

    const [reservations, totalCount] = await Promise.all([
      prisma.reservation.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      }),
      prisma.reservation.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return res.json({
      reservations,
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

export const updateReservationStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: ReservationStatus };

    const existing = await prisma.reservation.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Reservation not found.' } });
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    return res.json({ reservation: updated });
  } catch (err) {
    next(err);
  }
};
