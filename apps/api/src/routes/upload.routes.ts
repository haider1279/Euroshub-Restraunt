import { Router } from 'express';
import { upload, handleImageUpload } from '../controllers/upload.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/admin/upload', authenticateJWT, requireAdmin, upload.single('image'), handleImageUpload);
router.post('/upload', authenticateJWT, requireAdmin, upload.single('image'), handleImageUpload);

export default router;
