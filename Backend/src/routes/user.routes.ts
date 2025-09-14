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
import { getQuestionTypes } from '../controllers/User/getQuestionTypes.controller';
import { getPracticeQuestions } from '../controllers/User/getPracticeQuestions.controller';
import { submitPracticeResponse } from '../controllers/User/submitPracticeResponse.controller';
import { getPracticeHistory } from '../controllers/User/getPracticeHistory.controller';
import { getPracticeStats } from '../controllers/User/getPracticeStats.controller';
import { submitQuestionResponse } from '../controllers/User/submitQuestionResponse.controller';
import {
  getUserResponses,
  getUserResponseStats,
} from '../controllers/User/getUserResponses.controller';
import { uploadAudio } from '../controllers/User/uploadAudio.controller';

import { protect } from '../middlewares/authenticate.middleware';

const router = Router();

// Public routes (no authentication required)
router.get('/courses', getCourses);
router.get('/courses/:id', getCourseById);
router.get('/categories', getCategories);
router.get('/question-types', getQuestionTypes);
router.get('/practice-questions/:questionType', getPracticeQuestions);

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

// Practice routes
router.post('/practice/submit-response', protect, submitPracticeResponse);
router.get('/practice/history', protect, getPracticeHistory);
router.get('/practice/stats', protect, getPracticeStats);

// Question response routes
router.post('/questions/submit-response', protect, submitQuestionResponse);
router.get('/responses', protect, getUserResponses);
router.get('/responses/stats', protect, getUserResponseStats);

// Audio upload for question responses
router.post('/upload-audio', protect, uploadAudio);

// Secure video URL generation for enrolled users
router.post('/secure-video-url', protect, getSecureVideoUrl);

// Test endpoint for debugging enrollment issues
router.get('/test-enrollment', protect, testEnrollment);

export default router;
