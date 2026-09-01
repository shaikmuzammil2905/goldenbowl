import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleGuard.js';
import { logAuditAction } from '../middleware/auditLogger.js';

const router = Router();

router.get('/dashboard-stats', authenticateToken, authorizeRoles('ADMIN'), AdminController.getDashboardStats);
router.get('/branches', AdminController.getBranches);
router.post('/branches', authenticateToken, authorizeRoles('ADMIN'), logAuditAction('CREATE_BRANCH', 'Branch'), AdminController.createBranch);
router.post('/branches/:id/duplicate', authenticateToken, authorizeRoles('ADMIN'), logAuditAction('DUPLICATE_BRANCH_MENU', 'Branch'), AdminController.duplicateBranchMenu);

export default router;
