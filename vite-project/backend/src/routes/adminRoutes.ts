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

router.put('/branches/:id', authenticateToken, authorizeRoles('ADMIN'), logAuditAction('UPDATE_BRANCH', 'Branch'), AdminController.updateBranch);
router.delete('/branches/:id', authenticateToken, authorizeRoles('ADMIN'), logAuditAction('DELETE_BRANCH', 'Branch'), AdminController.deleteBranch);

export default router;
