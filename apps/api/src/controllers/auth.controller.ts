import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { config } from '../config';
import { AuthRequest, JwtPayload } from '../types';
import {
  hashToken,
  createAndSaveRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from '../services/token.service';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, phone } = req.body;

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return res.status(409).json({
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email address already exists.',
        },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        phone: phone || null,
        role: 'CUSTOMER', // Default is always CUSTOMER, never client-driven
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn as any,
    });

    const { token: refreshToken } = await createAndSaveRefreshToken(user.id, payload);
    setRefreshTokenCookie(res, refreshToken);

    return res.status(201).json({
      user,
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn as any,
    });

    const { token: refreshToken } = await createAndSaveRefreshToken(user.id, payload);
    setRefreshTokenCookie(res, refreshToken);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: 'Refresh token is missing. Please log in again.',
        },
      });
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
    } catch {
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token is invalid or expired.',
        },
      });
    }

    // Look up token hash in RefreshToken table
    const tokenHash = hashToken(token);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token is unrecognized or untracked.',
        },
      });
    }

    // Check if token was revoked (Reuse Detection)
    if (storedToken.revokedAt) {
      // SECURITY: Token reuse detected! Revoke all active tokens for this user
      await prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        error: {
          code: 'TOKEN_REVOKED',
          message: 'Refresh token has been revoked. All active sessions have been terminated for security.',
        },
      });
    }

    // Check expiration
    if (storedToken.expiresAt < new Date()) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Refresh token has expired. Please log in again.',
        },
      });
    }

    // Reload the user's role and data from the database
    const user = await prisma.user.findUnique({
      where: { id: storedToken.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User no longer exists.',
        },
      });
    }

    // Rotate: Issue new refresh token
    const newPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role, // role reloaded fresh from DB
    };

    const { token: newRefreshToken, record: newRecord } = await createAndSaveRefreshToken(
      user.id,
      newPayload
    );

    // Revoke old token and link to replacement
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        revokedAt: new Date(),
        replacedById: newRecord.id,
      },
    });

    // Sign new access token using reloaded role
    const newAccessToken = jwt.sign(newPayload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn as any,
    });

    setRefreshTokenCookie(res, newRefreshToken);

    return res.json({
      accessToken: newAccessToken,
      user,
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const tokenHash = hashToken(token);
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  } catch (err) {
    console.error('Error revoking token on logout:', err);
  } finally {
    clearRefreshTokenCookie(res);
  }
  return res.json({ message: 'Logged out successfully.' });
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    return res.json({ user });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const { name, phone, currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone || null;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          error: {
            code: 'CURRENT_PASSWORD_REQUIRED',
            message: 'Current password is required to set a new password.',
          },
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({
          error: {
            code: 'INVALID_CURRENT_PASSWORD',
            message: 'Current password is incorrect.',
          },
        });
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 10);

      // Changing password revokes all refresh tokens
      await prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      clearRefreshTokenCookie(res);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({ user: updatedUser });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        error: {
          code: 'INVALID_CURRENT_PASSWORD',
          message: 'Current password is incorrect.',
        },
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Revoke all refresh tokens for this user
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    clearRefreshTokenCookie(res);

    return res.json({ message: 'Password updated successfully. All other sessions have been signed out.' });
  } catch (err) {
    next(err);
  }
};
