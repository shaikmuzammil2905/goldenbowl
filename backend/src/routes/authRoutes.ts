import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateSchema, loginSchema } from '../validators/index.js';

const router = Router();

router.post('/login', validateSchema(loginSchema), AuthController.login);
router.post('/logout', authenticateToken, AuthController.logout);
router.get('/me', authenticateToken, AuthController.me);

export default router;
