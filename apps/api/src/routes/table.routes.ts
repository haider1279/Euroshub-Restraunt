import { Router } from 'express';
import {
  getActiveTables,
  getAdminTables,
  updateTable,
  createTable,
  getTableAvailabilityHandler,
} from '../controllers/table.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth';

const router = Router();

// Public: Get live table availability
router.get(['/tables/availability', '/table-availability'], getTableAvailabilityHandler);

// Public: Get active tables for Dine-In selection
router.get('/tables', getActiveTables);

// Admin: Table management
router.get('/admin/tables', authenticateJWT, requireAdmin, getAdminTables);
router.post('/admin/tables', authenticateJWT, requireAdmin, createTable);
router.put('/admin/tables/:id', authenticateJWT, requireAdmin, updateTable);

export default router;
