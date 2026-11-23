import { describe, it, expect } from 'vitest';
import { validateConfig } from '../src/config';

describe('Config Startup Validation', () => {
  it('allows development mode without Supabase', () => {
    const validDev = validateConfig({
      NODE_ENV: 'development',
      PORT: '5000',
      DATABASE_URL: 'postgresql://localhost:5432/test',
      JWT_ACCESS_SECRET: 'dev-secret-key-at-least-some-chars',
      JWT_REFRESH_SECRET: 'dev-refresh-key-at-least-some-chars',
    });
    expect(validDev.NODE_ENV).toBe('development');
    expect(validDev.SUPABASE_URL).toBeUndefined();
  });

  it('fails in production if JWT_ACCESS_SECRET is missing', () => {
    expect(() =>
      validateConfig({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://remote:5432/prod',
        JWT_REFRESH_SECRET: 'a'.repeat(32),
      })
    ).toThrow(/JWT_ACCESS_SECRET is required/);
  });

  it('fails in production if JWT_ACCESS_SECRET is shorter than 32 characters', () => {
    expect(() =>
      validateConfig({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://remote:5432/prod',
        JWT_ACCESS_SECRET: 'short-secret',
        JWT_REFRESH_SECRET: 'a'.repeat(32),
      })
    ).toThrow(/at least 32 characters/);
  });

  it('fails in production if JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are identical', () => {
    const identicalSecret = 'a'.repeat(35);
    expect(() =>
      validateConfig({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://remote:5432/prod',
        JWT_ACCESS_SECRET: identicalSecret,
        JWT_REFRESH_SECRET: identicalSecret,
      })
    ).toThrow(/must be different/);
  });

  it('fails in production if DATABASE_URL is missing', () => {
    expect(() =>
      validateConfig({
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'a'.repeat(35),
        JWT_REFRESH_SECRET: 'b'.repeat(35),
      })
    ).toThrow(/DATABASE_URL is required/);
  });

  it('succeeds in production when all secrets are valid and distinct', () => {
    const result = validateConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://remote:5432/prod',
      JWT_ACCESS_SECRET: 'a'.repeat(35),
      JWT_REFRESH_SECRET: 'b'.repeat(35),
    });
    expect(result.NODE_ENV).toBe('production');
    expect(result.JWT_ACCESS_SECRET).toBe('a'.repeat(35));
    expect(result.JWT_REFRESH_SECRET).toBe('b'.repeat(35));
  });
});
