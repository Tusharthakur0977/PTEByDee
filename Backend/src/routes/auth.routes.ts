import { Router } from 'express';
import { googleLogin } from '../controllers/Auth/googleSignIn.controller';

import { sendOtp } from '../controllers/Auth/sendOtp.controller';
import { verifyOtp } from '../controllers/Auth/verifyOtp.controller';

const router = Router();

// Public routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/google-login', googleLogin);

export default router;
