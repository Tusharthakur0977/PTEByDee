import { PrismaClient, PteQuestionTypeName } from '@prisma/client';

const prisma = new PrismaClient();

async function addSummarizeGroupDiscussionType() {
  try {
    console.log(
      'Checking if SUMMARIZE_GROUP_DISCUSSION question type exists...'
    );

    // Check if the question type already exists
    const existingType = await prisma.questionType.findUnique({
      where: {
        name: PteQuestionTypeName.SUMMARIZE_GROUP_DISCUSSION,
      },
    });

    if (existingType) {
      console.log(
        '✅ SUMMARIZE_GROUP_DISCUSSION question type already exists in the database.'
      );
      return;
    }

    // Get the Speaking section
    const speakingSection = await prisma.pteSection.findUnique({
      where: { name: 'Speaking' },
    });

    if (!speakingSection) {
      console.error(
        '❌ Speaking section not found. Please run the main seed script first.'
      );
      process.exit(1);
    }

    // Create the SUMMARIZE_GROUP_DISCUSSION question type
    const newQuestionType = await prisma.questionType.create({
      data: {
        name: PteQuestionTypeName.SUMMARIZE_GROUP_DISCUSSION,
        description:
          'Listen to group discussions and summarize the main points and viewpoints',
        pteSectionId: speakingSection.id,
        expectedTimePerQuestion: 130, // 10 seconds prep + 120 seconds recording
      },
      include: {
        pteSection: true,
      },
    });

    console.log(
      '✅ Successfully added SUMMARIZE_GROUP_DISCUSSION question type:'
    );
    console.log(`   • Name: ${newQuestionType.name}`);
    console.log(`   • Description: ${newQuestionType.description}`);
    console.log(`   • Section: ${newQuestionType.pteSection.name}`);
    console.log(
      `   • Expected Time: ${newQuestionType.expectedTimePerQuestion} seconds`
    );
  } catch (error) {
    console.error('❌ Error adding SUMMARIZE_GROUP_DISCUSSION type:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  addSummarizeGroupDiscussionType()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default addSummarizeGroupDiscussionType;
