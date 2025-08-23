import express, { Router } from 'express';
import { confirmCheckoutSession } from '../controllers/Payment/confirmCheckoutSession.controller';
import { confirmPayment } from '../controllers/Payment/confirmPayment.controller';
import { createCheckoutSession } from '../controllers/Payment/createCheckoutSession.controller';
import { createPaymentIntent } from '../controllers/Payment/createPaymentIntent.controller';
import { getPaymentHistory } from '../controllers/Payment/getPaymentHistory.controller';
import { stripeWebhook } from '../controllers/Payment/stripeWebhook.controller';
import { protect } from '../middlewares/authenticate.middleware';

const router = Router();

// Webhook route (must be before express.json() middleware)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

// Protected routes
router.post('/create-checkout-session', protect, createCheckoutSession);
router.post('/confirm-checkout', protect, confirmCheckoutSession);

// Legacy routes (keep for backward compatibility)
router.post('/create-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);

router.get('/history', protect, getPaymentHistory);

export default router;
