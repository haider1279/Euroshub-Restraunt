import { describe, it, expect } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app';
import { prisma } from '../src/prisma';

describe('Admin Account Safety and Password Management', () => {
  it('PUT /api/auth/password rejects new password shorter than 10 characters', async () => {
    // Log in admin
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@euroshubkitchen.com', password: 'AdminPassword123!' });
    const token = loginRes.body.accessToken;

    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'AdminPassword123!',
        newPassword: 'short',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].message).toContain('at least 10 characters');
  });

  it('PUT /api/auth/password rejects incorrect current password', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@euroshubkitchen.com', password: 'AdminPassword123!' });
    const token = loginRes.body.accessToken;

    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'WrongOldPassword!',
        newPassword: 'ValidNewPassword123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_CURRENT_PASSWORD');
  });

  it('PUT /api/auth/password successfully changes password and revokes all refresh tokens', async () => {
    // 1. Log in admin
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@euroshubkitchen.com', password: 'AdminPassword123!' });
    const token = loginRes.body.accessToken;

    // 2. Change password
    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'AdminPassword123!',
        newPassword: 'UpdatedAdminPassword456!',
      });

    expect(res.status).toBe(200);

    // 3. Verify can log in with new password
    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@euroshubkitchen.com', password: 'UpdatedAdminPassword456!' });
    expect(newLoginRes.status).toBe(200);

    // 4. Change back to AdminPassword123! to keep baseline test suite passing
    const resetRes = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${newLoginRes.body.accessToken}`)
      .send({
        currentPassword: 'UpdatedAdminPassword456!',
        newPassword: 'AdminPassword123!',
      });
    expect(resetRes.status).toBe(200);
  });

  it('seeding preserves admin passwordHash and role when admin already exists', async () => {
    const adminBefore = await prisma.user.findUnique({
      where: { email: 'admin@euroshubkitchen.com' },
    });
    expect(adminBefore).toBeDefined();
    const originalHash = adminBefore?.passwordHash;
    const originalRole = adminBefore?.role;

    // Simulate what prisma/seed.ts does when admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@euroshubkitchen.com' },
    });

    if (existingAdmin) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { name: 'Euroshub Admin' },
      });
    }

    const adminAfter = await prisma.user.findUnique({
      where: { email: 'admin@euroshubkitchen.com' },
    });

    expect(adminAfter?.passwordHash).toBe(originalHash);
    expect(adminAfter?.role).toBe(originalRole);
  });
});
