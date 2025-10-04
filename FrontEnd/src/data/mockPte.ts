import { PteQuestionTypeName } from '../types/pte';
import { Test, Question } from '../types/pte';

export interface MockQuestion {
  id: string;
  type: PteQuestionTypeName;
  title: string;
  instructions: string;
  content: {
    text?: string;
    questionStatement?: string;
    audioUrl?: string;
    imageUrl?: string;
    options?: Array<{
      id: string;
      text: string;
      isCorrect?: boolean;
    }>;
    paragraphs?: Array<{
      id: string;
      text: string;
      order: number;
    }>;
    blanks?: Array<{
      id: string;
      position: number;
      options: string[];
      correctAnswer: string;
    }>;
    wordLimit?: {
      min: number;
      max: number;
    };
    timeLimit?: number; // in seconds
    preparationTime?: number; // in seconds
    recordingTime?: number; // in seconds
  };
}

export const mockQuestions: MockQuestion[] = [
  // Speaking Questions
  {
    id: 'ra_001',
    type: PteQuestionTypeName.READ_ALOUD,
    title: 'Read Aloud - Climate Change',
    instructions:
      'Look at the text below. In 40 seconds, you must read this text aloud as naturally and clearly as possible. You have 40 seconds to read aloud.',
    content: {
      text: 'Climate change represents one of the most pressing challenges of our time. The scientific consensus indicates that human activities, particularly the emission of greenhouse gases, are the primary drivers of recent climate change. Rising global temperatures have led to melting ice caps, rising sea levels, and more frequent extreme weather events.',
      preparationTime: 40,
      recordingTime: 40,
    },
  },
  {
    id: 'rs_001',
    type: PteQuestionTypeName.REPEAT_SENTENCE,
    title: 'Repeat Sentence - Technology',
    instructions:
      'You will hear a sentence. Please repeat the sentence exactly as you hear it. You will hear the sentence only once.',
    content: {
      audioUrl: '/audio/repeat-sentence-1.mp3',
      text: 'Artificial intelligence is transforming various industries including healthcare and finance.',
      recordingTime: 15,
    },
  },
  {
    id: 'di_001',
    type: PteQuestionTypeName.DESCRIBE_IMAGE,
    title: 'Describe Image - Bar Chart',
    instructions:
      'Look at the image below. In 25 seconds, please speak into the microphone and describe in detail what the image is showing. You will have 40 seconds to give your response.',
    content: {
      imageUrl:
        'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=600',
      preparationTime: 25,
      recordingTime: 40,
    },
  },
  {
    id: 'rl_001',
    type: PteQuestionTypeName.RE_TELL_LECTURE,
    title: 'Re-tell Lecture - Environmental Science',
    instructions:
      'You will hear a lecture. After listening to the lecture, in 10 seconds, please speak into the microphone and retell what you have just heard from the lecture in your own words. You will have 40 seconds to give your response.',
    content: {
      audioUrl: '/audio/retell-lecture-1.mp3',
      preparationTime: 10,
      recordingTime: 40,
    },
  },
  {
    id: 'asq_001',
    type: PteQuestionTypeName.ANSWER_SHORT_QUESTION,
    title: 'Answer Short Question - General Knowledge',
    instructions:
      'You will hear a question. Please give a simple and short answer. Often just one or a few words is enough.',
    content: {
      audioUrl: '/audio/short-question-1.mp3',
      text: 'What do you call the person who cuts hair?',
      recordingTime: 10,
    },
  },

  // Writing Questions
  {
    id: 'swt_001',
    type: PteQuestionTypeName.SUMMARIZE_WRITTEN_TEXT,
    title: 'Summarize Written Text - Renewable Energy',
    instructions:
      'Read the passage below and summarize it using one sentence. Type your response in the box at the bottom of the screen. You have 10 minutes to finish this task. Your response will be judged on the quality of your writing and on how well your response presents the key points in the passage.',
    content: {
      text: 'The development of renewable energy sources has become increasingly important as the world seeks to reduce its dependence on fossil fuels and combat climate change. Solar and wind power have emerged as the most promising alternatives, with costs declining rapidly over the past decade. However, challenges remain in terms of energy storage and grid integration. Battery technology has improved significantly, but large-scale storage solutions are still expensive and limited in capacity. Smart grid systems are being developed to better manage the intermittent nature of renewable energy sources. Government policies and incentives have played a crucial role in accelerating the adoption of renewable energy technologies. Many countries have set ambitious targets for renewable energy generation, with some aiming for carbon neutrality by 2050. The transition to renewable energy is not just an environmental imperative but also an economic opportunity, creating new jobs and industries while reducing long-term energy costs.',
      wordLimit: { min: 5, max: 75 },
      timeLimit: 600,
    },
  },
  {
    id: 'we_001',
    type: PteQuestionTypeName.WRITE_ESSAY,
    title: 'Write Essay - Technology and Society',
    instructions:
      'You will have 20 minutes to plan, write and revise an essay about the topic below. Your response will be judged on how well you develop a position, organize your ideas, present supporting details, and control the elements of standard written English. You should write 200-300 words.',
    content: {
      text: 'Some people believe that technology has made our lives easier and more convenient. Others argue that technology has made our lives more complicated and stressful. Discuss both views and give your own opinion.',
      wordLimit: { min: 200, max: 300 },
      timeLimit: 1200,
    },
  },

  // Reading Questions
  {
    id: 'rwfib_001',
    type: PteQuestionTypeName.FILL_IN_THE_BLANKS_DRAG_AND_DROP,
    title: 'Fill in the Blanks (Drag and Drop) - Education',
    instructions:
      'In the text below some words are missing. Drag words from the box below to the appropriate place in the text.',
    content: {
      text: 'Education plays a crucial role in _____ development and social progress. Quality education _____ individuals with the knowledge and skills necessary to participate effectively in society. It promotes critical thinking, creativity, and _____ solving abilities. Furthermore, education contributes to economic growth by creating a skilled _____ that can adapt to changing market demands.',
      blanks: [
        {
          id: 'blank1',
          position: 1,
          options: [
            'personal',
            'physical',
            'political',
            'practical',
            'professional',
          ],
          correctAnswer: 'personal',
        },
        {
          id: 'blank2',
          position: 2,
          options: ['provides', 'prevents', 'produces', 'protects', 'promotes'],
          correctAnswer: 'provides',
        },
        {
          id: 'blank3',
          position: 3,
          options: ['problem', 'process', 'project', 'product', 'program'],
          correctAnswer: 'problem',
        },
        {
          id: 'blank4',
          position: 4,
          options: [
            'workforce',
            'workplace',
            'workshop',
            'workload',
            'workflow',
          ],
          correctAnswer: 'workforce',
        },
      ],
      timeLimit: 120,
    },
  },
  {
    id: 'mcma_r_001',
    type: PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING,
    title: 'Multiple Choice (Multiple Answers) - Reading',
    instructions:
      'Read the text and answer the question by selecting all the correct responses. You will need to select more than one response.',
    content: {
      text: 'The Internet of Things (IoT) refers to the network of physical devices, vehicles, home appliances, and other items embedded with electronics, software, sensors, actuators, and connectivity which enables these objects to connect and exchange data. IoT allows objects to be sensed or controlled remotely across existing network infrastructure, creating opportunities for more direct integration of the physical world into computer-based systems, and resulting in improved efficiency, accuracy and economic benefit in addition to reduced human intervention.',
      options: [
        {
          id: 'a',
          text: 'IoT devices can be controlled remotely',
          isCorrect: true,
        },
        {
          id: 'b',
          text: 'IoT reduces the need for human intervention',
          isCorrect: true,
        },
        {
          id: 'c',
          text: 'IoT only works with new network infrastructure',
          isCorrect: false,
        },
        {
          id: 'd',
          text: 'IoT improves efficiency and accuracy',
          isCorrect: true,
        },
        {
          id: 'e',
          text: 'IoT is limited to home appliances only',
          isCorrect: false,
        },
      ],
      timeLimit: 90,
    },
  },
  {
    id: 'rop_001',
    type: PteQuestionTypeName.RE_ORDER_PARAGRAPHS,
    title: 'Re-order Paragraphs - Scientific Method',
    instructions:
      'The text boxes in the left panel have been placed in a random order. Restore the original order by dragging the text boxes from the left panel to the right panel.',
    content: {
      paragraphs: [
        {
          id: 'p1',
          text: 'The scientific method is a systematic approach to understanding the natural world through observation and experimentation.',
          order: 1,
        },
        {
          id: 'p2',
          text: 'Scientists then formulate hypotheses, which are testable explanations for the observed phenomena.',
          order: 3,
        },
        {
          id: 'p3',
          text: 'It begins with careful observation of natural phenomena and the identification of patterns or problems.',
          order: 2,
        },
        {
          id: 'p4',
          text: 'These hypotheses are tested through controlled experiments designed to either support or refute the proposed explanations.',
          order: 4,
        },
        {
          id: 'p5',
          text: 'Finally, the results are analyzed and conclusions are drawn, which may lead to the development of scientific theories.',
          order: 5,
        },
      ],
      timeLimit: 150,
    },
  },
  {
    id: 'rfib_001',
    type: PteQuestionTypeName.READING_FILL_IN_THE_BLANKS,
    title: 'Reading Fill in the Blanks - Marine Biology',
    instructions:
      'Below is a text with blanks. Click on each blank, a list of choices will appear. Select the appropriate answer choice for each blank.',
    content: {
      text: 'Marine ecosystems are among the most _____ environments on Earth, supporting an incredible diversity of life forms. Coral reefs, often called the rainforests of the sea, are particularly _____ ecosystems that provide habitat for numerous species. However, these delicate environments face _____ threats from climate change, pollution, and overfishing. Ocean acidification, caused by increased carbon dioxide absorption, poses a significant _____ to marine life, particularly organisms with calcium carbonate shells.',
      blanks: [
        {
          id: 'blank1',
          position: 1,
          options: ['complex', 'simple', 'empty', 'dry', 'diverse'],
          correctAnswer: 'complex',
        },
        {
          id: 'blank2',
          position: 2,
          options: ['barren', 'productive', 'isolated', 'frozen', 'dangerous'],
          correctAnswer: 'productive',
        },
        {
          id: 'blank3',
          position: 3,
          options: ['minor', 'ancient', 'serious', 'imaginary', 'temporary'],
          correctAnswer: 'serious',
        },
        {
          id: 'blank4',
          position: 4,
          options: [
            'benefit',
            'challenge',
            'solution',
            'opportunity',
            'advantage',
          ],
          correctAnswer: 'challenge',
        },
      ],
      timeLimit: 90,
    },
  },
  {
    id: 'mcsa_r_001',
    type: PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_READING,
    title: 'Multiple Choice (Single Answer) - Reading',
    instructions:
      'Read the text and answer the multiple-choice question by selecting the correct response. Only one response is correct.',
    content: {
      text: 'Artificial intelligence has made significant strides in recent years, with applications ranging from voice assistants to autonomous vehicles. Machine learning algorithms can now process vast amounts of data and identify patterns that would be impossible for humans to detect. However, concerns about job displacement and privacy have emerged as AI becomes more prevalent in society. Experts argue that while AI will automate certain tasks, it will also create new opportunities and require humans to develop different skills.',
      options: [
        {
          id: 'a',
          text: 'AI will completely replace human workers in all industries',
          isCorrect: false,
        },
        {
          id: 'b',
          text: 'AI can process data and identify patterns better than humans',
          isCorrect: true,
        },
        {
          id: 'c',
          text: 'AI has no impact on privacy concerns',
          isCorrect: false,
        },
        {
          id: 'd',
          text: 'AI applications are limited to voice assistants only',
          isCorrect: false,
        },
      ],
      timeLimit: 60,
    },
  },

  // Listening Questions
  {
    id: 'sst_001',
    type: PteQuestionTypeName.SUMMARIZE_SPOKEN_TEXT,
    title: 'Summarize Spoken Text - Psychology',
    instructions:
      'You will hear a lecture. Write a summary for a fellow student who was not present at the lecture. You should write 50-70 words. You have 10 minutes to finish this task.',
    content: {
      audioUrl: '/audio/summarize-spoken-1.mp3',
      wordLimit: { min: 50, max: 70 },
      timeLimit: 600,
    },
  },
  {
    id: 'mcma_l_001',
    type: PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING,
    title: 'Multiple Choice (Multiple Answers) - Listening',
    instructions:
      'Listen to the recording and answer the question by selecting all the correct responses. You will need to select more than one response.',
    content: {
      audioUrl: '/audio/mcma-listening-1.mp3',
      options: [
        {
          id: 'a',
          text: 'The speaker mentions environmental benefits',
          isCorrect: true,
        },
        {
          id: 'b',
          text: 'Cost reduction is discussed as an advantage',
          isCorrect: true,
        },
        {
          id: 'c',
          text: 'The technology is only suitable for large companies',
          isCorrect: false,
        },
        {
          id: 'd',
          text: 'Implementation challenges are acknowledged',
          isCorrect: true,
        },
        {
          id: 'e',
          text: 'The speaker recommends immediate adoption',
          isCorrect: false,
        },
      ],
      timeLimit: 90,
    },
  },
  {
    id: 'lfib_001',
    type: PteQuestionTypeName.LISTENING_FILL_IN_THE_BLANKS,
    title: 'Listening Fill in the Blanks - History',
    instructions:
      'You will hear a recording. Listen carefully and select the missing words from the dropdown menus.',
    content: {
      audioUrl: '/audio/listening-fib-1.mp3',
      text: 'The Industrial Revolution began in Britain during the _____ century and marked a major turning point in human history. It was characterized by the transition from _____ production methods to mechanized manufacturing. The invention of the _____ engine was particularly significant, as it provided a new source of power for factories and transportation. This period saw rapid _____ growth and significant social changes.',
      blanks: [
        {
          id: 'blank1',
          position: 1,
          options: [
            'eighteenth',
            'nineteenth',
            'seventeenth',
            'twentieth',
            'sixteenth',
          ],
          correctAnswer: 'eighteenth',
        },
        {
          id: 'blank2',
          position: 2,
          options: [
            'manual',
            'automatic',
            'mechanical',
            'digital',
            'traditional',
          ],
          correctAnswer: 'manual',
        },
        {
          id: 'blank3',
          position: 3,
          options: ['steam', 'water', 'wind', 'electric', 'solar'],
          correctAnswer: 'steam',
        },
        {
          id: 'blank4',
          position: 4,
          options: [
            'economic',
            'social',
            'political',
            'cultural',
            'technological',
          ],
          correctAnswer: 'economic',
        },
      ],
      timeLimit: 120,
    },
  },
  {
    id: 'hcs_001',
    type: PteQuestionTypeName.HIGHLIGHT_CORRECT_SUMMARY,
    title: 'Highlight Correct Summary - Economics',
    instructions:
      'You will hear a recording. Click on the paragraph that best relates to the recording.',
    content: {
      audioUrl: '/audio/highlight-summary-1.mp3',
      options: [
        {
          id: 'a',
          text: 'The recording discusses the benefits of free trade and its positive impact on global economic growth, emphasizing how it creates opportunities for developing countries.',
          isCorrect: false,
        },
        {
          id: 'b',
          text: 'The speaker explains the concept of supply and demand, highlighting how market forces determine prices and influence consumer behavior in competitive markets.',
          isCorrect: true,
        },
        {
          id: 'c',
          text: 'The lecture focuses on monetary policy and the role of central banks in controlling inflation through interest rate adjustments and money supply management.',
          isCorrect: false,
        },
        {
          id: 'd',
          text: 'The recording examines the causes and effects of economic recessions, discussing how governments can implement fiscal policies to stimulate economic recovery.',
          isCorrect: false,
        },
      ],
      timeLimit: 60,
    },
  },
  {
    id: 'mcsa_l_001',
    type: PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING,
    title: 'Multiple Choice (Single Answer) - Listening',
    instructions:
      'Listen to the recording and answer the multiple-choice question by selecting the correct response. Only one response is correct.',
    content: {
      audioUrl: '/audio/mcsa-listening-1.mp3',
      options: [
        {
          id: 'a',
          text: 'The main topic is climate change adaptation strategies',
          isCorrect: false,
        },
        {
          id: 'b',
          text: 'The speaker focuses on renewable energy technologies',
          isCorrect: true,
        },
        {
          id: 'c',
          text: 'The discussion centers on urban planning principles',
          isCorrect: false,
        },
        {
          id: 'd',
          text: 'The lecture is about sustainable agriculture practices',
          isCorrect: false,
        },
      ],
      timeLimit: 60,
    },
  },
  {
    id: 'smw_001',
    type: PteQuestionTypeName.SELECT_MISSING_WORD,
    title: 'Select Missing Word - Literature',
    instructions:
      'You will hear a recording about a topic. At the end of the recording the last word or group of words has been replaced by a beep. Select the correct option to complete the recording.',
    content: {
      audioUrl: '/audio/select-missing-word-1.mp3',
      options: [
        { id: 'a', text: 'symbolism', isCorrect: true },
        { id: 'b', text: 'realism', isCorrect: false },
        { id: 'c', text: 'romanticism', isCorrect: false },
        { id: 'd', text: 'modernism', isCorrect: false },
      ],
      timeLimit: 30,
    },
  },
  {
    id: 'hiw_001',
    type: PteQuestionTypeName.HIGHLIGHT_INCORRECT_WORDS,
    title: 'Highlight Incorrect Words - Science',
    instructions:
      'You will hear a recording. Below is a transcription of the recording. Some words in the transcription differ from what the speaker said. Please click on the words that are different.',
    content: {
      audioUrl: '/audio/highlight-incorrect-1.mp3',
      text: 'Photosynthesis is the process by which green plants and some bacteria convert light energy, usually from the sun, into chemical energy stored in glucose. This process occurs in the chloroplasts of plant cells and requires carbon dioxide from the air and water from the soil. The overall equation for photosynthesis shows that six molecules of carbon dioxide and six molecules of water, in the presence of light energy, produce one molecule of glucose and six molecules of oxygen.',
      timeLimit: 90,
    },
  },
  {
    id: 'wfd_001',
    type: PteQuestionTypeName.WRITE_FROM_DICTATION,
    title: 'Write from Dictation - Academic',
    instructions:
      'You will hear a sentence. Type the sentence in the box below exactly as you hear it. Write as much of the sentence as you can. You will hear the sentence only once.',
    content: {
      audioUrl: '/audio/write-dictation-1.mp3',
      text: 'The university library provides access to extensive digital resources and research databases.',
      timeLimit: 90,
    },
  },
];

