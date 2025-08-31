import { Test, PteQuestionTypeName, Question } from '../types/pte';

// Mock PTE test data for demonstration
export const mockTests: Test[] = [
  {
    id: 'test-1',
    title: 'PTE Academic Mock Test 1',
    description: 'Complete PTE Academic practice test with all four skills',
    testType: 'ACADEMIC',
    totalDuration: 180, // 3 hours in minutes
    isFree: true,
    questions: [
      // Speaking Questions
      {
        id: 'q1',
        questionCode: 'RA_001',
        questionTypeId: 'qt1',
        testId: 'test-1',
        orderInTest: 1,
        textContent:
          'The concept of artificial intelligence has evolved significantly over the past few decades. From simple rule-based systems to complex machine learning algorithms, AI has transformed various industries including healthcare, finance, and transportation.',
        durationMillis: 40000, // 40 seconds
      },
      {
        id: 'q2',
        questionCode: 'RS_001',
        questionTypeId: 'qt2',
        testId: 'test-1',
        orderInTest: 2,
        audioUrl: '/audio/repeat-sentence-1.mp3',
        durationMillis: 15000, // 15 seconds
      },
      {
        id: 'q3',
        questionCode: 'DI_001',
        questionTypeId: 'qt3',
        testId: 'test-1',
        orderInTest: 3,
        imageUrl:
          'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=600',
        durationMillis: 40000, // 40 seconds
      },

      // Writing Questions
      {
        id: 'q4',
        questionCode: 'SWT_001',
        questionTypeId: 'qt4',
        testId: 'test-1',
        orderInTest: 4,
        textContent:
          'Climate change represents one of the most pressing challenges of our time. The scientific consensus indicates that human activities, particularly the emission of greenhouse gases, are the primary drivers of recent climate change. The effects are already visible in rising global temperatures, melting ice caps, and more frequent extreme weather events. Governments worldwide are implementing various strategies to mitigate these effects, including renewable energy adoption, carbon pricing mechanisms, and international cooperation through agreements like the Paris Climate Accord. However, the transition to a sustainable future requires not only policy changes but also individual actions and technological innovations.',
        wordCountMin: 5,
        wordCountMax: 75,
        durationMillis: 600000, // 10 minutes
      },
      {
        id: 'q5',
        questionCode: 'WE_001',
        questionTypeId: 'qt5',
        testId: 'test-1',
        orderInTest: 5,
        textContent:
          'Some people believe that technology has made our lives easier and more convenient. Others argue that technology has made our lives more complicated and stressful. Discuss both views and give your own opinion.',
        wordCountMin: 200,
        wordCountMax: 300,
        durationMillis: 1200000, // 20 minutes
      },

      // Reading Questions
      {
        id: 'q6',
        questionCode: 'MCQ_R_001',
        questionTypeId: 'qt6',
        testId: 'test-1',
        orderInTest: 6,
        textContent:
          'The development of renewable energy sources has become increasingly important as the world seeks to reduce its dependence on fossil fuels. Solar and wind power have emerged as the most promising alternatives, with costs declining rapidly over the past decade. However, challenges remain in terms of energy storage and grid integration.',
        options: [
          {
            id: 'a',
            text: 'Renewable energy is becoming more expensive',
            isCorrect: false,
          },
          {
            id: 'b',
            text: 'Solar and wind power are the most promising alternatives',
            isCorrect: true,
          },
          {
            id: 'c',
            text: 'Energy storage is no longer a challenge',
            isCorrect: false,
          },
          {
            id: 'd',
            text: 'Grid integration has been fully solved',
            isCorrect: false,
          },
        ],
        correctAnswers: ['b'],
      },

      // Listening Questions
      {
        id: 'q7',
        questionCode: 'SST_001',
        questionTypeId: 'qt7',
        testId: 'test-1',
        orderInTest: 7,
        audioUrl: '/audio/summarize-spoken-text-1.mp3',
        wordCountMin: 50,
        wordCountMax: 70,
        durationMillis: 600000, // 10 minutes
      },
    ],
  },
  {
    id: 'test-2',
    title: 'PTE Academic Mock Test 2',
    description: 'Advanced level PTE Academic practice test',
    testType: 'ACADEMIC',
    totalDuration: 180,
    isFree: false,
    questions: [],
  },
];

export const pteSections = [
  {
    id: 'speaking-writing',
    name: 'Speaking & Writing',
    description: 'Combined speaking and writing section',
    durationMinutes: 77,
  },
  {
    id: 'reading',
    name: 'Reading',
    description: 'Reading comprehension section',
    durationMinutes: 32,
  },
  {
    id: 'listening',
    name: 'Listening',
    description: 'Listening comprehension section',
    durationMinutes: 45,
  },
];

