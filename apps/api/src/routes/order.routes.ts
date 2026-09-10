import { Router } from 'express';
import {
  createOrder,
  getCustomerOrders,
  getOrderById,
  getAdminOrders,
  updateOrderStatus,
} from '../controllers/order.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createOrderSchema, updateOrderStatusSchema } from '../schemas/order.schema';

const router = Router();

// Customer routes
router.post('/orders', authenticateJWT, validateBody(createOrderSchema), createOrder);
router.get('/orders', authenticateJWT, getCustomerOrders);
router.get('/orders/:id', authenticateJWT, getOrderById);

// Admin routes
router.get('/admin/orders', authenticateJWT, requireAdmin, getAdminOrders);
router.get('/admin/orders/:id', authenticateJWT, requireAdmin, getOrderById);
router.patch('/admin/orders/:id/status', authenticateJWT, requireAdmin, validateBody(updateOrderStatusSchema), updateOrderStatus);

export default router;
