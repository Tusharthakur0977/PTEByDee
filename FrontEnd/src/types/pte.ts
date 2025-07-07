// PTE Test Portal Types
export interface PteSection {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
}

export interface QuestionType {
  id: string;
  name: string;
  description?: string;
  pteSectionId: string;
  expectedTimePerQuestion?: number;
}

export interface Question {
  id: string;
  questionCode: string;
  questionTypeId: string;
  testId: string;
  orderInTest: number;
  textContent?: string;
  audioUrl?: string;
  imageUrl?: string;
  options?: any;
  correctAnswers?: any;
  wordCountMin?: number;
  wordCountMax?: number;
  durationMillis?: number;
  originalTextWithErrors?: string;
  incorrectWords?: any;
}

export interface Test {
  id: string;
  title: string;
  description?: string;
  testType: string;
  totalDuration: number;
  isFree: boolean;
  questions: Question[];
}

export interface TestAttempt {
  id: string;
  userId: string;
  testId: string;
  startedAt: string;
  completedAt?: string;
  overallScore?: number;
  speakingScore?: number;
  writingScore?: number;
  readingScore?: number;
  listeningScore?: number;
  grammarScore?: number;
  oralFluencyScore?: number;
  pronunciationScore?: number;
  vocabularyScore?: number;
  discourseScore?: number;
  spellingScore?: number;
  status: string;
  timeTakenSeconds?: number;
}

export interface UserResponse {
  id: string;
  testAttemptId: string;
  questionId: string;
  textResponse?: string;
  audioResponseUrl?: string;
  selectedOptions?: string[];
  orderedItems?: string[];
  highlightedWords?: string[];
  questionScore?: number;
  isCorrect?: boolean;
  aiFeedback?: string;
  timeTakenSeconds?: number;
}

export interface AIReport {
  id: string;
  testAttemptId: string;
  overallSummary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  grammarScore?: number;
  oralFluencyScore?: number;
  pronunciationScore?: number;
  vocabularyScore?: number;
  discourseScore?: number;
  spellingScore?: number;
  sectionWiseFeedback?: any;
}

// Question Type Names Enum
export enum PteQuestionTypeName {
  // Speaking
  READ_ALOUD = 'READ_ALOUD',
  REPEAT_SENTENCE = 'REPEAT_SENTENCE',
  DESCRIBE_IMAGE = 'DESCRIBE_IMAGE',
  RE_TELL_LECTURE = 'RE_TELL_LECTURE',
  ANSWER_SHORT_QUESTION = 'ANSWER_SHORT_QUESTION',

  // Writing
  SUMMARIZE_WRITTEN_TEXT = 'SUMMARIZE_WRITTEN_TEXT',
  WRITE_ESSAY = 'WRITE_ESSAY',

  // Reading
  READING_WRITING_FILL_IN_THE_BLANKS = 'READING_WRITING_FILL_IN_THE_BLANKS',
  MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING = 'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING',
  RE_ORDER_PARAGRAPHS = 'RE_ORDER_PARAGRAPHS',
  READING_FILL_IN_THE_BLANKS = 'READING_FILL_IN_THE_BLANKS',
  MULTIPLE_CHOICE_SINGLE_ANSWER_READING = 'MULTIPLE_CHOICE_SINGLE_ANSWER_READING',

  // Listening
  SUMMARIZE_SPOKEN_TEXT = 'SUMMARIZE_SPOKEN_TEXT',
  MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING = 'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING',
  LISTENING_FILL_IN_THE_BLANKS = 'LISTENING_FILL_IN_THE_BLANKS',
  HIGHLIGHT_CORRECT_SUMMARY = 'HIGHLIGHT_CORRECT_SUMMARY',
  MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING = 'MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING',
  SELECT_MISSING_WORD = 'SELECT_MISSING_WORD',
  HIGHLIGHT_INCORRECT_WORDS = 'HIGHLIGHT_INCORRECT_WORDS',
  WRITE_FROM_DICTATION = 'WRITE_FROM_DICTATION',
}
