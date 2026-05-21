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
    questionStatement?: string;
  } | any;
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
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextPage: number | null;
    prevPage: number | null;
  };
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

const practiceQuestionsRequestCache = new Map<
  string,
  Promise<PracticeQuestionsResponse>
>();

const buildPracticeQuestionsCacheKey = (
  questionType: PteQuestionTypeName,
  options: {
    limit?: number;
    random?: boolean;
    difficultyLevel?: 'EASY' | 'MEDIUM' | 'HARD';
    practiceStatus?: 'practiced' | 'unpracticed' | 'all';
    imageType?: string;
    skip?: number;
  } = {},
) => {
  const normalizedOptions = {
    limit: options.limit ?? 10,
    random: options.random ?? true,
    difficultyLevel: options.difficultyLevel ?? '',
    practiceStatus: options.practiceStatus ?? '',
    imageType: options.imageType ?? '',
    skip: options.skip ?? 0,
  };

  return `${questionType}:${JSON.stringify(normalizedOptions)}`;
};
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
    imageType?: string;
    skip?: number;
  } = {}
): Promise<PracticeQuestionsResponse> => {
  const {
    limit = 10,
    random = true,
    difficultyLevel,
    practiceStatus,
    imageType,
    skip = 0,
  } = options;

  let specificQuestion: any = null;
  const activeQuestionId = sessionStorage.getItem('activeQuestionId');
  if (activeQuestionId) {
    try {
      specificQuestion = await getPracticeQuestionById(activeQuestionId);
      if (specificQuestion && specificQuestion.type !== questionType) {
        specificQuestion = null;
      }
    } catch (e) {
      console.error('Error fetching specific question:', e);
    } finally {
      sessionStorage.removeItem('activeQuestionId');
    }
  }

  const cacheKey = buildPracticeQuestionsCacheKey(questionType, {
    limit,
    random,
    difficultyLevel,
    practiceStatus,
    imageType,
  });

  if (!activeQuestionId) {
    const cachedRequest = practiceQuestionsRequestCache.get(cacheKey);
    if (cachedRequest) {
      return cachedRequest;
    }
  }

  const params = new URLSearchParams({
    limit: limit.toString(),
    random: random.toString(),
    skip: skip.toString(),
  });

  if (difficultyLevel) {
    params.append('difficultyLevel', difficultyLevel);
  }

  if (practiceStatus && practiceStatus !== 'all') {
    params.append('practiceStatus', practiceStatus);
  }

  if (imageType && imageType !== 'all') {
    params.append('imageType', imageType);
  }

  const requestPromise = publicApi
    .get(`/user/practice-questions/${questionType}?${params}`)
    .then((response) => {
      const data = response.data.data;
      if (specificQuestion) {
        const filtered = data.questions.filter((q: any) => q.id !== specificQuestion.id);
        data.questions = [specificQuestion, ...filtered];
      }
      return data;
    })
    .finally(() => {
      practiceQuestionsRequestCache.delete(cacheKey);
    });

  if (!activeQuestionId) {
    practiceQuestionsRequestCache.set(cacheKey, requestPromise);
  }
  return requestPromise;
};

/**
 * Get list of questions for a question type (for sidebar)
 */
export const getQuestionList = async (
  questionType: PteQuestionTypeName,
  options: {
    difficultyLevel?: 'EASY' | 'MEDIUM' | 'HARD';
    practiceStatus?: 'practiced' | 'unpracticed' | 'all';
    searchTerm?: string;
  } = {}
): Promise<QuestionListResponse> => {
  const { difficultyLevel, practiceStatus, searchTerm } = options;

  const params = new URLSearchParams();

  if (difficultyLevel) {
    params.append('difficultyLevel', difficultyLevel);
  }

  if (practiceStatus && practiceStatus !== 'all') {
    params.append('practiceStatus', practiceStatus);
  }

  if (searchTerm && searchTerm.trim() !== '') {
    params.append('searchTerm', searchTerm.trim());
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
 * Get a single practice question by ID
 */
export const getPracticeQuestionById = async (
  questionId: string
): Promise<any> => {
  const response = await publicApi.get(
    `/user/questions/${questionId}/practice`
  );
  return response.data.data.question;
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

/**
 * Get predicted questions for the portal
 */
export const getPredictedQuestions = async (
  options: {
    predictionLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
    questionType?: string;
    limit?: number;
    page?: number;
  } = {}
): Promise<any> => {
  const { predictionLevel, questionType, limit = 100, page = 1 } = options;

  const params = new URLSearchParams({
    limit: limit.toString(),
    page: page.toString(),
  });

  if (predictionLevel) {
    params.append('predictionLevel', predictionLevel);
  }

  if (questionType) {
    params.append('questionType', questionType);
  }

  const response = await publicApi.get(
    `/user/predicted-questions?${params}`
  );
  return response.data.data;
};
