import { publicApi } from './api';
import { PteQuestionTypeName } from '../types/pte';

export interface PracticeQuestion {
  id: string;
  type: PteQuestionTypeName;
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
  } = {}
): Promise<PracticeQuestionsResponse> => {
  const { limit = 10, random = true } = options;

  const params = new URLSearchParams({
    limit: limit.toString(),
    random: random.toString(),
  });

  const response = await publicApi.get(
    `/user/practice-questions/${questionType}?${params}`
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
