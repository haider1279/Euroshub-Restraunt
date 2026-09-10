import { z } from 'zod';

export const createReservationSchema = z.object({
  date: z.string().datetime({ message: 'Valid date and time is required' }),
  partySize: z.number().int().min(1, 'Party size must be at least 1').max(20, 'Party size cannot exceed 20 online'),
  notes: z.string().max(500).optional().nullable(),
});

export const updateReservationStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
});
