import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting prediction levels database unification...');
  
  try {
    // Count how many questions will be migrated
    const countToUpdate = await prisma.question.count({
      where: {
        predictionLevel: {
          in: ['LOW', 'MEDIUM']
        }
      }
    });

    console.log(`🔍 Found ${countToUpdate} questions with legacy 'LOW' or 'MEDIUM' prediction levels.`);

    if (countToUpdate === 0) {
      console.log('✅ No questions need migration. Your database is already aligned!');
      return;
    }

    // Update legacy predicted questions to HIGH
    const updateResult = await prisma.question.updateMany({
      where: {
        predictionLevel: {
          in: ['LOW', 'MEDIUM']
        }
      },
      data: {
        predictionLevel: 'HIGH'
      }
    });

    console.log(`🎉 Successfully unified ${updateResult.count} legacy questions to 'HIGH' prediction level!`);
  } catch (error) {
    console.error('❌ Error updating prediction levels:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
