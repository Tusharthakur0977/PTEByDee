import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import stripe, { STRIPE_CONFIG } from '../../config/stripeConfig';

/**
 * @desc    Handle Stripe webhook events
 * @route   POST /api/payment/webhook
 * @access  Public (Stripe webhook)
 */
export const stripeWebhook = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = STRIPE_CONFIG.webhookSecret;

    if (!endpointSecret) {
      console.error('Stripe webhook secret not configured');
      res.status(400).send('Webhook secret not configured');
      return;
    }

    let event: any;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event.data.object);
          break;

        case 'payment_intent.succeeded':
          await handlePaymentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await handlePaymentFailed(event.data.object);
          break;

        case 'payment_intent.canceled':
          await handlePaymentCanceled(event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

/**
 * Handle completed checkout session
 */
async function handleCheckoutSessionCompleted(session: any) {
  try {
    console.log('Checkout session completed:', session.id);

    const { userId, courseId } = session.metadata;

    if (!userId || !courseId) {
      console.error('Missing metadata in checkout session:', session.id);
      return;
    }

    // Update transaction status
    await prisma.transaction.updateMany({
      where: {
        transactionId: session.id,
        userId: userId,
      },
      data: {
        paymentStatus: 'SUCCESS',
      },
    });

    // Check if enrollment already exists
    const existingEnrollment = await prisma.userCourse.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!existingEnrollment) {
      // Create enrollment
      await prisma.userCourse.create({
        data: {
          userId,
          courseId,
          progress: 0.0,
          completed: false,
          enrolledAt: new Date(),
        },
      });

      console.log(
        `User ${userId} enrolled in course ${courseId} via checkout session ${session.id}`
      );
    }

    // TODO: Send enrollment confirmation email
    // await sendEnrollmentConfirmationEmail(userId, courseId);
  } catch (error) {
    console.error('Error handling checkout session completion:', error);
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    console.log('Payment succeeded:', paymentIntent.id);

    const { userId, courseId } = paymentIntent.metadata;

    if (!userId || !courseId) {
      console.error('Missing metadata in payment intent:', paymentIntent.id);
      return;
    }

    // Update transaction status
    await prisma.transaction.updateMany({
      where: {
        transactionId: paymentIntent.id,
        userId: userId,
      },
      data: {
        paymentStatus: 'SUCCESS',
      },
    });

    // Check if enrollment already exists
    const existingEnrollment = await prisma.userCourse.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!existingEnrollment) {
      // Create enrollment
      await prisma.userCourse.create({
        data: {
          userId,
          courseId,
          progress: 0.0,
          completed: false,
          enrolledAt: new Date(),
        },
      });

      console.log(
        `User ${userId} enrolled in course ${courseId} via payment ${paymentIntent.id}`
      );
    }

    // TODO: Send enrollment confirmation email
    // await sendEnrollmentConfirmationEmail(userId, courseId);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: any) {
  try {
    console.log('Payment failed:', paymentIntent.id);

    // Update transaction status
    await prisma.transaction.updateMany({
      where: {
        transactionId: paymentIntent.id,
      },
      data: {
        paymentStatus: 'FAILED',
      },
    });

    // TODO: Send payment failure notification email
    // await sendPaymentFailureEmail(paymentIntent.metadata.userId);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

/**
 * Handle canceled payment
 */
async function handlePaymentCanceled(paymentIntent: any) {
  try {
    console.log('Payment canceled:', paymentIntent.id);

    // Update transaction status
    await prisma.transaction.updateMany({
      where: {
        transactionId: paymentIntent.id,
      },
      data: {
        paymentStatus: 'FAILED',
      },
    });
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}
