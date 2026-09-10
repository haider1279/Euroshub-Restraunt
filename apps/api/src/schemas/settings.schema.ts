import { z } from 'zod';

export const updateSettingsSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  headline: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  description: z.string().min(10).optional(),
  phone: z.string().min(5).optional(),
  email: z.string().email().optional(),
  address: z.string().min(5).optional(),
  logoUrl: z.string().optional().nullable(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  footerText: z.string().optional().nullable(),
  openingHours: z
    .record(
      z.string(),
      z.object({
        open: z.string(),
        close: z.string(),
        closed: z.boolean().default(false),
      })
    )
    .optional(),
  deliveryEnabled: z.boolean().optional(),
  deliveryFee: z.number().min(0).optional(),
  tableCount: z.number().int().min(1).max(200).optional(),
  reservationSettings: z.any().optional().nullable(),
});
