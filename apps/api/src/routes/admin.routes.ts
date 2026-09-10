import { Router } from 'express';
import {
  getAdminCustomers,
  getAdminCustomerById,
  getAnalyticsOverview,
  getAnalyticsRevenue,
  getAdminDashboard,
  getAdminUsers,
} from '../controllers/admin.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth';

const router = Router();

// Protect all routes in this router
router.use(authenticateJWT, requireAdmin);

router.get('/dashboard', getAdminDashboard);
router.get('/customers', getAdminCustomers);
router.get('/customers/:id', getAdminCustomerById);
router.get('/users', getAdminUsers);
router.get('/analytics/overview', getAnalyticsOverview);
router.get('/analytics/revenue', getAnalyticsRevenue);

export default router;
