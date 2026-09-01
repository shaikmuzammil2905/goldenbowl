import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Public / client routes for Razorpay
router.get('/key', PaymentController.getRazorpayKey);
router.post('/create-order', PaymentController.createRazorpayOrder);
router.post('/verify', PaymentController.verifyRazorpayPayment);

// Authenticated order payment routes
router.post('/', authenticateToken, PaymentController.processPayment);
router.get('/order/:orderId', authenticateToken, PaymentController.getPaymentsByOrder);

export default router;

