import api from './api';

export interface QuestionResponseData {
  questionId: string;
  userResponse: {
    textResponse?: string;
    audioResponseUrl?: string;
    selectedOption?: string;
    selectedOptions?: string[];
    selectedSummary?: string;
    selectedWord?: string;
    orderedParagraphs?: string[];
    orderedItems?: string[];
    highlightedWords?: string[];
    blanks?: { [key: string]: string };
    text?: string;
  };
  timeTakenSeconds?: number;
  testAttemptId?: string; // Optional: if part of a test
}

export interface QuestionEvaluation {
  score: number; // 0-100
  isCorrect: boolean;
  feedback: string;
  detailedAnalysis: any;
  suggestions: string[];
}

export interface PreviousResponse {
  id: string;
  textResponse?: string;
  audioResponseUrl?: string;
  selectedOptions: string[];
  orderedItems: string[];
  highlightedWords: string[];
  questionScore?: number;
  isCorrect?: boolean;
  aiFeedback?: string;
  detailedAnalysis?: any;
  timeTakenSeconds?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionResponseStats {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  averageScore: number;
  bestScore: number;
  averageTimeSeconds: number;
  firstAttemptDate?: string;
  lastAttemptDate?: string;
}

export interface PreviousResponsesResponse {
  question: {
    id: string;
    questionCode: string;
    questionType: string;
    sectionName: string;
  };
  responses: PreviousResponse[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResponses: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

export interface QuestionResponseResult {
  responseId: string;
  evaluation: QuestionEvaluation;
  question: {
    id: string;
    questionCode: string;
    questionType: string;
    sectionName: string;
  };
  timeTaken: number;
  transcribedText?: string; // For audio responses
}

/**
 * Submit question response for evaluation
 */
export const submitQuestionResponse = async (
  data: QuestionResponseData
): Promise<QuestionResponseResult> => {
  try {
    console.log('Submitting question response:', data);

    const response = await api.post('/user/questions/submit-response', data);

    console.log('Question response submitted successfully:', response.data);

    return response.data.data;
  } catch (error: any) {
    console.error('Error submitting question response:', error);

    // Provide user-friendly error messages
    if (error.response?.status === 401) {
      throw new Error('Please log in to submit responses.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data?.message || 'Invalid response data.');
    } else if (error.response?.status === 404) {
      throw new Error('Question not found.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(
        error.response?.data?.message || 'Failed to submit response.'
      );
    }
  }
};

/**
 * Get previous responses for a specific question
 */
export const getQuestionPreviousResponses = async (
  questionId: string,
  options?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
): Promise<PreviousResponsesResponse> => {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.sortBy) params.append('sortBy', options.sortBy);
  if (options?.sortOrder) params.append('sortOrder', options.sortOrder);

  const response = await api.get(
    `/user/questions/${questionId}/previous-responses?${params.toString()}`
  );
  return response.data.data;
};

/**
 * Get response statistics for a specific question
 */
export const getQuestionResponseStats = async (
  questionId: string
): Promise<QuestionResponseStats> => {
  const response = await api.get(
    `/user/questions/${questionId}/response-stats`
  );
  return response.data.data;
};

/**
 * Get question response by ID
 */
export const getQuestionResponse = async (responseId: string) => {
  const response = await api.get(`/user/questions/responses/${responseId}`);
  return response.data.data;
};

/**
 * Get user's responses for a specific question
 */
export const getUserResponsesForQuestion = async (questionId: string) => {
  const response = await api.get(`/user/questions/${questionId}/responses`);
  return response.data.data;
};
