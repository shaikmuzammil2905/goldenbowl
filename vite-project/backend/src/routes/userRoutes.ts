import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleGuard.js';

const router = Router();

router.get('/', authenticateToken, authorizeRoles('ADMIN', 'SUPPORT'), UserController.getUsers);
router.get('/:id', authenticateToken, UserController.getUserById);

export default router;
