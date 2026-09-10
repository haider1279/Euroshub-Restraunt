import { Router } from 'express';
import { getActiveSocialLinks, getAdminSocialLinks, updateSocialLink, createSocialLink } from '../controllers/social.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth';

const router = Router();

// Public: Get active social links with non-empty URL
router.get('/social-links', getActiveSocialLinks);

// Admin: Social link management
router.get('/admin/social-links', authenticateJWT, requireAdmin, getAdminSocialLinks);
router.post('/admin/social-links', authenticateJWT, requireAdmin, createSocialLink);
router.put('/admin/social-links/:id', authenticateJWT, requireAdmin, updateSocialLink);

export default router;
