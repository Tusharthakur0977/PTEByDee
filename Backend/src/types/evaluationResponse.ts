/**
 * Standardized Evaluation Response Schema
 * This ensures consistent evaluation structure across all PTE question types
 */

export interface StandardizedEvaluationResponse {
  // Core evaluation data (always present)
  score: number; // Overall score (0-100 scale for consistency)
  isCorrect: boolean; // Whether the response meets passing criteria
  feedback: string; // Main feedback message (always a string)

  // Detailed scoring breakdown
  scoring: {
    // Overall scoring info
    overall: {
      score: number; // Same as top-level score
      maxScore: number; // Maximum possible score (usually 100)
      percentage: number; // Percentage score (score/maxScore * 100)
      passingThreshold: number; // Minimum score needed to pass (usually 65)
    };

    // Component-specific scores (varies by question type)
    components?: {
      [componentName: string]: {
        score: number; // Actual score achieved
        maxScore: number; // Maximum possible for this component
        percentage: number; // Percentage for this component
        weight: number; // How much this component contributes to overall score
        description: string; // What this component measures
      };
    };

    // For questions with discrete correct/incorrect items
    itemAnalysis?: {
      totalItems: number; // Total number of items (blanks, options, etc.)
      correctItems: number; // Number of correct items
      incorrectItems: number; // Number of incorrect items
      accuracy: number; // Percentage accuracy (correctItems/totalItems * 100)
      itemDetails?: {
        [itemId: string]: {
          userAnswer: string;
          correctAnswer: string;
          isCorrect: boolean;
          explanation?: string;
        };
      };
    };
  };

  // Detailed analysis (question-type specific but structured)
  analysis: {
    // Common fields for all question types
    questionType: string;
    timeTaken: number; // Time taken in seconds
    wordCount?: number; // For text-based responses

    // Audio-specific analysis
    audioAnalysis?: {
      recognizedText: string;
      pronunciationScore: number;
      fluencyScore: number;
      contentAccuracy: number;
      wordByWordAnalysis?: Array<{
        word: string;
        isCorrect: boolean;
        pronunciation: 'correct' | 'incorrect' | 'unclear';
        timing: number;
      }>;
    };

    // Text-specific analysis
    textAnalysis?: {
      originalText: string;
      grammarScore: number;
      vocabularyScore: number;
      spellingScore: number;
      coherenceScore: number;
      errorAnalysis: {
        grammarErrors: Array<{
          text: string;
          position: { start: number; end: number };
          type: string;
          suggestion: string;
        }>;
        spellingErrors: Array<{
          text: string;
          position: { start: number; end: number };
          suggestion: string;
        }>;
        vocabularyIssues: Array<{
          text: string;
          position: { start: number; end: number };
          issue: string;
          suggestion: string;
        }>;
      };
    };

    // Choice-based analysis (MCQ, etc.)
    choiceAnalysis?: {
      selectedOptions: string[];
      correctOptions: string[];
      incorrectSelections: string[];
      missedCorrectOptions: string[];
      explanations: {
        [optionId: string]: {
          text: string;
          isCorrect: boolean;
          explanation: string;
        };
      };
    };

    // Sequence-based analysis (reorder paragraphs, etc.)
    sequenceAnalysis?: {
      userSequence: string[];
      correctSequence: string[];
      partiallyCorrectSegments: number;
      totalSegments: number;
      sequenceAccuracy: number;
    };
  };

  // Improvement suggestions (always present)
  suggestions: string[];

  // Additional metadata
  metadata: {
    evaluationMethod: 'ai' | 'rule-based' | 'hybrid';
    evaluationTimestamp: string;
    modelVersion?: string; // For AI evaluations
    confidence?: number; // AI confidence score (0-1)
  };
}

/**
 * Question type specific evaluation interfaces
 * These extend the base structure with type-specific requirements
 */

