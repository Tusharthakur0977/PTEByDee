/**
 * Script to sync existing courses with Stripe products
 *
 * Usage:
 * npm run sync:stripe-products
 *
 * Or directly with ts-node:
 * npx ts-node scripts/sync-stripe-products.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { StripeProductSync } from '../src/utils/stripeProductSync';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  console.log('🚀 Stripe Product Sync Script\n');
  console.log(
    'This script will create Stripe products for existing paid courses.\n'
  );

  try {
    // First, verify current state
    console.log('📊 Verifying current Stripe product state...');
    const verification = await StripeProductSync.verifyStripeProducts();

    console.log(`Total paid courses: ${verification.totalPaidCourses}`);
    console.log(`Issues found: ${verification.issues.length}\n`);

    if (verification.issues.length > 0) {
      console.log('🔧 Issues found:');
      verification.issues.forEach((issue: any) => {
        console.log(`  - ${issue.title}: ${issue.issue}`);
      });
      console.log('');
    }

    // Perform sync
    console.log('🔄 Starting sync process...');
    const syncResults = await StripeProductSync.syncExistingCourses();

    console.log('\n📈 Sync Results:');
    console.log(`✅ Successfully synced: ${syncResults.synced} courses`);
    console.log(`❌ Errors: ${syncResults.errors.length}`);

    if (syncResults.errors.length > 0) {
      console.log('\n❌ Sync Errors:');
      syncResults.errors.forEach((error) => {
        console.log(`  - Course ${error.courseId}: ${error.error}`);
      });
    }

    // Final verification
    console.log('\n🔍 Final verification...');
    const finalVerification = await StripeProductSync.verifyStripeProducts();

    if (finalVerification.issues.length === 0) {
      console.log('🎉 All paid courses now have Stripe products!');
    } else {
      console.log(`⚠️  ${finalVerification.issues.length} issues still remain`);
    }
  } catch (error) {
    console.error('💥 Sync failed with error:', error);
    process.exit(1);
  }
}

// Run the sync if this script is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

export default main;
