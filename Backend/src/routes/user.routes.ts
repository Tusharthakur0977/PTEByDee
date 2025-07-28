import { Router } from 'express';
import getUserProfile from '../controllers/User/getUserProfile.controller';
import updateUserProfile from '../controllers/User/updateUserProfile.controller';
import { getCourses } from '../controllers/User/getCourses.controller';
import { getCourseById } from '../controllers/User/getCourseById.controller';
import { enrollCourse } from '../controllers/User/enrollCourse.controller';
import { getEnrolledCourses } from '../controllers/User/getEnrolledCourses.controller';
import { getSecureVideoUrl } from '../controllers/User/getSecureVideoUrl.controller';
import { testEnrollment } from '../controllers/User/testEnrollment.controller';
import { getCategories } from '../controllers/User/getCategories.controller';
import { updateLessonProgress } from '../controllers/User/updateLessonProgress.controller';
import {
  getUserProgress,
  getUserProgressOverview,
} from '../controllers/User/getUserProgress.controller';

import { protect } from '../middlewares/authenticate.middleware';

const router = Router();

// Public routes (no authentication required)
router.get('/courses', protect, getCourses);
router.get('/courses/:id', protect, getCourseById);
router.get('/categories', getCategories);

// Protected routes (User Profile Management)
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Course enrollment and enrolled courses (requires authentication)
router.post('/courses/:id/enroll', protect, enrollCourse);
router.get('/enrolled-courses', protect, getEnrolledCourses);

// Progress tracking routes
router.post('/lessons/:lessonId/progress', protect, updateLessonProgress);
router.get('/courses/:courseId/progress', protect, getUserProgress);
router.get('/progress/overview', protect, getUserProgressOverview);

// Secure video URL generation for enrolled users
router.post('/secure-video-url', protect, getSecureVideoUrl);

// Test endpoint for debugging enrollment issues
router.get('/test-enrollment', protect, testEnrollment);

export default router;
