import { z } from 'zod';

export const createMenuItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  price: z.number().nonnegative('Price must be non-negative').default(0),
  categoryId: z.string().min(1, 'Valid category ID is required'),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
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
