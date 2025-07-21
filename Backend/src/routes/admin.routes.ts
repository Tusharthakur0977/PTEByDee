import { Router } from 'express';
import { getAllUsers } from '../controllers/Admin/getAllUsers.controller';
import { createCourse } from '../controllers/Admin/createCourse.controller';
import { getAllCourses } from '../controllers/Admin/getAllCourses.controller';
import { getCourseById } from '../controllers/Admin/getCourseById.controller';
import { updateCourse } from '../controllers/Admin/updateCourse.controller';
import { deleteCourse } from '../controllers/Admin/deleteCourse.controller';
import { bulkDeleteCourses } from '../controllers/Admin/bulkDeleteCourses.controller';
import { getCourseStats } from '../controllers/Admin/getCourseStats.controller';
import { getCategoriesForCourses, createCategory } from '../controllers/Admin/getCategoriesForCourses.controller';

import { protect } from '../middlewares/authenticate.middleware';
import { isAdmin } from '../middlewares/isAdmin.middleware';

const router = Router();

// User management routes
router.get('/users', protect, isAdmin, getAllUsers);

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

export default router;
