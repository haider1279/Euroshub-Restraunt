import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';
import { checkRestaurantStatus, parseShift } from '../src/services/hours.service';

describe('Opening Hours and Midnight Rollover Validation', () => {
  let customerToken: string;
  let menuItemId: string;

  beforeAll(async () => {
    // Authenticate test customer
    let custRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testcust1@euroshubkitchen.com', password: 'Customer123!' });
    if (custRes.status !== 200) {
      custRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testcust1@euroshubkitchen.com',
          password: 'Customer123!',
          name: 'Test Customer One',
        });
    }
    customerToken = custRes.body.accessToken;

    const item = await prisma.menuItem.findFirst({ where: { isAvailable: true } });
    menuItemId = item!.id;
  });

  describe('Shift parsing and midnight edge calculations', () => {
    it('parses standard shift ending at 00:00 (midnight) as 1440 minutes', () => {
      const shift = parseShift('09:00', '00:00');
      expect(shift.openMinutes).toBe(540); // 9 * 60
      expect(shift.closeMinutes).toBe(1440); // 24 * 60 (midnight end of day)
    });

    it('parses overnight shift ending after midnight (e.g. 02:00 AM) as rolling into next day', () => {
      const shift = parseShift('09:00', '02:00');
      expect(shift.openMinutes).toBe(540);
      expect(shift.closeMinutes).toBe(1560); // 24 * 60 + 120
    });
  });

  describe('checkRestaurantStatus unit edge cases', () => {
    const standardSchedule = {
      monday: { open: '09:00', close: '00:00', closed: false },
      tuesday: { open: '09:00', close: '00:00', closed: false },
      wednesday: { open: '09:00', close: '00:00', closed: false },
      thursday: { open: '09:00', close: '00:00', closed: false },
      friday: { open: '09:00', close: '00:00', closed: false },
      saturday: { open: '09:00', close: '00:00', closed: false },
      sunday: { open: '09:00', close: '00:00', closed: false },
    };

    it('considers restaurant open at 23:30 (11:30 PM PKT) on 00:00 midnight closing', () => {
      // 2026-09-16 23:30 PKT = 2026-09-16 18:30 UTC
      const date = new Date('2026-09-16T18:30:00.000Z');
      const status = checkRestaurantStatus(date, standardSchedule, 'Asia/Karachi');
      expect(status.isOpen).toBe(true);
    });

    it('considers restaurant closed at 00:00 (exact midnight cutoff) with next opening message', () => {
      // 2026-09-17 00:00 PKT = 2026-09-16 19:00 UTC
      const date = new Date('2026-09-16T19:00:00.000Z');
      const status = checkRestaurantStatus(date, standardSchedule, 'Asia/Karachi');
      expect(status.isOpen).toBe(false);
      expect(status.formattedMessage).toContain('Closed now, opens at 09:00');
    });

    it('considers restaurant closed at 04:00 AM PKT', () => {
      // 2026-09-17 04:00 PKT = 2026-09-16 23:00 UTC
      const date = new Date('2026-09-16T23:00:00.000Z');
      const status = checkRestaurantStatus(date, standardSchedule, 'Asia/Karachi');
      expect(status.isOpen).toBe(false);
      expect(status.formattedMessage).toContain('Closed now, opens at 09:00');
    });

    it('correctly handles overnight shifts closing after midnight (e.g. 02:00 AM)', () => {
      const overnightSchedule = {
        monday: { open: '09:00', close: '02:00', closed: false },
        tuesday: { open: '09:00', close: '02:00', closed: false },
        wednesday: { open: '09:00', close: '02:00', closed: false },
        thursday: { open: '09:00', close: '02:00', closed: false },
        friday: { open: '09:00', close: '02:00', closed: false },
        saturday: { open: '09:00', close: '02:00', closed: false },
        sunday: { open: '09:00', close: '02:00', closed: false },
      };

      // Tuesday 01:30 AM PKT (falls inside Monday night shift closing at 02:00 AM)
      // 2026-09-15 is Tuesday. 01:30 PKT = 2026-09-14 20:30 UTC
      const dateInsideOvernight = new Date('2026-09-14T20:30:00.000Z');
      const statusInside = checkRestaurantStatus(dateInsideOvernight, overnightSchedule, 'Asia/Karachi');
      expect(statusInside.isOpen).toBe(true);

      // Tuesday 02:30 AM PKT (past Monday overnight close, before Tuesday 09:00 open)
      // 2026-09-14 21:30 UTC
      const datePastOvernight = new Date('2026-09-14T21:30:00.000Z');
      const statusPast = checkRestaurantStatus(datePastOvernight, overnightSchedule, 'Asia/Karachi');
      expect(statusPast.isOpen).toBe(false);
      expect(statusPast.formattedMessage).toContain('Closed now, opens at 09:00');
    });
  });

  describe('Server-side rejection outside opening hours', () => {
    it('rejects reservation outside opening hours with 422 and OUTSIDE_OPENING_HOURS', async () => {
      const tomorrow4am = new Date();
      tomorrow4am.setDate(tomorrow4am.getDate() + 2);
      tomorrow4am.setHours(4, 0, 0, 0);

      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          date: tomorrow4am.toISOString(),
          partySize: 2,
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('OUTSIDE_OPENING_HOURS');
      expect(res.body.error.message).toContain('accepted between');
    });

    it('rejects order creation with 422 and RESTAURANT_CLOSED when restaurant is closed', async () => {
      // Temporarily set restaurant schedule to closed for all days
      const closedSchedule = {
        monday: { open: '09:00', close: '00:00', closed: true },
        tuesday: { open: '09:00', close: '00:00', closed: true },
        wednesday: { open: '09:00', close: '00:00', closed: true },
        thursday: { open: '09:00', close: '00:00', closed: true },
        friday: { open: '09:00', close: '00:00', closed: true },
        saturday: { open: '09:00', close: '00:00', closed: true },
        sunday: { open: '09:00', close: '00:00', closed: true },
      };

      await prisma.restaurantSettings.update({
        where: { id: 'singleton' },
        data: { openingHours: closedSchedule },
      });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          type: 'TAKEAWAY',
          items: [{ menuItemId, quantity: 1 }],
          contactPhone: '0300-1111111',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('RESTAURANT_CLOSED');
      expect(res.body.error.message).toContain('Closed now');

      // Restore standard open schedule
      const standardSchedule = {
        monday: { open: '09:00', close: '00:00', closed: false },
        tuesday: { open: '09:00', close: '00:00', closed: false },
        wednesday: { open: '09:00', close: '00:00', closed: false },
        thursday: { open: '09:00', close: '00:00', closed: false },
        friday: { open: '09:00', close: '00:00', closed: false },
        saturday: { open: '09:00', close: '00:00', closed: false },
        sunday: { open: '09:00', close: '00:00', closed: false },
      };
      await prisma.restaurantSettings.update({
        where: { id: 'singleton' },
        data: { openingHours: standardSchedule },
      });
    });
  });
});
