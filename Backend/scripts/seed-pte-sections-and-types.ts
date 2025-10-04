import { PrismaClient, PteQuestionTypeName } from '@prisma/client';

const prisma = new PrismaClient();

// Define the PTE sections based on frontend structure
const pteSections = [
  {
    name: 'Speaking',
    description: 'Speaking tasks with AI feedback and pronunciation assessment',
    durationMinutes: 54, // Typical PTE Speaking section duration
  },
  {
    name: 'Writing',
    description:
      'Writing tasks with AI assessment for grammar, vocabulary, and structure',
    durationMinutes: 32, // Typical PTE Writing section duration
  },
  {
    name: 'Reading',
    description: 'Reading comprehension and analysis tasks',
    durationMinutes: 32, // Typical PTE Reading section duration
  },
  {
    name: 'Listening',
    description: 'Listening comprehension and response tasks',
    durationMinutes: 45, // Typical PTE Listening section duration
  },
];

// Define question types with their details based on frontend categories
const questionTypesData = [
  // Speaking Section
  {
    sectionName: 'Speaking',
    types: [
      {
        name: PteQuestionTypeName.READ_ALOUD,
        description:
          'Read text aloud clearly and naturally with proper pronunciation and fluency',
        expectedTimePerQuestion: 40, // seconds
      },
      {
        name: PteQuestionTypeName.REPEAT_SENTENCE,
        description:
          'Listen and repeat sentences exactly as heard with accurate pronunciation',
        expectedTimePerQuestion: 15, // seconds
      },
      {
        name: PteQuestionTypeName.DESCRIBE_IMAGE,
        description:
          'Describe images in detail using appropriate vocabulary and structure',
        expectedTimePerQuestion: 40, // seconds
      },
      {
        name: PteQuestionTypeName.RE_TELL_LECTURE,
        description:
          'Listen to lectures and retell the content in your own words',
        expectedTimePerQuestion: 40, // seconds
      },
      {
        name: PteQuestionTypeName.ANSWER_SHORT_QUESTION,
        description: 'Answer questions with short, accurate responses',
        expectedTimePerQuestion: 10, // seconds
      },
    ],
  },
  // Writing Section
  {
    sectionName: 'Writing',
    types: [
      {
        name: PteQuestionTypeName.SUMMARIZE_WRITTEN_TEXT,
        description: 'Summarize written passages in one sentence (5-75 words)',
        expectedTimePerQuestion: 600, // 10 minutes
      },
      {
        name: PteQuestionTypeName.WRITE_ESSAY,
        description: 'Write essays on given topics (200-300 words)',
        expectedTimePerQuestion: 1200, // 20 minutes
      },
    ],
  },
  // Reading Section
  {
    sectionName: 'Reading',
    types: [
      {
        name: PteQuestionTypeName.FILL_IN_THE_BLANKS_DRAG_AND_DROP,
        description: 'Drag and drop words to fill blanks in the text',
        expectedTimePerQuestion: 150, // 2-3 minutes
      },
      {
        name: PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING,
        description: 'Select multiple correct answers from reading passages',
        expectedTimePerQuestion: 90, // 1-2 minutes
      },
      {
        name: PteQuestionTypeName.RE_ORDER_PARAGRAPHS,
        description:
          'Arrange paragraphs in logical order to form coherent text',
        expectedTimePerQuestion: 150, // 2-3 minutes
      },
      {
        name: PteQuestionTypeName.READING_FILL_IN_THE_BLANKS,
        description: 'Choose words from dropdown menus to complete text',
        expectedTimePerQuestion: 90, // 1-2 minutes
      },
      {
        name: PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_READING,
        description:
          'Select one correct answer from reading comprehension questions',
        expectedTimePerQuestion: 60, // 1 minute
      },
    ],
  },
  // Listening Section
  {
    sectionName: 'Listening',
    types: [
      {
        name: PteQuestionTypeName.SUMMARIZE_SPOKEN_TEXT,
        description: 'Listen to audio and write summaries (50-70 words)',
        expectedTimePerQuestion: 600, // 10 minutes
      },
      {
        name: PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING,
        description: 'Select multiple correct answers from listening passages',
        expectedTimePerQuestion: 90, // 1-2 minutes
      },
      {
        name: PteQuestionTypeName.LISTENING_FILL_IN_THE_BLANKS,
        description: 'Type missing words while listening to audio',
        expectedTimePerQuestion: 90, // 1-2 minutes
      },
      {
        name: PteQuestionTypeName.HIGHLIGHT_CORRECT_SUMMARY,
        description: 'Choose the best summary that matches the audio content',
        expectedTimePerQuestion: 60, // 1 minute
      },
      {
        name: PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING,
        description:
          'Select one correct answer from listening comprehension questions',
        expectedTimePerQuestion: 60, // 1 minute
      },
      {
        name: PteQuestionTypeName.SELECT_MISSING_WORD,
        description: 'Choose the missing word from the end of audio recordings',
        expectedTimePerQuestion: 30, // 30 seconds
      },
      {
        name: PteQuestionTypeName.HIGHLIGHT_INCORRECT_WORDS,
        description:
          'Click on words that differ from the audio in the transcript',
        expectedTimePerQuestion: 90, // 1-2 minutes
      },
      {
        name: PteQuestionTypeName.WRITE_FROM_DICTATION,
        description: 'Type sentences exactly as heard from audio',
        expectedTimePerQuestion: 90, // 1-2 minutes
      },
    ],
  },
];

