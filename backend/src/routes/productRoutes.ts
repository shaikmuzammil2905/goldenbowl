import { Router } from 'express';
import { ProductController, CategoryController } from '../controllers/productController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleGuard.js';
import { validateSchema, productSchema } from '../validators/index.js';
import { logAuditAction } from '../middleware/auditLogger.js';

export const productRouter = Router();
export const categoryRouter = Router();

// Products
productRouter.get('/', ProductController.getProducts);
productRouter.get('/:id', ProductController.getProductById);
productRouter.post('/', authenticateToken, authorizeRoles('ADMIN', 'SUPPORT'), validateSchema(productSchema), logAuditAction('CREATE_PRODUCT', 'Product'), ProductController.createProduct);
productRouter.put('/:id', authenticateToken, authorizeRoles('ADMIN', 'SUPPORT'), validateSchema(productSchema), logAuditAction('UPDATE_PRODUCT', 'Product'), ProductController.updateProduct);
productRouter.patch('/:id/toggle-availability', authenticateToken, authorizeRoles('ADMIN', 'SUPPORT'), logAuditAction('TOGGLE_PRODUCT_AVAILABILITY', 'Product'), ProductController.toggleAvailability);
productRouter.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), logAuditAction('DELETE_PRODUCT', 'Product'), ProductController.deleteProduct);

// Categories
categoryRouter.get('/', CategoryController.getCategories);
categoryRouter.post('/', authenticateToken, authorizeRoles('ADMIN'), logAuditAction('CREATE_CATEGORY', 'Category'), CategoryController.createCategory);
