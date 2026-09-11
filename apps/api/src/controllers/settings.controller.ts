import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const getSettings = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await prisma.restaurantSettings.findUnique({
      where: { id: 'singleton' },
      include: {
        signatureMenuItem: {
          include: {
            variants: { orderBy: { sortOrder: 'asc' } },
            category: true,
          },
        },
      },
    });

    if (!settings) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Restaurant settings not found.' } });
    }

    // If signature menu item was deleted, treat as null
    if (settings.signatureMenuItem && settings.signatureMenuItem.deletedAt) {
      settings.signatureMenuItem = null;
    }

    return res.json({ settings });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.restaurantSettings.findUnique({ where: { id: 'singleton' } });
    if (existing) {
      const settings = await prisma.restaurantSettings.update({
        where: { id: 'singleton' },
        data: req.body,
        include: {
          signatureMenuItem: {
            include: {
              variants: { orderBy: { sortOrder: 'asc' } },
              category: true,
            },
          },
        },
      });

      if (settings.signatureMenuItem && settings.signatureMenuItem.deletedAt) {
        settings.signatureMenuItem = null;
      }

      return res.json({ settings });
    }

    const standardHours = {
      monday: { open: '09:00', close: '12:00', closed: false },
      tuesday: { open: '09:00', close: '12:00', closed: false },
      wednesday: { open: '09:00', close: '12:00', closed: false },
      thursday: { open: '09:00', close: '12:00', closed: false },
      friday: { open: '09:00', close: '12:00', closed: false },
      saturday: { open: '09:00', close: '12:00', closed: false },
      sunday: { open: '09:00', close: '12:00', closed: false },
    };

    const settings = await prisma.restaurantSettings.create({
      data: {
        id: 'singleton',
        name: 'Euroshub Kitchen',
        headline: 'Fresh, Hot & Fast in Rawalpindi',
        subtitle: 'Crispy burgers, loaded pizzas, and artisanal sandwiches prepared daily at Kohistan Tower, Saddar.',
        description:
          'Euroshub Kitchen brings quality fast-food dining and takeaway to Saddar, Rawalpindi. Handcrafted pizzas, gourmet burgers, and fresh sides crafted with high-standard ingredients.',
        phone: '+92 xxx xxx xxx (Needs Admin Input)',
        email: 'haider1.euroshub@gmail.com',
        address: 'Kohistan Tower, Saddar, Rawalpindi, Office 609',
        openingHours: standardHours,
        deliveryEnabled: false,
        deliveryFee: 0,
        tableCount: 100,
        currency: 'PKR',
        timezone: 'Asia/Karachi',
        footerText: '© Euroshub Kitchen. Fresh Pakistani Fast-Food. Kohistan Tower, Saddar, Rawalpindi.',
        ...req.body,
      },
    });

    return res.json({ settings });
  } catch (err) {
    next(err);
  }
};