export const questionTypes = [
  // Speaking
  {
    id: 'qt1',
    name: PteQuestionTypeName.READ_ALOUD,
    description: 'Read the text aloud',
    pteSectionId: 'speaking-writing',
    expectedTimePerQuestion: 40,
  },
  {
    id: 'qt2',
    name: PteQuestionTypeName.REPEAT_SENTENCE,
    description: 'Listen and repeat the sentence',
    pteSectionId: 'speaking-writing',
    expectedTimePerQuestion: 15,
  },
  {
    id: 'qt3',
    name: PteQuestionTypeName.DESCRIBE_IMAGE,
    description: 'Describe the image shown',
    pteSectionId: 'speaking-writing',
    expectedTimePerQuestion: 40,
  },
  {
    id: 'qt4',
    name: PteQuestionTypeName.RE_TELL_LECTURE,
    description: 'Listen to the lecture and retell it',
    pteSectionId: 'speaking-writing',
    expectedTimePerQuestion: 40,
  },
  {
    id: 'qt5',
    name: PteQuestionTypeName.ANSWER_SHORT_QUESTION,
    description: 'Answer the question in one or few words',
    pteSectionId: 'speaking-writing',
    expectedTimePerQuestion: 10,
  },

  // Writing
  {
    id: 'qt6',
    name: PteQuestionTypeName.SUMMARIZE_WRITTEN_TEXT,
    description: 'Summarize the text in one sentence',
    pteSectionId: 'speaking-writing',
    expectedTimePerQuestion: 600,
  },
  {
    id: 'qt7',
    name: PteQuestionTypeName.WRITE_ESSAY,
    description: 'Write an essay on the given topic',
    pteSectionId: 'speaking-writing',
    expectedTimePerQuestion: 1200,
  },

  // Reading
  {
    id: 'qt8',
    name: PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_READING,
    description: 'Choose the correct answer',
    pteSectionId: 'reading',
    expectedTimePerQuestion: 60,
  },
  {
    id: 'qt9',
    name: PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING,
    description: 'Choose all correct answers',
    pteSectionId: 'reading',
    expectedTimePerQuestion: 60,
  },
  {
    id: 'qt10',
    name: PteQuestionTypeName.RE_ORDER_PARAGRAPHS,
    description: 'Put the paragraphs in correct order',
    pteSectionId: 'reading',
    expectedTimePerQuestion: 120,
  },
  {
    id: 'qt11',
    name: PteQuestionTypeName.READING_FILL_IN_THE_BLANKS,
    description: 'Fill in the missing words',
    pteSectionId: 'reading',
    expectedTimePerQuestion: 90,
  },
  {
    id: 'qt12',
    name: PteQuestionTypeName.READING_WRITING_FILL_IN_THE_BLANKS,
    description: 'Fill in the blanks with correct words',
    pteSectionId: 'reading',
    expectedTimePerQuestion: 120,
  },

  // Listening
  {
    id: 'qt13',
    name: PteQuestionTypeName.SUMMARIZE_SPOKEN_TEXT,
    description: 'Listen and summarize in writing',
    pteSectionId: 'listening',
    expectedTimePerQuestion: 600,
  },
  {
    id: 'qt14',
    name: PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING,
    description: 'Choose the correct answer',
    pteSectionId: 'listening',
    expectedTimePerQuestion: 60,
  },
  {
    id: 'qt15',
    name: PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING,
    description: 'Choose all correct answers',
    pteSectionId: 'listening',
    expectedTimePerQuestion: 60,
  },
  {
    id: 'qt16',
    name: PteQuestionTypeName.LISTENING_FILL_IN_THE_BLANKS,
    description: 'Fill in the missing words while listening',
    pteSectionId: 'listening',
    expectedTimePerQuestion: 90,
  },
  {
    id: 'qt17',
    name: PteQuestionTypeName.HIGHLIGHT_CORRECT_SUMMARY,
    description: 'Choose the correct summary',
    pteSectionId: 'listening',
    expectedTimePerQuestion: 60,
  },
  {
    id: 'qt18',
    name: PteQuestionTypeName.SELECT_MISSING_WORD,
    description: 'Select the missing word',
    pteSectionId: 'listening',
    expectedTimePerQuestion: 30,
  },
  {
    id: 'qt19',
    name: PteQuestionTypeName.HIGHLIGHT_INCORRECT_WORDS,
    description: 'Click on words that differ from audio',
    pteSectionId: 'listening',
    expectedTimePerQuestion: 60,
  },
  {
    id: 'qt20',
    name: PteQuestionTypeName.WRITE_FROM_DICTATION,
    description: 'Type the sentence you hear',
    pteSectionId: 'listening',
    expectedTimePerQuestion: 90,
  },
];
