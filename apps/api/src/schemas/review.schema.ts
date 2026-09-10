import { z } from 'zod';

export const createReviewSchema = z.object({
  orderId: z.string().min(1, 'Valid order ID is required'),
  rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(5, 'Comment must be at least 5 characters').max(1000),
});

export const updateReviewStatusSchema = z.object({
  isHidden: z.boolean(),
});
