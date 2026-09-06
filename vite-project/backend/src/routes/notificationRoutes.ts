import { Router } from 'express';
import { NotificationController, SettingsController } from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleGuard.js';

export const notificationRouter = Router();
export const settingsRouter = Router();

// Notifications
notificationRouter.get('/', authenticateToken, NotificationController.getNotifications);
notificationRouter.post('/', authenticateToken, authorizeRoles('ADMIN', 'SUPPORT'), NotificationController.createNotification);
notificationRouter.put('/:id/read', authenticateToken, NotificationController.markAsRead);

// Settings
settingsRouter.get('/', SettingsController.getSettings);
settingsRouter.post('/', authenticateToken, authorizeRoles('ADMIN'), SettingsController.updateSetting);
