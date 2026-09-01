import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateSchema, loginSchema } from '../validators/index.js';

const router = Router();

// Legacy identifier-based login (mobile/email combined)
router.post('/login', validateSchema(loginSchema), AuthController.login);

// Email OTP login — 2-step flow
router.post('/send-otp', AuthController.sendOtp);     // Step 1: generate & email OTP
router.post('/verify-otp', AuthController.verifyOtp); // Step 2: verify OTP → return token

// Session routes
router.post('/logout', authenticateToken, AuthController.logout);
router.get('/me', authenticateToken, AuthController.me);

export default router;
