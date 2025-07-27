import { Router } from 'express';
import getUserProfile from '../controllers/User/getUserProfile.controller';
import updateUserProfile from '../controllers/User/updateUserProfile.controller';
import { getCourses } from '../controllers/User/getCourses.controller';
import { getCourseById } from '../controllers/User/getCourseById.controller';
import { enrollCourse } from '../controllers/User/enrollCourse.controller';
import { getCategories } from '../controllers/User/getCategories.controller';

import { protect } from '../middlewares/authenticate.middleware';

const router = Router();

// Public routes (no authentication required)
router.get('/courses', getCourses);
router.get('/courses/:id', getCourseById);
router.get('/categories', getCategories);

// Protected routes (User Profile Management)
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Course enrollment (requires authentication)
router.post('/courses/:id/enroll', protect, enrollCourse);

export default router;
