import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import paymentRoutes from './payment.route';
import supportRoutes from './support.routes';

const router = Router();

// Define base routes
router.use('/admin', adminRoutes);
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/payment', paymentRoutes);
router.use('/support', supportRoutes);

export default router;
