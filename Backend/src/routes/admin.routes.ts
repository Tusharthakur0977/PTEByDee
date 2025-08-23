import { Router } from 'express';
import { getAllUsers } from '../controllers/Admin/getAllUsers.controller';
import { getUserById } from '../controllers/Admin/getUserById.controller';
import { updateUser } from '../controllers/Admin/updateUser.controller';
import { deleteUser } from '../controllers/Admin/deleteUser.controller';
import { createCourse } from '../controllers/Admin/createCourse.controller';
import { getAllCourses } from '../controllers/Admin/getAllCourses.controller';
import { getCourseById } from '../controllers/Admin/getCourseById.controller';
import { updateCourse } from '../controllers/Admin/updateCourse.controller';
import { deleteCourse } from '../controllers/Admin/deleteCourse.controller';
import { bulkDeleteCourses } from '../controllers/Admin/bulkDeleteCourses.controller';
import { getCourseStats } from '../controllers/Admin/getCourseStats.controller';
import {
  getCategoriesForCourses,
  createCategory,
} from '../controllers/Admin/getCategoriesForCourses.controller';
import { updateCategory } from '../controllers/Admin/updateCategory.controller';
import { deleteCategory } from '../controllers/Admin/deleteCategory.controller';
import { uploadCourseImage } from '../controllers/Admin/uploadCourseImage.controller';
import { uploadCourseVideo } from '../controllers/Admin/uploadCourseVideo.controller';
import { uploadSectionVideo } from '../controllers/Admin/uploadSectionVideo.controller';
import { uploadLessonVideo } from '../controllers/Admin/uploadLessonVideo.controller';
import {
  generateSecureImageUrl,
  generateSecureImageUrls,
} from '../controllers/Admin/generateSecureImageUrl.controller';
import {
  generateSecureVideoUrl,
  generateSecureVideoUrls,
} from '../controllers/Admin/generateSecureVideoUrl.controller';
import { debugCloudFront } from '../controllers/Admin/debugCloudFront.controller';
import {
  getSecureContentUrls,
  getCourseContentUrls,
} from '../controllers/Admin/getSecureContentUrls.controller';
import {
  syncStripeProducts,
  verifyStripeProducts,
} from '../controllers/Admin/syncStripeProducts.controller';

import { protect } from '../middlewares/authenticate.middleware';
import { isAdmin } from '../middlewares/isAdmin.middleware';
import {
  handleCourseImageUpload,
  handleCourseVideoUpload,
  handleSectionVideoUpload,
  handleLessonVideoUpload,
} from '../middlewares/upload.middleware';

const router = Router();

// User management routes
router.get('/users', protect, isAdmin, getAllUsers);
router.get('/users/:id', protect, isAdmin, getUserById);
router.put('/users/:id', protect, isAdmin, updateUser);
router.delete('/users/:id', protect, isAdmin, deleteUser);

// Course management routes
router.post('/courses', protect, isAdmin, createCourse);
router.get('/courses', protect, isAdmin, getAllCourses);
router.get('/courses/stats', protect, isAdmin, getCourseStats);
router.get('/courses/:id', protect, isAdmin, getCourseById);
router.put('/courses/:id', protect, isAdmin, updateCourse);
router.delete('/courses/:id', protect, isAdmin, deleteCourse);
router.delete('/courses/bulk', protect, isAdmin, bulkDeleteCourses);

// Category management routes
router.get('/categories', protect, isAdmin, getCategoriesForCourses);
router.post('/categories', protect, isAdmin, createCategory);
router.put('/categories/:id', protect, isAdmin, updateCategory);
router.delete('/categories/:id', protect, isAdmin, deleteCategory);

// File upload routes
router.post(
  '/upload/course-image',
  protect,
  isAdmin,
  handleCourseImageUpload,
  uploadCourseImage
);

router.post(
  '/upload/course-video',
  protect,
  isAdmin,
  handleCourseVideoUpload,
  uploadCourseVideo
);

router.post(
  '/upload/section-video',
  protect,
  isAdmin,
  handleSectionVideoUpload,
  uploadSectionVideo
);

router.post(
  '/upload/lesson-video',
  protect,
  isAdmin,
  handleLessonVideoUpload,
  uploadLessonVideo
);

// Secure URL generation routes
router.post('/secure-url/image', protect, isAdmin, generateSecureImageUrl);
router.post('/secure-url/images', protect, isAdmin, generateSecureImageUrls);
router.post('/secure-url/video', protect, isAdmin, generateSecureVideoUrl);
router.post('/secure-url/videos', protect, isAdmin, generateSecureVideoUrls);

// Bulk content URL generation routes
router.post('/content/secure-urls', protect, isAdmin, getSecureContentUrls);
router.post(
  '/courses/:courseId/secure-urls',
  protect,
  isAdmin,
  getCourseContentUrls
);

// Debug routes
router.get('/debug/cloudfront', protect, isAdmin, debugCloudFront);

// Stripe management routes
router.post('/stripe/sync-products', protect, isAdmin, syncStripeProducts);
router.get('/stripe/verify-products', protect, isAdmin, verifyStripeProducts);

export default router;
