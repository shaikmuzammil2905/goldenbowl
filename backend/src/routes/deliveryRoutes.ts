import { Router } from 'express';
import { DeliveryController } from '../controllers/deliveryController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleGuard.js';
import { logAuditAction } from '../middleware/auditLogger.js';

const router = Router();

router.get('/me', authenticateToken, DeliveryController.getCurrentPartner);
router.get('/dashboard', authenticateToken, DeliveryController.getCurrentPartner);
router.get('/partners/me', authenticateToken, DeliveryController.getCurrentPartner);
router.get('/partners', authenticateToken, authorizeRoles('ADMIN', 'SUPPORT', 'DELIVERY'), DeliveryController.getPartners);
router.post('/partners', logAuditAction('REGISTER_DELIVERY_PARTNER', 'DeliveryPartner'), DeliveryController.registerPartner);
router.get('/partners/:id', authenticateToken, DeliveryController.getPartnerProfile);
router.put('/partners/:id', authenticateToken, logAuditAction('UPDATE_DELIVERY_PARTNER', 'DeliveryPartner'), DeliveryController.updatePartnerProfile);
router.patch('/partners/:id/verification', authenticateToken, authorizeRoles('ADMIN'), logAuditAction('VERIFY_DELIVERY_PARTNER', 'DeliveryPartner'), DeliveryController.updateVerificationStatus);

export default router;
