import prisma from '../config/prismaInstance';
import { StripeProductService } from '../services/stripeProductService';

/**
 * Utility functions for syncing existing courses with Stripe products
 */
export class StripeProductSync {
  /**
   * Create Stripe products for existing paid courses that don't have them
   */
  static async syncExistingCourses() {
    try {
      console.log('🔄 Starting Stripe product sync for existing courses...');

      // Find paid courses without Stripe product IDs
      const coursesNeedingSync = await prisma.course.findMany({
        where: {
          isFree: false,
          price: {
            gt: 0,
          },
          stripeProductId: null,
        },
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          price: true,
          currency: true,
        },
      });

      console.log(
        `📊 Found ${coursesNeedingSync.length} courses needing Stripe products`
      );

      if (coursesNeedingSync.length === 0) {
        console.log('✅ All paid courses already have Stripe products');
        return { synced: 0, errors: [] };
      }

      const results = {
        synced: 0,
        errors: [] as Array<{ courseId: string; error: string }>,
      };

      // Process each course
      for (const course of coursesNeedingSync) {
        try {
          console.log(`🔄 Creating Stripe product for course: ${course.title}`);

          const stripeData = await StripeProductService.createProductAndPrice({
            courseId: course.id,
            name: course.title,
            description: course.description,
            imageUrl: course.imageUrl || undefined,
            price: course.price!,
            currency: course.currency || 'USD',
          });

          // Update course with Stripe IDs
          await prisma.course.update({
            where: { id: course.id },
            data: {
              stripeProductId: stripeData.productId,
              stripePriceId: stripeData.priceId,
              updatedAt: new Date(),
            },
          });

          console.log(`✅ Created Stripe product for: ${course.title}`);
          results.synced++;
        } catch (error) {
          console.error(
            `❌ Failed to create Stripe product for course ${course.id}:`,
            error
          );
          results.errors.push({
            courseId: course.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      console.log(
        `🎉 Sync completed: ${results.synced} courses synced, ${results.errors.length} errors`
      );
      return results;
    } catch (error) {
      console.error('❌ Error during Stripe product sync:', error);
      throw error;
    }
  }

  /**
   * Verify all paid courses have valid Stripe products
   */
  static async verifyStripeProducts() {
    try {
      console.log('🔍 Verifying Stripe products for all paid courses...');

      const paidCourses = await prisma.course.findMany({
        where: {
          isFree: false,
          price: {
            gt: 0,
          },
        },
        select: {
          id: true,
          title: true,
          stripeProductId: true,
          stripePriceId: true,
        },
      });

      const issues: any = [];

      for (const course of paidCourses) {
        if (!course.stripeProductId) {
          issues.push({
            courseId: course.id,
            title: course.title,
            issue: 'Missing Stripe product ID',
          });
        }

        if (!course.stripePriceId) {
          issues.push({
            courseId: course.id,
            title: course.title,
            issue: 'Missing Stripe price ID',
          });
        }
      }

      console.log(`📊 Verification complete: ${issues.length} issues found`);
      return {
        totalPaidCourses: paidCourses.length,
        issues,
      };
    } catch (error) {
      console.error('❌ Error during Stripe product verification:', error);
      throw error;
    }
  }
}
