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
