import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const getActiveSocialLinks = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const links = await prisma.socialLink.findMany({
      where: {
        isActive: true,
        url: { not: '' },
      },
    });
    return res.json({ socialLinks: links });
  } catch (err) {
    next(err);
  }
};

export const getAdminSocialLinks = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const links = await prisma.socialLink.findMany({
      orderBy: { platform: 'asc' },
    });
    return res.json({ socialLinks: links });
  } catch (err) {
    next(err);
  }
};

export const updateSocialLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { url, isActive } = req.body;

    const link = await prisma.socialLink.update({
      where: { id },
      data: {
        ...(url !== undefined ? { url: String(url).trim() } : {}),
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
      },
    });

    return res.json({ socialLink: link });
  } catch (err) {
    next(err);
  }
};

export const createSocialLink = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { platform, url, isActive } = req.body;
    if (!platform) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Platform name is required.' } });
    }

    const link = await prisma.socialLink.upsert({
      where: { platform: String(platform).toUpperCase().trim() },
      update: {
        url: url ? String(url).trim() : '',
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      create: {
        platform: String(platform).toUpperCase().trim(),
        url: url ? String(url).trim() : '',
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return res.status(201).json({ socialLink: link });
  } catch (err) {
    next(err);
  }
};
