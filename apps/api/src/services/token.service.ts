import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { prisma } from '../prisma';
import { config } from '../config';
import { JwtPayload } from '../types';

/**
 * Computes SHA-256 hash of a raw token for secure database storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Determines cookie SameSite policy.
 * 
 * Why SameSite=lax when cross-site:
 * When the frontend is deployed on a separate domain (e.g. euroshub-web.vercel.app)
 * and the API is deployed on another (e.g. euroshub-api.onrender.com), browsers treat
 * cross-origin fetch requests as cross-site. Under SameSite=strict, cookies are stripped
 * on cross-site requests, causing authentication and token refresh to fail.
 * SameSite=strict is used when the frontend and API share the same site/domain.
 */
export function getCookieSameSite(): 'strict' | 'lax' {
  if (process.env.COOKIE_SAMESITE === 'strict') return 'strict';
  if (process.env.COOKIE_SAMESITE === 'lax') return 'lax';

  try {
    const frontendHost = new URL(config.frontendUrl).hostname;
    // Local development shares 'localhost'
    if (frontendHost === 'localhost' || frontendHost === '127.0.0.1') {
      return 'strict';
    }

    // In production, check if frontend and API share the same second-level domain
    const frontendParts = frontendHost.split('.');
    const frontendDomain = frontendParts.slice(-2).join('.');

    // Check against configured CORS origins
    if (config.corsOrigins.length > 0) {
      const anyCrossSite = config.corsOrigins.some((origin) => {
        try {
          const h = new URL(origin).hostname;
          const hDomain = h.split('.').slice(-2).join('.');
          return hDomain !== frontendDomain;
        } catch {
          return false;
        }
      });

      if (anyCrossSite) {
        return 'lax';
      }
    }

    return 'strict';
  } catch {
    return 'lax';
  }
}

/**
 * Creates and persists a new refresh token in the database.
 */
export async function createAndSaveRefreshToken(userId: string, payload: JwtPayload) {
  const token = jwt.sign(
    { ...payload, jti: crypto.randomUUID() },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiresIn as any,
    }
  );

  const tokenHash = hashToken(token);
  // Default to 7 days expiration
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const record = await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return { token, record };
}

/**
 * Sets the httpOnly refresh token cookie on the response.
 */
export function setRefreshTokenCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: getCookieSameSite(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

/**
 * Clears the refresh token cookie.
 */
export function clearRefreshTokenCookie(res: Response) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: getCookieSameSite(),
    path: '/',
  });
}
