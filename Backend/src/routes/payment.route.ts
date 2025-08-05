import { Router } from 'express';
import { createPaymentIntent } from '../controllers/Payment/createPaymentIntent.controller';
import { confirmPayment } from '../controllers/Payment/confirmPayment.controller';
import { stripeWebhook } from '../controllers/Payment/stripeWebhook.controller';
import { getPaymentHistory } from '../controllers/Payment/getPaymentHistory.controller';
import { protect } from '../middlewares/authenticate.middleware';
import express from 'express';

const router = Router();

// Webhook route (must be before express.json() middleware)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

// Protected routes
router.post('/create-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);
router.get('/history', protect, getPaymentHistory);

export default router;
