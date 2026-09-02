import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateSchema, loginSchema } from '../validators/index.js';

const router = Router();

// Password-based login (email/phone + password)
router.post('/login', AuthController.login);

// User registration (name + email/phone + password)
router.post('/register', AuthController.register);

// Email OTP login — 2-step flow
router.post('/send-otp', AuthController.sendOtp);     // Step 1: generate & email OTP
router.post('/verify-otp', AuthController.verifyOtp); // Step 2: verify OTP → return token

// Session routes
router.post('/logout', authenticateToken, AuthController.logout);
router.get('/me', authenticateToken, AuthController.me);

export default router;
