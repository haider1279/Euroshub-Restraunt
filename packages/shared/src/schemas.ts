import { z } from 'zod';

// ==========================================
// 1. AUTH SCHEMAS
// ==========================================
export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  phone: z.string().optional().nullable(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(10, 'New password must be at least 10 characters')
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(10, 'New password must be at least 10 characters'),
});

// ==========================================
// 2. MENU SCHEMAS
// ==========================================
export const createMenuItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  price: z.number().nonnegative('Price must be non-negative').default(0),
  categoryId: z.string().min(1, 'Valid category ID is required'),
  imageUrl: z.string().optional().nullable().or(z.literal('')),
  ingredients: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isPopular: z.boolean().default(false),
  isChefSpecial: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1, 'Variant name is required'),
        price: z.number().nonnegative('Variant price must be non-negative'),
        sortOrder: z.number().int().optional(),
        isAvailable: z.boolean().optional(),
      })
    )
    .optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  sortOrder: z.number().int().default(0),
});

export const createVariantSchema = z.object({
  name: z.string().min(1, 'Option name is required').max(60),
  price: z.number().nonnegative('Price must be non-negative'),
  sortOrder: z.number().int().optional().default(0),
  isAvailable: z.boolean().optional().default(true),
});

export const updateVariantSchema = createVariantSchema.partial();

// ==========================================
// 3. ORDER SCHEMAS
// ==========================================
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

// ==========================================
// 4. RESERVATION SCHEMAS
// ==========================================
export const createReservationSchema = z.object({
  date: z.string().datetime({ message: 'Valid date and time is required' }),
  partySize: z.number().int().min(1, 'Party size must be at least 1').max(20, 'Party size cannot exceed 20 online'),
  notes: z.string().max(500).optional().nullable(),
});

export const updateReservationStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
});

// ==========================================
// 5. REVIEW SCHEMAS
// ==========================================
export const createReviewSchema = z.object({
  orderId: z.string().min(1, 'Valid order ID is required'),
  rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(5, 'Comment must be at least 5 characters').max(1000),
});

export const updateReviewStatusSchema = z.object({
  isHidden: z.boolean(),
});

// ==========================================
// 6. SETTINGS SCHEMAS
// ==========================================
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
  signatureMenuItemId: z.string().optional().nullable(),
  reservationSettings: z.any().optional().nullable(),
});
