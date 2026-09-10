import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../types';
import { validateReviewEligibility } from '../services/review.service';

export const getPublicReviews = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { isHidden: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        customer: {
          select: { name: true },
        },
      },
    });

    return res.json({ reviews });
  } catch (err) {
    next(err);
  }
};

export const createReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const { orderId, rating, comment } = req.body;

    const eligibility = await validateReviewEligibility(orderId, req.user.userId);
    if (!eligibility.eligible) {
      return res.status(eligibility.statusCode!).json({
        error: {
          code: 'REVIEW_NOT_PERMITTED',
          message: eligibility.message,
        },
      });
    }

    const review = await prisma.review.create({
      data: {
        customerId: req.user.userId,
        orderId,
        rating,
        comment,
      },
      include: {
        customer: { select: { name: true } },
      },
    });

    return res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
};

export const getCustomerReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const reviews = await prisma.review.findMany({
      where: { customerId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: { orderNumber: true, createdAt: true },
        },
      },
    });

    return res.json({ reviews });
  } catch (err) {
    next(err);
  }
};

export const getAdminReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '15', showHidden } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * pageSize;

    const where: any = {};
    if (showHidden === 'false') {
      where.isHidden = false;
    }

    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          customer: {
            select: { id: true, name: true, email: true },
          },
          order: {
            select: { id: true, orderNumber: true },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return res.json({
      reviews,
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

export const updateReviewStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isHidden } = req.body;

    const review = await prisma.review.update({
      where: { id },
      data: { isHidden },
    });

    return res.json({ review });
  } catch (err) {
    next(err);
  }
};
