import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const getActiveTables = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tables = await prisma.restaurantTable.findMany({
      where: { isActive: true },
      orderBy: { tableNumber: 'asc' },
    });
    return res.json({ tables });
  } catch (err) {
    next(err);
  }
};

export const getAdminTables = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tables = await prisma.restaurantTable.findMany({
      orderBy: { tableNumber: 'asc' },
    });
    return res.json({ tables });
  } catch (err) {
    next(err);
  }
};

export const updateTable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isActive, capacity, tableNumber } = req.body;

    const updated = await prisma.restaurantTable.update({
      where: { id },
      data: {
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
        ...(capacity !== undefined ? { capacity: Number(capacity) } : {}),
        ...(tableNumber ? { tableNumber: String(tableNumber).trim() } : {}),
      },
    });

    return res.json({ table: updated });
  } catch (err) {
    next(err);
  }
};

export const createTable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tableNumber, capacity, isActive } = req.body;
    if (!tableNumber) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Table number is required.' } });
    }

    const table = await prisma.restaurantTable.create({
      data: {
        tableNumber: String(tableNumber).trim(),
        capacity: capacity ? Number(capacity) : 4,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return res.status(201).json({ table });
  } catch (err) {
    next(err);
  }
};
