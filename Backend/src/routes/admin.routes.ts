import { Router } from 'express';
import { getAllUsers } from '../controllers/Admin/getAllUsers.controller';

import { protect } from '../middlewares/authenticate.middleware';
import { isAdmin } from '../middlewares/isAdmin.middleware';

const router = Router();
// Admin-only route example
router.get('/users', protect, isAdmin, getAllUsers);

export default router;
