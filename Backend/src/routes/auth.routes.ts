import { Router } from 'express';
import { loginUser } from '../controllers/Auth/loginUser.controller';
import { registerUser } from '../controllers/Auth/registerUser.controller';
import { googleLogin } from '../controllers/Auth/googleSignIn.controller';
import { getAllUsers } from '../controllers/Admin/getAllUsers.controller';
import getUserProfile from '../controllers/User/getUserProfile.controller';
import updateUserProfile from '../controllers/User/updateUserProfile.controller';

import { protect } from '../middlewares/authenticate.middleware';
import { isAdmin } from '../middlewares/isAdmin.middleware';

const router = Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google-login', googleLogin); // <--- ADDED GOOGLE LOGIN ROUTE

// Protected routes (User Profile Management)
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Admin-only route example
router.get('/users', protect, isAdmin, getAllUsers);

export default router;
