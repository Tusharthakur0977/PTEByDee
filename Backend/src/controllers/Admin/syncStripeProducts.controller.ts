import { StripeProductSync } from '../../utils/stripeProductSync';
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Sync existing courses with Stripe products
 * @route   POST /api/admin/stripe/sync-products
 * @access  Private/Admin
 */
export const syncStripeProducts = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const results = await StripeProductSync.syncExistingCourses();

      return sendResponse(
        res,
        STATUS_CODES.OK,
        results,
        `Stripe product sync completed. ${results.synced} courses synced successfully.`
      );
    } catch (error: any) {
      console.error('Sync Stripe products error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while syncing Stripe products. Please try again.'
      );
    }
  }
);

/**
 * @desc    Verify Stripe products for all paid courses
 * @route   GET /api/admin/stripe/verify-products
 * @access  Private/Admin
 */
export const verifyStripeProducts = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const results = await StripeProductSync.verifyStripeProducts();

      return sendResponse(
        res,
        STATUS_CODES.OK,
        results,
        'Stripe product verification completed.'
      );
    } catch (error: any) {
      console.error('Verify Stripe products error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while verifying Stripe products. Please try again.'
      );
    }
  }
);
