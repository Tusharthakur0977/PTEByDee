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

    // Use transaction to handle race conditions with retry logic
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        await prisma.$transaction(
          async (tx) => {
            // Find or create transaction record
            let transactionRecord = await tx.transaction.findFirst({
              where: {
                OR: [{ transactionId: session.id }, { orderId: session.id }],
                userId: userId,
              },
            });

            if (transactionRecord) {
              // Update existing transaction only if not already successful
              if (transactionRecord.paymentStatus !== 'SUCCESS') {
                await tx.transaction.updateMany({
                  where: {
                    id: transactionRecord.id,
                    paymentStatus: { not: 'SUCCESS' },
                  },
                  data: {
                    paymentStatus: 'SUCCESS',
                  },
                });
                console.log(
                  `Updated existing transaction ${transactionRecord.id} to SUCCESS`
                );
              } else {
                console.log(
                  `Transaction ${transactionRecord.id} already marked as SUCCESS`
                );
              }
            } else {
              // Create new transaction record
              transactionRecord = await tx.transaction.create({
                data: {
                  userId: userId,
                  amount: session.amount_total ? session.amount_total / 100 : 0,
                  paymentStatus: 'SUCCESS',
                  gateway: 'Stripe',
                  transactionId: session.id,
                  orderId: session.id,
                  purchasedItem: `${
                    session.metadata?.courseTitle || 'Course Purchase'
                  } (${courseId})`,
                },
              });
              console.log(
                `Created new transaction record ${transactionRecord.id} for session ${session.id}`
              );
            }

            // Check if enrollment already exists
            const existingEnrollment = await tx.userCourse.findUnique({
              where: {
                userId_courseId: {
                  userId,
                  courseId,
                },
              },
            });

            if (!existingEnrollment) {
              // Create enrollment
              await tx.userCourse.create({
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
            } else {
              console.log(
                `User ${userId} already enrolled in course ${courseId} for session ${session.id}`
              );
            }
          },
          {
            maxWait: 5000,
            timeout: 10000,
          }
        );
        break; // Success, exit retry loop
      } catch (error: any) {
        retryCount++;
        console.log(
          `Webhook transaction attempt ${retryCount} failed for session ${session.id}:`,
          error.message
        );

        if (error.code === 'P2034' && retryCount < maxRetries) {
          // Write conflict, wait and retry with exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, 100 * Math.pow(2, retryCount))
          );
          continue;
        } else {
          console.error(
            `Failed to process webhook for session ${session.id} after ${retryCount} attempts:`,
            error
          );
          throw error;
        }
      }
    }

    console.log(
      `Transaction updated for session ${session.id}, user ${userId}`
    );

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
        OR: [
          { transactionId: paymentIntent.id },
          { orderId: paymentIntent.id },
        ],
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

    const { userId } = paymentIntent.metadata;

    // Update transaction status
    await prisma.transaction.updateMany({
      where: {
        OR: [
          { transactionId: paymentIntent.id },
          { orderId: paymentIntent.id },
        ],
        ...(userId && { userId }),
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

    const { userId } = paymentIntent.metadata;

    // Update transaction status
    await prisma.transaction.updateMany({
      where: {
        OR: [
          { transactionId: paymentIntent.id },
          { orderId: paymentIntent.id },
        ],
        ...(userId && { userId }),
      },
      data: {
        paymentStatus: 'FAILED',
      },
    });
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}
