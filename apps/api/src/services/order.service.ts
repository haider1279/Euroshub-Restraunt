import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { OrderStatus } from '../types';

export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [], // terminal
  CANCELLED: [], // terminal
};

export const isValidStatusTransition = (current: OrderStatus, next: OrderStatus): boolean => {
  const allowed = ALLOWED_STATUS_TRANSITIONS[current] || [];
  return allowed.includes(next);
};

export const generateOrderNumber = async (): Promise<string> => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Count orders placed today
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const countToday = await prisma.order.count({
    where: {
      createdAt: {
        gte: startOfDay,
      },
    },
  });

  const sequence = String(countToday + 1).padStart(4, '0');
  return `EK-${dateStr}-${sequence}`;
};
