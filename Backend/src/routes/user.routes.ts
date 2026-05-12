import { Router } from 'express';
import { enrollCourse } from '../controllers/User/enrollCourse.controller';
import { getCategories } from '../controllers/User/getCategories.controller';
import { getCourseById } from '../controllers/User/getCourseById.controller';
import { getCourses } from '../controllers/User/getCourses.controller';
import { getEnrolledCourses } from '../controllers/User/getEnrolledCourses.controller';
import { getPracticeHistory } from '../controllers/User/getPracticeHistory.controller';
import { getPracticeQuestions } from '../controllers/User/getPracticeQuestions.controller';
import { getPredictedQuestions } from '../controllers/User/getPredictedQuestions.controller';
import { getPracticeStats } from '../controllers/User/getPracticeStats.controller';
import { getQuestionById } from '../controllers/User/getQuestionById.controller';
import { getQuestionList } from '../controllers/User/getQuestionList.controller';
import {
  getQuestionPreviousResponses,
  getQuestionResponseStats,
} from '../controllers/User/getQuestionPreviousResponses.controller';
import { getQuestionTypes } from '../controllers/User/getQuestionTypes.controller';
import { getQuestionWithResponses } from '../controllers/User/getQuestionWithResponse.controller';
import { getSecureVideoUrl } from '../controllers/User/getSecureVideoUrl.controller';
import getUserProfile from '../controllers/User/getUserProfile.controller';
import {
  getUserProgress,
  getUserProgressOverview,
} from '../controllers/User/getUserProgress.controller';
import {
  getUserResponses,
  getUserResponseStats,
} from '../controllers/User/getUserResponses.controller';
import { submitPracticeResponse } from '../controllers/User/submitPracticeResponse.controller';
import { submitQuestionResponse } from '../controllers/User/submitQuestionResponse.controller';
import { testEnrollment } from '../controllers/User/testEnrollment.controller';
import { updateLessonProgress } from '../controllers/User/updateLessonProgress.controller';
import updateUserProfile from '../controllers/User/updateUserProfile.controller';
import { uploadAudio } from '../controllers/User/uploadAudio.controller';

import { protect } from '../middlewares/authenticate.middleware';
import { handleUserAudioUpload } from '../middlewares/upload.middleware';

const router = Router();

// Public routes (no authentication required)
router.get('/courses', getCourses);
router.get('/courses/:id', getCourseById);
router.get('/categories', getCategories);
router.get('/question-types', getQuestionTypes);
router.get('/practice-questions/:questionType', getPracticeQuestions);
router.get('/predicted-questions', getPredictedQuestions);
router.get('/question-list/:questionType', getQuestionList);
router.get('/questions/:questionId/practice', getQuestionById);
router.get('/questions/:questionId/responses', getQuestionWithResponses);
router.get(
  '/questions/:questionId/previous-responses',
  protect,
  getQuestionPreviousResponses
);
router.get(
  '/questions/:questionId/response-stats',
  protect,
  getQuestionResponseStats
);

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
router.post('/upload-audio', protect, handleUserAudioUpload, uploadAudio);

// Secure video URL generation for enrolled users
router.post('/secure-video-url', protect, getSecureVideoUrl);

// Test endpoint for debugging enrollment issues
router.get('/test-enrollment', protect, testEnrollment);

export default router;
