import { Router } from 'express';
import { createSupportTicket } from '../controllers/Support/createSupportTicket.controller';
import { optionalAuth } from '../middlewares/optionalAuth.middleware';
import { supportRateLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

router.post('/', supportRateLimiter, optionalAuth, createSupportTicket);

export default router;
