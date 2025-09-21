import { publicApi } from './api';
import { PteQuestionTypeName } from '../types/pte';

export interface PracticeQuestion {
  id: string;
  type: PteQuestionTypeName;
  difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD';
  title: string;
  instructions: string;
  content: {
    text?: string;
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
  hasUserResponses?: boolean;
  lastAttemptedAt?: string;
  bestScore?: number;
}

export interface QuestionTypeInfo {
  id: string;
  name: string;
  description?: string;
  expectedTimePerQuestion?: number;
  questionCount: number;
}

export interface PteSection {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
}

export interface QuestionTypesResponse {
  questionTypes: Array<
    QuestionTypeInfo & {
      pteSection: PteSection;
    }
  >;
  groupedBySection: {
    [sectionName: string]: {
      section: PteSection;
      questionTypes: QuestionTypeInfo[];
    };
  };
}

export interface PracticeQuestionsResponse {
  questions: PracticeQuestion[];
  questionType: QuestionTypeInfo & {
    pteSection: PteSection;
  };
  total: number;
}

export interface QuestionListResponse {
  questions: Array<{
    id: string;
    questionCode: string;
    difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD';
    hasUserResponses: boolean;
    lastAttemptedAt?: string;
    bestScore?: number;
    createdAt: string;
  }>;
  total: number;
}

export interface QuestionResponsesResponse {
  question: {
    id: string;
    questionCode: string;
    questionType: PteQuestionTypeName;
    difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD';
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
  };
  responses: Array<{
    id: string;
    score: number;
    isCorrect: boolean;
    aiFeedback?: string;
    detailedAnalysis?: any;
    suggestions: string[];
    timeTakenSeconds: number;
    createdAt: string;
    transcribedText?: string;
  }>;
  total: number;
}
/**
 * Get all question types for portal practice
 */
export const getQuestionTypes = async (): Promise<QuestionTypesResponse> => {
  const response = await publicApi.get('/user/question-types');
  return response.data.data;
};

/**
 * Get practice questions by question type
 */
export const getPracticeQuestions = async (
  questionType: PteQuestionTypeName,
  options: {
    limit?: number;
    random?: boolean;
    difficultyLevel?: 'EASY' | 'MEDIUM' | 'HARD';
    practiceStatus?: 'practiced' | 'unpracticed' | 'all';
  } = {}
): Promise<PracticeQuestionsResponse> => {
  const {
    limit = 10,
    random = true,
    difficultyLevel,
    practiceStatus,
  } = options;

  const params = new URLSearchParams({
    limit: limit.toString(),
    random: random.toString(),
  });

  if (difficultyLevel) {
    params.append('difficultyLevel', difficultyLevel);
  }

  if (practiceStatus && practiceStatus !== 'all') {
    params.append('practiceStatus', practiceStatus);
  }
  const response = await publicApi.get(
    `/user/practice-questions/${questionType}?${params}`
  );
  return response.data.data;
};

/**
 * Get list of questions for a question type (for sidebar)
 */
export const getQuestionList = async (
  questionType: PteQuestionTypeName,
  options: {
    difficultyLevel?: 'EASY' | 'MEDIUM' | 'HARD';
    practiceStatus?: 'practiced' | 'unpracticed' | 'all';
  } = {}
): Promise<QuestionListResponse> => {
  const { difficultyLevel, practiceStatus } = options;

  const params = new URLSearchParams();

  if (difficultyLevel) {
    params.append('difficultyLevel', difficultyLevel);
  }

  if (practiceStatus && practiceStatus !== 'all') {
    params.append('practiceStatus', practiceStatus);
  }

  const response = await publicApi.get(
    `/user/question-list/${questionType}?${params}`
  );
  return response.data.data;
};

/**
 * Get specific question with user responses
 */
export const getQuestionWithResponses = async (
  questionId: string
): Promise<QuestionResponsesResponse> => {
  const response = await publicApi.get(
    `/user/questions/${questionId}/responses`
  );
  return response.data.data;
};
/**
 * Submit practice question response (for future implementation)
 */
export const submitPracticeResponse = async (
  questionId: string,
  response: any
): Promise<any> => {
  // This would be implemented when you add response tracking
  console.log('Practice response submitted:', { questionId, response });
  return { success: true, message: 'Response recorded' };
};
