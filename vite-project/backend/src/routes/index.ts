import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import { addressRoutes } from './addressRoutes.js';
import { productRouter, categoryRouter } from './productRoutes.js';
import orderRoutes from './orderRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import supportRoutes from './supportRoutes.js';
import deliveryRoutes from './deliveryRoutes.js';
import mediaRoutes from './mediaRoutes.js';
import adminRoutes from './adminRoutes.js';
import { notificationRouter, settingsRouter } from './notificationRoutes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/customers', addressRoutes);
apiRouter.use('/products', productRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/support', supportRoutes);
apiRouter.use('/delivery', deliveryRoutes);
apiRouter.use('/media', mediaRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/settings', settingsRouter);

export default apiRouter;