async function seedPteSectionsAndTypes() {
  try {
    console.log('🌱 Starting PTE sections and question types seeding...');

    // First, create PTE sections
    console.log('📝 Creating PTE sections...');
    const createdSections = new Map<string, string>();

    for (const sectionData of pteSections) {
      const existingSection = await prisma.pteSection.findUnique({
        where: { name: sectionData.name },
      });

      if (existingSection) {
        console.log(`✅ Section "${sectionData.name}" already exists`);
        createdSections.set(sectionData.name, existingSection.id);
      } else {
        const section = await prisma.pteSection.create({
          data: sectionData,
        });
        console.log(`✨ Created section: ${section.name}`);
        createdSections.set(section.name, section.id);
      }
    }

    // Then, create question types for each section
    console.log('🎯 Creating question types...');
    let totalCreated = 0;
    let totalSkipped = 0;

    for (const sectionTypes of questionTypesData) {
      const sectionId = createdSections.get(sectionTypes.sectionName);
      if (!sectionId) {
        console.error(`❌ Section "${sectionTypes.sectionName}" not found`);
        continue;
      }

      console.log(
        `\n📋 Processing question types for: ${sectionTypes.sectionName}`
      );

      for (const typeData of sectionTypes.types) {
        const existingType = await prisma.questionType.findUnique({
          where: { name: typeData.name },
        });

        if (existingType) {
          console.log(`⏭️  Question type "${typeData.name}" already exists`);
          totalSkipped++;
        } else {
          const questionType = await prisma.questionType.create({
            data: {
              name: typeData.name,
              description: typeData.description,
              pteSectionId: sectionId,
              expectedTimePerQuestion: typeData.expectedTimePerQuestion,
            },
          });
          console.log(`✨ Created question type: ${questionType.name}`);
          totalCreated++;
        }
      }
    }

    console.log('\n🎉 Seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Sections processed: ${pteSections.length}`);
    console.log(`   - Question types created: ${totalCreated}`);
    console.log(`   - Question types skipped (already exist): ${totalSkipped}`);

    // Display final structure
    console.log('\n📋 Final PTE structure:');
    const sections = await prisma.pteSection.findMany({
      include: {
        questionTypes: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    sections.forEach((section) => {
      console.log(`\n🔹 ${section.name} (${section.durationMinutes} min)`);
      section.questionTypes.forEach((type) => {
        const timeDisplay = type.expectedTimePerQuestion
          ? type.expectedTimePerQuestion >= 60
            ? `${Math.floor(type.expectedTimePerQuestion / 60)}:${(
                type.expectedTimePerQuestion % 60
              )
                .toString()
                .padStart(2, '0')} min`
            : `${type.expectedTimePerQuestion}s`
          : 'N/A';
        console.log(`   • ${type.name} (${timeDisplay})`);
      });
    });
  } catch (error) {
    console.error('❌ Error seeding PTE sections and types:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
if (require.main === module) {
  seedPteSectionsAndTypes()
    .then(() => {
      console.log('✅ Seeding script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding script failed:', error);
      process.exit(1);
    });
}

export default seedPteSectionsAndTypes;
