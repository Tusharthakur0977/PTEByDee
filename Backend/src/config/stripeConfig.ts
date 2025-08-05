import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export default stripe;

export const STRIPE_CONFIG = {
  currency: 'usd',
  successUrl: `${process.env.FRONTEND_URL}/payment/success`,
  cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel`,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};
