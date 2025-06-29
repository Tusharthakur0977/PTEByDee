// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
// import courseRoutes from './course.routes';
// import testRoutes from './test.routes';
// import adminRoutes from './admin.routes';

const router = Router();

// Define base routes
router.use('/auth', authRoutes);
// router.use('/users', userRoutes);
// router.use('/courses', courseRoutes);
// router.use('/tests', testRoutes);
// router.use('/admin', adminRoutes); // Admin routes might need special handling for `admin` middleware on the router level, or per-route

export default router;