export interface AudioQuestionEvaluation
  extends StandardizedEvaluationResponse {
  analysis: StandardizedEvaluationResponse['analysis'] & {
    audioAnalysis: NonNullable<
      StandardizedEvaluationResponse['analysis']['audioAnalysis']
    >;
  };
  scoring: StandardizedEvaluationResponse['scoring'] & {
    components: {
      content: {
        score: number;
        maxScore: number;
        percentage: number;
        weight: number;
        description: string;
      };
      pronunciation: {
        score: number;
        maxScore: number;
        percentage: number;
        weight: number;
        description: string;
      };
      fluency?: {
        score: number;
        maxScore: number;
        percentage: number;
        weight: number;
        description: string;
      };
    };
  };
}

export interface WritingQuestionEvaluation
  extends StandardizedEvaluationResponse {
  analysis: StandardizedEvaluationResponse['analysis'] & {
    textAnalysis: NonNullable<
      StandardizedEvaluationResponse['analysis']['textAnalysis']
    >;
    wordCount: number;
  };
  scoring: StandardizedEvaluationResponse['scoring'] & {
    components: {
      content: {
        score: number;
        maxScore: number;
        percentage: number;
        weight: number;
        description: string;
      };
      form: {
        score: number;
        maxScore: number;
        percentage: number;
        weight: number;
        description: string;
      };
      grammar: {
        score: number;
        maxScore: number;
        percentage: number;
        weight: number;
        description: string;
      };
      vocabulary: {
        score: number;
        maxScore: number;
        percentage: number;
        weight: number;
        description: string;
      };
      spelling?: {
        score: number;
        maxScore: number;
        percentage: number;
        weight: number;
        description: string;
      };
    };
  };
}

export interface ReadingQuestionEvaluation
  extends StandardizedEvaluationResponse {
  analysis: StandardizedEvaluationResponse['analysis'] & {
    choiceAnalysis?: NonNullable<
      StandardizedEvaluationResponse['analysis']['choiceAnalysis']
    >;
    itemAnalysis?: NonNullable<
      StandardizedEvaluationResponse['scoring']['itemAnalysis']
    >;
  };
}

export interface ListeningQuestionEvaluation
  extends StandardizedEvaluationResponse {
  analysis: StandardizedEvaluationResponse['analysis'] & {
    choiceAnalysis?: NonNullable<
      StandardizedEvaluationResponse['analysis']['choiceAnalysis']
    >;
    itemAnalysis?: NonNullable<
      StandardizedEvaluationResponse['scoring']['itemAnalysis']
    >;
    textAnalysis?: NonNullable<
      StandardizedEvaluationResponse['analysis']['textAnalysis']
    >;
  };
}

/**
 * Helper functions for creating standardized responses
 */

export function createStandardizedResponse(
  baseData: {
    score: number;
    isCorrect: boolean;
    feedback: string;
    questionType: string;
    timeTaken: number;
  },
  scoring: StandardizedEvaluationResponse['scoring'],
  analysis: Partial<StandardizedEvaluationResponse['analysis']>,
  suggestions: string[] = [],
  metadata: Partial<StandardizedEvaluationResponse['metadata']> = {}
): StandardizedEvaluationResponse {
  return {
    score: baseData.score,
    isCorrect: baseData.isCorrect,
    feedback: baseData.feedback,
    scoring,
    analysis: {
      questionType: baseData.questionType,
      timeTaken: baseData.timeTaken,
      ...analysis,
    },
    suggestions,
    metadata: {
      evaluationMethod: 'ai',
      evaluationTimestamp: new Date().toISOString(),
      ...metadata,
    },
  };
}

export function createComponentScore(
  score: number,
  maxScore: number,
  weight: number,
  description: string
) {
  return {
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    weight,
    description,
  };
}

export function createItemAnalysis(
  totalItems: number,
  correctItems: number,
  itemDetails?: StandardizedEvaluationResponse['scoring']['itemAnalysis'] extends {
    itemDetails: infer T;
  }
    ? T
    : never
) {
  return {
    totalItems,
    correctItems,
    incorrectItems: totalItems - correctItems,
    accuracy: Math.round((correctItems / totalItems) * 100),
    itemDetails,
  };
}
