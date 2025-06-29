import { Router } from 'express';
import getUserProfile from '../controllers/User/getUserProfile.controller';
import updateUserProfile from '../controllers/User/updateUserProfile.controller';

import { protect } from '../middlewares/authenticate.middleware';

const router = Router();
// Protected routes (User Profile Management)
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

export default router;
