import { describe, it, expect } from 'vitest';
import { validateReservationTimeAndCapacity, getZonedTimeParts } from '../src/services/reservation.service';

describe('Reservation Validation and Timezone Handling', () => {
  describe('getZonedTimeParts', () => {
    it('correctly parses Asia/Karachi time parts regardless of server timezone', () => {
      // 2026-09-16 20:00 PKT (UTC+5) is 15:00 UTC
      const date = new Date('2026-09-16T15:00:00.000Z');
      const parts = getZonedTimeParts(date, 'Asia/Karachi');

      expect(parts.dayName).toBe('wednesday');
      expect(parts.hour).toBe(20);
      expect(parts.minute).toBe(0);
      expect(parts.year).toBe(2026);
      expect(parts.month).toBe(9);
      expect(parts.day).toBe(16);
    });

    it('correctly handles midnight rollover across timezones', () => {
      // 2026-09-16 02:00 PKT is 2026-09-15 21:00 UTC (Tuesday in UTC, but Wednesday in PKT)
      const date = new Date('2026-09-15T21:00:00.000Z');
      const parts = getZonedTimeParts(date, 'Asia/Karachi');

      expect(parts.dayName).toBe('wednesday');
      expect(parts.hour).toBe(2);
      expect(parts.minute).toBe(0);
    });
  });

  describe('validateReservationTimeAndCapacity', () => {
    // Pick upcoming future dates for testing so now-check passes
    // Using year 2028:
    // 2028-10-09 is Monday
    // 2028-10-10 is Tuesday
    // 2028-10-11 is Wednesday
    // 2028-10-12 is Thursday
    // 2028-10-13 is Friday
    // 2028-10-14 is Saturday
    // 2028-10-15 is Sunday

    const validSlots = [
      { name: 'Monday 09:00', iso: '2028-10-09T09:00:00+05:00' },
      { name: 'Monday 12:00', iso: '2028-10-09T12:00:00+05:00' },
      { name: 'Monday 18:00', iso: '2028-10-09T18:00:00+05:00' },
      { name: 'Monday 20:00', iso: '2028-10-09T20:00:00+05:00' },
      { name: 'Monday 22:00', iso: '2028-10-09T22:00:00+05:00' },
      { name: 'Monday 23:00 (cutoff boundary)', iso: '2028-10-09T23:00:00+05:00' },

      { name: 'Tuesday 09:00', iso: '2028-10-10T09:00:00+05:00' },
      { name: 'Tuesday 15:00', iso: '2028-10-10T15:00:00+05:00' },
      { name: 'Tuesday 20:00', iso: '2028-10-10T20:00:00+05:00' },
      { name: 'Tuesday 23:00', iso: '2028-10-10T23:00:00+05:00' },

      { name: 'Wednesday 09:00', iso: '2028-10-11T09:00:00+05:00' },
      { name: 'Wednesday 12:00', iso: '2028-10-11T12:00:00+05:00' },
      { name: 'Wednesday 18:00', iso: '2028-10-11T18:00:00+05:00' },
      { name: 'Wednesday 20:00', iso: '2028-10-11T20:00:00+05:00' },
      { name: 'Wednesday 22:00', iso: '2028-10-11T22:00:00+05:00' },
      { name: 'Wednesday 23:00 (cutoff boundary)', iso: '2028-10-11T23:00:00+05:00' },

      { name: 'Thursday 20:00', iso: '2028-10-12T20:00:00+05:00' },
      { name: 'Friday 20:00', iso: '2028-10-13T20:00:00+05:00' },
      { name: 'Saturday 20:00', iso: '2028-10-14T20:00:00+05:00' },
      { name: 'Sunday 20:00', iso: '2028-10-15T20:00:00+05:00' },
    ];

    for (const slot of validSlots) {
      it(`accepts valid time slot: ${slot.name}`, async () => {
        const result = await validateReservationTimeAndCapacity(new Date(slot.iso), 2);
        expect(result.valid).toBe(true);
        expect(result.message).toBeUndefined();
      });
    }

    it('rejects booking before opening hours (e.g. 08:00)', async () => {
      const result = await validateReservationTimeAndCapacity(new Date('2028-10-11T08:00:00+05:00'), 2);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('accepted between 09:00 and 23:00');
    });

    it('rejects booking right before opening hours (08:59 boundary)', async () => {
      const result = await validateReservationTimeAndCapacity(new Date('2028-10-11T08:59:00+05:00'), 2);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('accepted between 09:00 and 23:00');
    });

    it('rejects booking right after cutoff (23:01 boundary)', async () => {
      const result = await validateReservationTimeAndCapacity(new Date('2028-10-11T23:01:00+05:00'), 2);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('accepted between 09:00 and 23:00');
    });

    it('rejects booking at 23:30 (during 1-hour cutoff before midnight)', async () => {
      const result = await validateReservationTimeAndCapacity(new Date('2028-10-11T23:30:00+05:00'), 2);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('accepted between 09:00 and 23:00');
    });

    it('correctly accepts when date is passed as UTC ISO string corresponding to 20:00 PKT', async () => {
      // 2028-10-11 20:00 PKT = 2028-10-11 15:00 UTC
      const result = await validateReservationTimeAndCapacity(new Date('2028-10-11T15:00:00.000Z'), 2);
      expect(result.valid).toBe(true);
    });

    it('rejects past reservation dates', async () => {
      const pastDate = new Date('2020-01-01T12:00:00Z');
      const result = await validateReservationTimeAndCapacity(pastDate, 2);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Reservation date and time cannot be in the past.');
    });
  });
});
