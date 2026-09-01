import { Router } from 'express';
import { OrderController } from '../controllers/orderController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleGuard.js';
import { validateSchema, createOrderSchema, updateOrderStatusSchema } from '../validators/index.js';
import { logAuditAction } from '../middleware/auditLogger.js';

const router = Router();

router.get('/', authenticateToken, OrderController.getOrders);
router.get('/:id', authenticateToken, OrderController.getOrderById);
router.post('/', authenticateToken, validateSchema(createOrderSchema), logAuditAction('CREATE_ORDER', 'Order'), OrderController.createOrder);
router.patch('/:id/status', authenticateToken, authorizeRoles('ADMIN', 'SUPPORT', 'DELIVERY'), validateSchema(updateOrderStatusSchema), logAuditAction('UPDATE_ORDER_STATUS', 'Order'), OrderController.updateStatus);
router.post('/:id/assign', authenticateToken, authorizeRoles('ADMIN', 'SUPPORT'), logAuditAction('ASSIGN_ORDER_DRIVER', 'Order'), OrderController.assignDriver);

export default router;
