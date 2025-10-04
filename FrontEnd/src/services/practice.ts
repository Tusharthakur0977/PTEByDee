import api from './api';
import { PteQuestionTypeName } from '../types/pte';

export interface PracticeResponse {
  id: string;
  questionId: string;
  questionCode: string;
  questionType: PteQuestionTypeName;
  questionTypeName: string;
  sectionName: string;
  userResponse: any;
  correctAnswer: any;
  isCorrect: boolean;
  score: number;
  timeTakenSeconds: number;
  createdAt: string;
  sessionDate: string;
  questionPreview: {
    textContent?: string;
    hasAudio: boolean;
    hasImage: boolean;
  };
}

export interface PracticeSession {
  id: string;
  sessionDate: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  timeSpent: number;
  createdAt: string;
}

export interface PracticeStats {
  overall: {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    totalSessions: number;
    totalTimeSpent: number;
    averageTimePerQuestion: number;
    practiceStreak: number;
  };
  today: {
    questionsAnswered: number;
    correctAnswers: number;
    timeSpent: number;
    accuracy: number;
  };
  byQuestionType: Array<{
    questionType: PteQuestionTypeName;
    questionTypeName: string;
    totalQuestions: number;
    totalTime: number;
    totalScore: number;
    averageScore: number;
  }>;
  bySection: Array<{
    sectionName: string;
    totalQuestions: number;
    correctAnswers: number;
    totalTime: number;
    totalScore: number;
    averageScore: number;
    accuracy: number;
  }>;
  recentSessions: PracticeSession[];
}

export interface PracticeHistoryFilters {
  page?: number;
  limit?: number;
  questionType?: PteQuestionTypeName;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PracticeHistoryResponse {
  responses: PracticeResponse[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResponses: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
  filters: {
    questionType: string;
    dateFrom: string;
    dateTo: string;
    sortBy: string;
    sortOrder: string;
  };
}

/**
 * Submit practice question response
 */
export const submitPracticeResponse = async (data: {
  questionId: string;
  questionType: PteQuestionTypeName;
  response: any;
  timeTaken?: number;
  isCorrect?: boolean;
  score?: number;
}) => {
  const response = await api.post('/user/practice/submit-response', data);
  return response.data;
};

/**
 * Get practice history with filtering
 */
export const getPracticeHistory = async (
  filters: PracticeHistoryFilters = {}
): Promise<PracticeHistoryResponse> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });

  const response = await api.get(`/user/practice/history?${params}`);
  return response.data.data;
};

/**
 * Get practice statistics
 */
export const getPracticeStats = async (): Promise<PracticeStats> => {
  const response = await api.get('/user/practice/stats');
  return response.data.data;
};

/**
 * Calculate score for different question types
 */
export const calculateQuestionScore = (
  questionType: PteQuestionTypeName,
  userResponse: any,
  correctAnswer: any
): { isCorrect: boolean; score: number } => {
  switch (questionType) {
    case PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_READING:
    case PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING:
      return {
        isCorrect: userResponse.selectedOption === correctAnswer[0],
        score: userResponse.selectedOption === correctAnswer[0] ? 1 : 0,
      };

    case PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING:
    case PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING: {
      const selectedOptions = userResponse.selectedOptions || [];
      const correctOptions = correctAnswer || [];
      const correctSelected = selectedOptions.filter((option: string) =>
        correctOptions.includes(option)
      ).length;
      const incorrectSelected = selectedOptions.filter(
        (option: string) => !correctOptions.includes(option)
      ).length;
      const score =
        Math.max(0, correctSelected - incorrectSelected) /
        correctOptions.length;
      return {
        isCorrect: score === 1,
        score,
      };
    }
    case PteQuestionTypeName.RE_ORDER_PARAGRAPHS: {
      const userOrder = userResponse.orderedParagraphs || [];
      const correctOrder = correctAnswer || [];
      let correctPairs = 0;
      for (let i = 0; i < userOrder.length - 1; i++) {
        const currentIndex = correctOrder.indexOf(userOrder[i]);
        const nextIndex = correctOrder.indexOf(userOrder[i + 1]);
        if (
          currentIndex !== -1 &&
          nextIndex !== -1 &&
          nextIndex === currentIndex + 1
        ) {
          correctPairs++;
        }
      }
      const maxPairs = Math.max(0, correctOrder.length - 1);
      const pairScore = maxPairs > 0 ? correctPairs / maxPairs : 0;
      return {
        isCorrect: pairScore === 1,
        score: pairScore,
      };
    }
    case PteQuestionTypeName.READING_FILL_IN_THE_BLANKS:
    case PteQuestionTypeName.FILL_IN_THE_BLANKS_DRAG_AND_DROP:
    case PteQuestionTypeName.LISTENING_FILL_IN_THE_BLANKS: {
      const userBlanks = userResponse.blanks || {};
      let correctBlanks = correctAnswer || {};

      // If correctAnswer is structured as blanks array, convert it
      if (Array.isArray(correctAnswer)) {
        correctBlanks = {};
        correctAnswer.forEach((blank: any) => {
          correctBlanks[`blank${blank.position}`] = blank.correctAnswer;
        });
      }

      let correctCount = 0;
      let totalBlanks = 0;

      Object.keys(correctBlanks).forEach((blankKey) => {
        totalBlanks++;
        if (
          userBlanks[blankKey]?.toLowerCase() ===
          correctBlanks[blankKey]?.toLowerCase()
        ) {
          correctCount++;
        }
      });

      const blankScore = totalBlanks > 0 ? correctCount / totalBlanks : 0;
      return {
        isCorrect: blankScore === 1,
        score: blankScore,
      };
    }
    case PteQuestionTypeName.HIGHLIGHT_INCORRECT_WORDS: {
      const highlightedWords = userResponse.highlightedWords || [];
      const incorrectWords = correctAnswer || [];
      const correctHighlights = highlightedWords.filter((word: string) =>
        incorrectWords.includes(word)
      ).length;
      const incorrectHighlights = highlightedWords.filter(
        (word: string) => !incorrectWords.includes(word)
      ).length;
      const highlightScore =
        Math.max(0, correctHighlights - incorrectHighlights) /
        incorrectWords.length;
      return {
        isCorrect: highlightScore === 1,
        score: highlightScore,
      };
    }
    case PteQuestionTypeName.WRITE_FROM_DICTATION: {
      const userText = userResponse.text?.toLowerCase().trim() || '';
      const correctText = correctAnswer?.toLowerCase().trim() || '';
      const similarity = calculateTextSimilarity(userText, correctText);
      return {
        isCorrect: similarity >= 0.8,
        score: similarity,
      };
    }

    default:
      // For other question types, return neutral score
      return {
        isCorrect: false,
        score: 0,
      };
  }
};

/**
 * Calculate text similarity (simple word-based comparison)
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.split(/\s+/).filter((word) => word.length > 0);
  const words2 = text2.split(/\s+/).filter((word) => word.length > 0);

  if (words1.length === 0 && words2.length === 0) return 1;
  if (words1.length === 0 || words2.length === 0) return 0;

  const matchingWords = words1.filter((word) => words2.includes(word)).length;
  const totalWords = Math.max(words1.length, words2.length);

  return matchingWords / totalWords;
}
