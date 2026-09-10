import { Router } from 'express';
import {
  getPublicReviews,
  createReview,
  getCustomerReviews,
  getAdminReviews,
  updateReviewStatus,
} from '../controllers/review.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createReviewSchema, updateReviewStatusSchema } from '../schemas/review.schema';

const router = Router();

// Public routes
router.get('/reviews', getPublicReviews);

// Customer routes
router.post('/reviews', authenticateJWT, validateBody(createReviewSchema), createReview);
router.get('/customer/reviews', authenticateJWT, getCustomerReviews);

// Admin routes
router.get('/admin/reviews', authenticateJWT, requireAdmin, getAdminReviews);
router.patch(['/admin/reviews/:id', '/admin/reviews/:id/visibility'], authenticateJWT, requireAdmin, validateBody(updateReviewStatusSchema), updateReviewStatus);

export default router;
