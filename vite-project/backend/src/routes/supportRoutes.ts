import { Router } from 'express';
import { SupportController } from '../controllers/supportController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleGuard.js';
import { validateSchema, createIssueSchema } from '../validators/index.js';
import { logAuditAction } from '../middleware/auditLogger.js';

const router = Router();

router.get('/', authenticateToken, authorizeRoles('ADMIN', 'SUPPORT'), SupportController.getIssues);
router.post('/', authenticateToken, validateSchema(createIssueSchema), logAuditAction('CREATE_SUPPORT_TICKET', 'SupportIssue'), SupportController.createIssue);
router.patch('/:id/status', authenticateToken, authorizeRoles('ADMIN', 'SUPPORT'), logAuditAction('UPDATE_SUPPORT_TICKET_STATUS', 'SupportIssue'), SupportController.updateStatus);

export default router;
