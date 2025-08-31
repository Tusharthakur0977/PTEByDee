import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { StripeCheckoutService } from '../../services/stripeCheckoutService';
import { CustomRequest } from '../../types';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Confirm checkout session and enroll user in course
 * @route   POST /api/payment/confirm-checkout
 * @access  Private (requires authentication)
 */
export const confirmCheckoutSession = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { sessionId } = req.body;
    const userId = req.user?.id;

    try {
      if (!userId) {
        return sendResponse(
          res,
          STATUS_CODES.UNAUTHORIZED,
          null,
          'Authentication required.'
        );
      }

      if (!sessionId) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Checkout session ID is required.'
        );
      }

      // Small delay to allow webhook to process first (reduces race conditions)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Retrieve checkout session from Stripe
      const session = await StripeCheckoutService.retrieveSession(sessionId);

      console.log('Checkout session retrieved:', {
        sessionId,
        paymentStatus: session.payment_status,
        metadata: session.metadata,
      });

      if (session.payment_status !== 'paid') {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          `Payment status is ${session.payment_status}. Please complete the payment first.`
        );
      }

      // Verify the session belongs to the current user
      if (session.metadata?.userId !== userId) {
        return sendResponse(
          res,
          STATUS_CODES.FORBIDDEN,
          null,
          'Checkout session does not belong to the current user.'
        );
      }

      const courseId = session.metadata?.courseId;

      if (!courseId) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Course information not found in checkout session. Please contact support.'
        );
      }

      // Check if user is already enrolled (this handles webhook race condition)
      const existingEnrollment = await prisma.userCourse.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
        include: {
          course: {
            include: {
              sections: true,
            },
          },
        },
      });

      if (existingEnrollment) {
        // Also check for existing transaction
        const existingTransaction = await prisma.transaction.findFirst({
          where: {
            OR: [{ transactionId: sessionId }, { orderId: sessionId }],
            userId: userId,
          },
        });

        return sendResponse(
          res,
          STATUS_CODES.OK,
          {
            enrollment: existingEnrollment,
            course: {
              id: existingEnrollment.course.id,
              title: existingEnrollment.course.title,
              description: existingEnrollment.course.description,
              imageUrl: existingEnrollment.course.imageUrl,
              sectionCount: existingEnrollment.course.sections.length,
            },
            paymentDetails: {
              sessionId,
              amount: session.amount_total ? session.amount_total / 100 : 0,
              currency: session.currency?.toUpperCase() || 'USD',
              status: session.payment_status,
              gateway: 'Stripe',
              transactionId: existingTransaction?.id || sessionId,
            },
            alreadyEnrolled: true,
          },
          'Payment confirmed! You are already enrolled in this course.'
        );
      }

      // Get course details
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          sections: {
            include: {
              lessons: {
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!course) {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Course not found.'
        );
      }

      // Process enrollment and update transaction with improved race condition handling
      let result;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          result = await prisma.$transaction(
            async (tx) => {
              // Find existing transaction first
              let transactionRecord = await tx.transaction.findFirst({
                where: {
                  OR: [{ transactionId: sessionId }, { orderId: sessionId }],
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
                  // Fetch updated record
                  transactionRecord = await tx.transaction.findUnique({
                    where: { id: transactionRecord.id },
                  });
                }
              } else {
                // Create new transaction record
                transactionRecord = await tx.transaction.create({
                  data: {
                    userId,
                    amount: session.amount_total
                      ? session.amount_total / 100
                      : 0,
                    paymentStatus: 'SUCCESS',
                    gateway: 'Stripe',
                    transactionId: sessionId,
                    orderId: sessionId,
                    purchasedItem: `${
                      session.metadata?.courseTitle || course.title
                    } (${courseId})`,
                  },
                });
              }

              // Check if enrollment already exists (might have been created by webhook)
              let enrollment = await tx.userCourse.findUnique({
                where: {
                  userId_courseId: {
                    userId,
                    courseId,
                  },
                },
              });

              if (!enrollment) {
                // Create enrollment only if it doesn't exist
                enrollment = await tx.userCourse.create({
                  data: {
                    userId,
                    courseId,
                    progress: 0.0,
                    completed: false,
                    enrolledAt: new Date(),
                  },
                });
                console.log(
                  `Created new enrollment for user ${userId} in course ${courseId}`
                );
              } else {
                console.log(
                  `Enrollment already exists for user ${userId} in course ${courseId}`
                );
              }

              return { enrollment, transaction: transactionRecord };
            },
            {
              maxWait: 5000, // Maximum time to wait for a transaction slot
              timeout: 10000, // Maximum time for the transaction to complete
            }
          );
          break; // Success, exit retry loop
        } catch (error: any) {
          retryCount++;
          console.log(
            `Transaction attempt ${retryCount} failed for session ${sessionId}:`,
            error.message,
            `Error code: ${error.code}`
          );

          if (error.code === 'P2034' && retryCount < maxRetries) {
            // Write conflict, wait and retry with exponential backoff
            const waitTime = 100 * Math.pow(2, retryCount);
            console.log(`Retrying in ${waitTime}ms...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          } else if (error.code === 'P2034') {
            // If we've exhausted retries due to write conflicts, check if webhook already processed this
            console.log(
              `Max retries reached for session ${sessionId}, checking if webhook processed it...`
            );

            const existingEnrollment = await prisma.userCourse.findUnique({
              where: {
                userId_courseId: {
                  userId,
                  courseId,
                },
              },
            });

            const existingTransaction = await prisma.transaction.findFirst({
              where: {
                OR: [{ transactionId: sessionId }, { orderId: sessionId }],
                userId: userId,
              },
            });

            if (existingEnrollment && existingTransaction) {
              console.log(
                `Found existing records for session ${sessionId}, using them`
              );
              result = {
                enrollment: existingEnrollment,
                transaction: existingTransaction,
              };
              break;
            } else {
              console.error(
                `Failed to process payment confirmation for session ${sessionId} after ${retryCount} attempts and no existing records found:`,
                error
              );
              throw error;
            }
          } else {
            console.error(
              `Failed to process payment confirmation for session ${sessionId} after ${retryCount} attempts:`,
              error
            );
            throw error; // Re-throw if not a write conflict or max retries reached
          }
        }
      }

      if (!result) {
        return sendResponse(
          res,
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          null,
          'Failed to process payment after multiple attempts. Please try again.'
        );
      }

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          enrollment: result.enrollment,
          course: {
            id: course.id,
            title: course.title,
            description: course.description,
            imageUrl: course.imageUrl,
            sectionCount: course.sections.length,
          },
          paymentDetails: {
            sessionId,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency?.toUpperCase() || 'USD',
            status: session.payment_status,
            gateway: 'Stripe',
            transactionId: result.transaction?.id || sessionId,
          },
        },
        `Payment successful! You are now enrolled in "${course.title}".`
      );
    } catch (error: any) {
      console.error('Confirm checkout session error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while confirming payment. Please try again.'
      );
    }
  }
);
