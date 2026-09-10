import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { updateSettingsSchema } from '../schemas/settings.schema';

const router = Router();

router.get('/settings', getSettings);
router.put('/admin/settings', authenticateJWT, requireAdmin, validateBody(updateSettingsSchema), updateSettings);

export default router;
