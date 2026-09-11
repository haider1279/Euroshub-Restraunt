import { Router } from 'express';
import {
  getCategories,
  getMenuItems,
  getChefSpecialItems,
  getFeaturedItems,
  getPopularItems,
  getMenuItemById,
  getAdminMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuItemVariants,
  createVariant,
  updateVariant,
  deleteVariant,
} from '../controllers/menu.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  createCategorySchema,
  createVariantSchema,
  updateVariantSchema,
} from '../schemas/menu.schema';

const router = Router();

// Public routes
router.get(['/menu-categories', '/menu/categories'], getCategories);
router.get(['/menu-items/chef-specials', '/menu/chef-specials'], getChefSpecialItems);
router.get(['/menu-items/featured', '/menu/featured'], getFeaturedItems);
router.get(['/menu-items/popular', '/menu/popular'], getPopularItems);
router.get(['/menu-items', '/menu/items'], getMenuItems);
router.get(['/menu-items/:id', '/menu/items/:id'], getMenuItemById);

// Admin routes
router.get(['/admin/menu-items', '/admin/menu/items'], authenticateJWT, requireAdmin, getAdminMenuItems);
router.post(['/admin/menu-items', '/admin/menu/items'], authenticateJWT, requireAdmin, validateBody(createMenuItemSchema), createMenuItem);
router.put(['/admin/menu-items/:id', '/admin/menu/items/:id'], authenticateJWT, requireAdmin, validateBody(updateMenuItemSchema), updateMenuItem);
router.delete(['/admin/menu-items/:id', '/admin/menu/items/:id'], authenticateJWT, requireAdmin, deleteMenuItem);
router.post(['/admin/menu-categories', '/admin/menu/categories'], authenticateJWT, requireAdmin, validateBody(createCategorySchema), createCategory);
router.put(['/admin/menu-categories/:id', '/admin/menu/categories/:id'], authenticateJWT, requireAdmin, updateCategory);
router.delete(['/admin/menu-categories/:id', '/admin/menu/categories/:id'], authenticateJWT, requireAdmin, deleteCategory);

// Admin Product Variants / Options Management
router.get(['/admin/menu-items/:id/variants', '/admin/menu/items/:id/variants'], authenticateJWT, requireAdmin, getMenuItemVariants);
router.post(['/admin/menu-items/:id/variants', '/admin/menu/items/:id/variants'], authenticateJWT, requireAdmin, validateBody(createVariantSchema), createVariant);
router.put(['/admin/variants/:variantId', '/admin/menu/variants/:variantId'], authenticateJWT, requireAdmin, validateBody(updateVariantSchema), updateVariant);
router.delete(['/admin/variants/:variantId', '/admin/menu/variants/:variantId'], authenticateJWT, requireAdmin, deleteVariant);

export default router;
