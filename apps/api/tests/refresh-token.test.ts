import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';
import { hashToken } from '../src/services/token.service';

describe('Refresh Token Rotation and Revocation', () => {
  const testUser = {
    email: 'tokenuser@example.com',
    password: 'SecurePassword123!',
    name: 'Token User',
  };

  it('creates a RefreshToken record in DB and sets cookie on registration', async () => {
    // Clean up before test
    await prisma.user.deleteMany({ where: { email: testUser.email } });

    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();

    // Check cookie
    const cookies = res.headers['set-cookie'] || [];
    const refreshCookie = cookies.find((c: string) => c.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('HttpOnly');

    // Extract token string
    const match = refreshCookie.match(/refreshToken=([^;]+)/);
    const rawToken = match ? match[1] : '';
    expect(rawToken).toBeTruthy();

    // Verify record in RefreshToken table
    const tokenHash = hashToken(rawToken);
    const dbRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    expect(dbRecord).toBeDefined();
    expect(dbRecord?.userId).toBe(res.body.user.id);
    expect(dbRecord?.revokedAt).toBeNull();
  });

  it('rotates refresh token on /api/auth/refresh and reloads role from DB', async () => {
    // 1. Log in
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(loginRes.status).toBe(200);
    const loginCookies = loginRes.headers['set-cookie'] || [];
    const firstCookie = loginCookies.find((c: string) => c.startsWith('refreshToken='));
    const firstToken = firstCookie.match(/refreshToken=([^;]+)/)[1];

    // Simulate role promotion in DB directly to verify role reloading
    await prisma.user.update({
      where: { email: testUser.email },
      data: { role: 'ADMIN' },
    });

    // 2. Call /api/auth/refresh with first cookie
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${firstToken}`);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toBeDefined();
    expect(refreshRes.body.user.role).toBe('ADMIN'); // Verified: role reloaded from DB!

    // 3. Verify old token is marked revoked and replaced
    const firstHash = hashToken(firstToken);
    const oldRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash: firstHash },
    });
    expect(oldRecord?.revokedAt).not.toBeNull();
    expect(oldRecord?.replacedById).not.toBeNull();

    // 4. Verify new token exists and is active
    const newCookies = refreshRes.headers['set-cookie'] || [];
    const secondCookie = newCookies.find((c: string) => c.startsWith('refreshToken='));
    const secondToken = secondCookie.match(/refreshToken=([^;]+)/)[1];
    expect(secondToken).not.toBe(firstToken);

    const secondHash = hashToken(secondToken);
    const newRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash: secondHash },
    });
    expect(newRecord?.revokedAt).toBeNull();
    expect(oldRecord?.replacedById).toBe(newRecord?.id);

    // Reset role back to CUSTOMER
    await prisma.user.update({
      where: { email: testUser.email },
      data: { role: 'CUSTOMER' },
    });
  });

  it('revokes ALL user tokens when a revoked token is reused (Reuse Detection)', async () => {
    // 1. Log in to get an initial token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    const initialCookie = (loginRes.headers['set-cookie'] || []).find((c: string) =>
      c.startsWith('refreshToken=')
    );
    const initialToken = initialCookie.match(/refreshToken=([^;]+)/)[1];

    // 2. Refresh it once (initialToken becomes revoked, rotatedToken is now active)
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${initialToken}`);
    expect(refreshRes.status).toBe(200);
    const rotatedCookie = (refreshRes.headers['set-cookie'] || []).find((c: string) =>
      c.startsWith('refreshToken=')
    );
    const rotatedToken = rotatedCookie.match(/refreshToken=([^;]+)/)[1];

    // Verify rotatedToken is currently active
    const rotatedHash = hashToken(rotatedToken);
    let activeRecord = await prisma.refreshToken.findUnique({ where: { tokenHash: rotatedHash } });
    expect(activeRecord?.revokedAt).toBeNull();

    // 3. ATTEMPT REUSE: Call /refresh with the already-revoked initialToken
    const reuseRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${initialToken}`);

    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.error.code).toBe('TOKEN_REVOKED');

    // 4. Verify that ALL active tokens for this user were revoked!
    activeRecord = await prisma.refreshToken.findUnique({ where: { tokenHash: rotatedHash } });
    expect(activeRecord?.revokedAt).not.toBeNull();
  });

  it('revokes current refresh token on /api/auth/logout', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    const cookie = (loginRes.headers['set-cookie'] || []).find((c: string) =>
      c.startsWith('refreshToken=')
    );
    const token = cookie.match(/refreshToken=([^;]+)/)[1];

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', `refreshToken=${token}`);

    expect(logoutRes.status).toBe(200);

    // Verify token is revoked in DB
    const tokenHash = hashToken(token);
    const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    expect(record?.revokedAt).not.toBeNull();
  });

  it('revokes all refresh tokens when user changes password', async () => {
    // 1. Log in to get session
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    const token = loginRes.body.accessToken;
    const cookie = (loginRes.headers['set-cookie'] || []).find((c: string) =>
      c.startsWith('refreshToken=')
    );
    const refreshToken = cookie.match(/refreshToken=([^;]+)/)[1];

    // 2. Change password via PUT /api/auth/password
    const newPassword = 'BrandNewPassword999!';
    const changeRes = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: testUser.password,
        newPassword,
      });

    expect(changeRes.status).toBe(200);

    // 3. Verify previous refresh token is revoked
    const tokenHash = hashToken(refreshToken);
    const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    expect(record?.revokedAt).not.toBeNull();

    // 4. Attempting to refresh with old cookie should fail
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${refreshToken}`);
    expect(refreshRes.status).toBe(401);

    // Update password in testUser for any future tests
    testUser.password = newPassword;
  });
});
