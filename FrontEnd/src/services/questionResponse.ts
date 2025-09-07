import api from './api';

export interface QuestionResponseData {
  questionId: string;
  userResponse: {
    textResponse?: string;
    audioResponseUrl?: string;
    selectedOptions?: string[];
    orderedItems?: string[];
    highlightedWords?: string[];
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
}

/**
 * Submit question response for evaluation
 */
export const submitQuestionResponse = async (
  data: QuestionResponseData
): Promise<QuestionResponseResult> => {
  const response = await api.post('/user/questions/submit-response', data);
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
