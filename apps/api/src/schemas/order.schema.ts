import { z } from 'zod';

export const createOrderSchema = z
  .object({
    type: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY']),
    items: z
      .array(
        z.object({
          menuItemId: z.string().min(1, 'Valid menu item ID is required'),
          variantId: z.string().optional().nullable(),
          addonIds: z.array(z.string()).optional().nullable(),
          quantity: z.number().int().min(1, 'Quantity must be at least 1').max(50),
        })
      )
      .min(1, 'Order must contain at least one item'),
    contactPhone: z.string().min(6, 'Contact phone is required'),
    deliveryAddress: z.string().optional().nullable(),
    deliveryNotes: z.string().optional().nullable(),
    tableNumber: z
      .union([z.string(), z.number()])
      .optional()
      .nullable()
      .transform((val) => (val !== undefined && val !== null && String(val).trim() !== '' ? String(val).trim() : null)),
    paymentMethod: z.string().default('PAY_AT_RESTAURANT'),
  })
  .refine(
    (data) => {
      if (data.type === 'DELIVERY') {
        return !!data.deliveryAddress && data.deliveryAddress.trim().length >= 5;
      }
      return true;
    },
    {
      message: 'Delivery address is required and must be at least 5 characters for delivery orders',
      path: ['deliveryAddress'],
    }
  );

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']),
});
