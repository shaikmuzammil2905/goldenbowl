import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// ── Registration & Password Login ───────────────────────────────────────────
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// ── Email OTP Endpoints ──────────────────────────────────────────────────────
router.post('/send-otp', AuthController.sendOtp);
router.post('/verify-otp', AuthController.verifyOtp);

// ── Mobile SMS OTP Endpoints ────────────────────────────────────────────────
router.post('/send-mobile-otp', AuthController.sendMobileOtp);
router.post('/verify-mobile-otp', AuthController.verifyMobileOtp);

// ── Password Reset ──────────────────────────────────────────────────────────
router.post('/request-reset', AuthController.requestPasswordReset);

// ── Authenticated Session Endpoints ─────────────────────────────────────────
router.post('/logout', authenticateToken, AuthController.logout);
router.get('/me', authenticateToken, AuthController.me);

export default router;
