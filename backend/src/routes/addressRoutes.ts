import { Router } from 'express';
import { addressController } from '../controllers/addressController.js';
import { savedPaymentController } from '../controllers/savedPaymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Routes for customer addresses
router.get('/:id/addresses', authenticateToken, addressController.getAddresses);
router.post('/:id/addresses', authenticateToken, addressController.createAddress);
router.put('/:id/addresses/:addressId', authenticateToken, addressController.updateAddress);
router.delete('/:id/addresses/:addressId', authenticateToken, addressController.deleteAddress);

// Routes for customer saved payment methods
router.get('/:id/payments', authenticateToken, savedPaymentController.getSavedPayments);
router.post('/:id/payments', authenticateToken, savedPaymentController.createSavedPayment);
router.delete('/:id/payments/:paymentId', authenticateToken, savedPaymentController.deleteSavedPayment);

export const addressRoutes = router;
export default router;
