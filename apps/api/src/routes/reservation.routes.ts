import { Router } from 'express';
import {
  createReservation,
  getCustomerReservations,
  getAdminReservations,
  updateReservationStatus,
} from '../controllers/reservation.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createReservationSchema, updateReservationStatusSchema } from '../schemas/reservation.schema';

const router = Router();

// Customer routes
router.post('/reservations', authenticateJWT, validateBody(createReservationSchema), createReservation);
router.get('/reservations', authenticateJWT, getCustomerReservations);

// Admin routes
router.get('/admin/reservations', authenticateJWT, requireAdmin, getAdminReservations);
router.patch(['/admin/reservations/:id', '/admin/reservations/:id/status'], authenticateJWT, requireAdmin, validateBody(updateReservationStatusSchema), updateReservationStatus);

export default router;
