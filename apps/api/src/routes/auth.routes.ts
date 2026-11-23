import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateProfile,
  changePassword,
} from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../schemas/auth.schema';
import { authenticateJWT, authRateLimiter } from '../middleware/auth';

const router = Router();

router.post('/register', authRateLimiter, validateBody(registerSchema), register);
router.post('/login', authRateLimiter, validateBody(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticateJWT, getMe);
router.put('/profile', authenticateJWT, validateBody(updateProfileSchema), updateProfile);
router.put('/password', authenticateJWT, validateBody(changePasswordSchema), changePassword);

export default router;
