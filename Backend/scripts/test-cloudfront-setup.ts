#!/usr/bin/env ts-node

/**
 * Test script for CloudFront secure URL setup
 * 
 * Usage:
 * npm run test:cloudfront
 * 
 * Or directly with ts-node:
 * npx ts-node scripts/test-cloudfront-setup.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { SecureUrlTestHelper } from '../src/utils/secureUrlTestHelper';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  console.log('🔐 CloudFront Secure URL Setup Test\n');
  console.log('This script will test your CloudFront configuration and signed URL generation.\n');

  try {
    await SecureUrlTestHelper.runAllTests();
  } catch (error) {
    console.error('💥 Test failed with error:', error);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

export default main;