export const getQuestionsByType = (
  type: PteQuestionTypeName
): MockQuestion[] => {
  return mockQuestions.filter((q) => q.type === type);
};

export const getQuestionById = (id: string): MockQuestion | undefined => {
  return mockQuestions.find((q) => q.id === id);
};

// Convert MockQuestion to Question format for tests
const convertMockQuestionToQuestion = (
  mockQuestion: MockQuestion,
  testId: string,
  orderInTest: number
): Question => {
  return {
    id: mockQuestion.id,
    questionCode: mockQuestion.id.toUpperCase(),
    questionTypeId: mockQuestion.type,
    testId,
    orderInTest,
    difficultyLevel: 'MEDIUM' as const,
    textContent: mockQuestion.content.text,
    audioUrl: mockQuestion.content.audioUrl,
    imageUrl: mockQuestion.content.imageUrl,
    options: mockQuestion.content.options,
    correctAnswers: mockQuestion.content.options?.filter(
      (opt) => opt.isCorrect
    ),
    wordCountMin: mockQuestion.content.wordLimit?.min,
    wordCountMax: mockQuestion.content.wordLimit?.max,
    durationMillis: (mockQuestion.content.timeLimit || 60) * 1000,
  };
};

// Mock Tests Data
export const mockTests: Test[] = [
  {
    id: 'free_test_1',
    title: 'PTE Academic Practice Test 1 (Free)',
    description:
      'A comprehensive free practice test covering all PTE Academic question types. Perfect for getting familiar with the test format.',
    testType: 'ACADEMIC',
    totalDuration: 120,
    isFree: true,
    questions: [
      convertMockQuestionToQuestion(mockQuestions[0], 'free_test_1', 1), // READ_ALOUD
      convertMockQuestionToQuestion(mockQuestions[1], 'free_test_1', 2), // REPEAT_SENTENCE
      convertMockQuestionToQuestion(mockQuestions[2], 'free_test_1', 3), // DESCRIBE_IMAGE
      convertMockQuestionToQuestion(mockQuestions[3], 'free_test_1', 4), // RE_TELL_LECTURE
      convertMockQuestionToQuestion(mockQuestions[4], 'free_test_1', 5), // ANSWER_SHORT_QUESTION
      convertMockQuestionToQuestion(mockQuestions[5], 'free_test_1', 6), // SUMMARIZE_WRITTEN_TEXT
      convertMockQuestionToQuestion(mockQuestions[6], 'free_test_1', 7), // WRITE_ESSAY
      convertMockQuestionToQuestion(mockQuestions[7], 'free_test_1', 8), // FILL_IN_THE_BLANKS_DRAG_AND_DROP
    ],
  },
  {
    id: 'free_test_2',
    title: 'PTE Academic Practice Test 2 (Free)',
    description:
      'Another free practice test with different questions to help you practice various PTE Academic skills.',
    testType: 'ACADEMIC',
    totalDuration: 120,
    isFree: true,
    questions: [
      convertMockQuestionToQuestion(mockQuestions[8], 'free_test_2', 1), // MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING
      convertMockQuestionToQuestion(mockQuestions[9], 'free_test_2', 2), // RE_ORDER_PARAGRAPHS
      convertMockQuestionToQuestion(mockQuestions[10], 'free_test_2', 3), // READING_FILL_IN_THE_BLANKS
      convertMockQuestionToQuestion(mockQuestions[11], 'free_test_2', 4), // MULTIPLE_CHOICE_SINGLE_ANSWER_READING
      convertMockQuestionToQuestion(mockQuestions[12], 'free_test_2', 5), // SUMMARIZE_SPOKEN_TEXT
      convertMockQuestionToQuestion(mockQuestions[13], 'free_test_2', 6), // MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING
      convertMockQuestionToQuestion(mockQuestions[14], 'free_test_2', 7), // LISTENING_FILL_IN_THE_BLANKS
      convertMockQuestionToQuestion(mockQuestions[15], 'free_test_2', 8), // HIGHLIGHT_CORRECT_SUMMARY
    ],
  },
  {
    id: 'premium_test_1',
    title: 'PTE Academic Premium Test 1',
    description:
      'Advanced practice test with detailed analytics and AI-powered feedback. Includes all question types with varying difficulty levels.',
    testType: 'ACADEMIC',
    totalDuration: 180,
    isFree: false,
    questions: [
      convertMockQuestionToQuestion(mockQuestions[0], 'premium_test_1', 1),
      convertMockQuestionToQuestion(mockQuestions[1], 'premium_test_1', 2),
      convertMockQuestionToQuestion(mockQuestions[2], 'premium_test_1', 3),
      convertMockQuestionToQuestion(mockQuestions[3], 'premium_test_1', 4),
      convertMockQuestionToQuestion(mockQuestions[4], 'premium_test_1', 5),
      convertMockQuestionToQuestion(mockQuestions[5], 'premium_test_1', 6),
      convertMockQuestionToQuestion(mockQuestions[6], 'premium_test_1', 7),
      convertMockQuestionToQuestion(mockQuestions[7], 'premium_test_1', 8),
      convertMockQuestionToQuestion(mockQuestions[8], 'premium_test_1', 9),
      convertMockQuestionToQuestion(mockQuestions[9], 'premium_test_1', 10),
    ],
  },
  {
    id: 'premium_test_2',
    title: 'PTE Academic Premium Test 2',
    description:
      'Comprehensive premium test with advanced question patterns and detailed performance analysis.',
    testType: 'ACADEMIC',
    totalDuration: 180,
    isFree: false,
    questions: [
      convertMockQuestionToQuestion(mockQuestions[10], 'premium_test_2', 1),
      convertMockQuestionToQuestion(mockQuestions[11], 'premium_test_2', 2),
      convertMockQuestionToQuestion(mockQuestions[12], 'premium_test_2', 3),
      convertMockQuestionToQuestion(mockQuestions[13], 'premium_test_2', 4),
      convertMockQuestionToQuestion(mockQuestions[14], 'premium_test_2', 5),
      convertMockQuestionToQuestion(mockQuestions[15], 'premium_test_2', 6),
      convertMockQuestionToQuestion(mockQuestions[0], 'premium_test_2', 7),
      convertMockQuestionToQuestion(mockQuestions[1], 'premium_test_2', 8),
    ],
  },
  {
    id: 'premium_test_3',
    title: 'PTE Academic Premium Test 3',
    description:
      'Expert-level practice test designed for high scorers. Features challenging questions and comprehensive feedback.',
    testType: 'ACADEMIC',
    totalDuration: 180,
    isFree: false,
    questions: [
      convertMockQuestionToQuestion(mockQuestions[2], 'premium_test_3', 1),
      convertMockQuestionToQuestion(mockQuestions[3], 'premium_test_3', 2),
      convertMockQuestionToQuestion(mockQuestions[4], 'premium_test_3', 3),
      convertMockQuestionToQuestion(mockQuestions[5], 'premium_test_3', 4),
      convertMockQuestionToQuestion(mockQuestions[6], 'premium_test_3', 5),
      convertMockQuestionToQuestion(mockQuestions[7], 'premium_test_3', 6),
    ],
  },
];
