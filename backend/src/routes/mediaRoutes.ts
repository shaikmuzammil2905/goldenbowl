import { Router } from 'express';
import { MediaController } from '../controllers/mediaController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateSchema, presignedUrlSchema } from '../validators/index.js';

const router = Router();

router.post('/presigned-url', authenticateToken, validateSchema(presignedUrlSchema), MediaController.getPresignedUploadUrl);
router.get('/presigned-download', authenticateToken, MediaController.getPresignedDownloadUrl);

export default router;
