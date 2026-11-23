import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { verifyImageSignature } from '../src/controllers/upload.controller';
import { config } from '../src/config';

describe('Image Upload Verification and Storage', () => {
  let adminToken: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@euroshubkitchen.com', password: 'AdminPassword123!' });
    adminToken = res.body.accessToken;
  });

  describe('verifyImageSignature unit tests', () => {
    it('detects genuine JPEG signature (FF D8 FF)', () => {
      const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      expect(verifyImageSignature(jpeg)).toBe('jpeg');
    });

    it('detects genuine PNG signature (89 50 4E 47 0D 0A 1A 0A)', () => {
      const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      expect(verifyImageSignature(png)).toBe('png');
    });

    it('detects genuine WebP signature (RIFF....WEBP)', () => {
      const webp = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x20, 0x00, 0x00, 0x00, // length
        0x57, 0x45, 0x42, 0x50, // WEBP
      ]);
      expect(verifyImageSignature(webp)).toBe('webp');
    });

    it('rejects malicious or invalid signature (e.g. text/html/executable)', () => {
      const malicious = Buffer.from('<!DOCTYPE html><html><body><script>alert(1)</script></body></html>');
      expect(verifyImageSignature(malicious)).toBeNull();
    });
  });

  describe('POST /api/upload endpoint integration', () => {
    it('accepts genuine PNG upload in development and saves to disk', async () => {
      const validPng = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      ]);

      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', validPng, 'test-item.png');

      expect(res.status).toBe(201);
      expect(res.body.url).toMatch(/^\/uploads\/item-.*\.png$/);
    });

    it('rejects file disguised as image with forged mimetype (invalid signature)', async () => {
      const fakeImage = Buffer.from('This is a plain text file disguised as a JPEG');

      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', fakeImage, { filename: 'malicious.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_FILE_SIGNATURE');
      expect(res.body.error.message).toContain('Only genuine JPEG, PNG, and WebP');
    });

    it('in production requires Supabase Storage', async () => {
      // Temporarily simulate production environment with missing Supabase configuration
      const originalNodeEnv = config.nodeEnv;
      const originalSupabaseUrl = config.supabase.url;
      const originalSupabaseKey = config.supabase.serviceRoleKey;

      (config as any).nodeEnv = 'production';
      (config as any).supabase.url = '';
      (config as any).supabase.serviceRoleKey = '';

      const validPng = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      ]);

      try {
        const res = await request(app)
          .post('/api/upload')
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('image', validPng, 'test-prod.png');

        expect(res.status).toBe(500);
        expect(res.body.error.code).toBe('STORAGE_CONFIGURATION_ERROR');
        expect(res.body.error.message).toContain('Supabase Storage is required in production');
      } finally {
        (config as any).nodeEnv = originalNodeEnv;
        (config as any).supabase.url = originalSupabaseUrl;
        (config as any).supabase.serviceRoleKey = originalSupabaseKey;
      }
    });
  });
});
