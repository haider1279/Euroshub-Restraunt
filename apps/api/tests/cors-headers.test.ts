import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('CORS and Security Headers', () => {
  it('includes security headers from helmet', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('allows request from allowed origin (http://localhost:5173)', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('blocks disallowed origin and arbitrary .vercel.app origin', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://malicious-site.vercel.app');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejects JSON bodies exceeding 1mb limit with 413', async () => {
    // Generate a payload slightly larger than 1MB (1,050,000 bytes)
    const largePayload = { data: 'a'.repeat(1024 * 1024 + 100) };
    const res = await request(app)
      .post('/api/auth/login')
      .send(largePayload);
    expect(res.status).toBe(413);
  });
});
