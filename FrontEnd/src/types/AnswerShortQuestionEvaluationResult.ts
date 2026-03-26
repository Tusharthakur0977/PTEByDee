export interface  AnswerShortQuestionApiResponse {
  success: boolean;
  data: Data;
  message: string;
  statusCode: number;
}

export interface Data {
  responseId: string;
  evaluation: Evaluation;
  question: Question;
  timeTaken: number;
  transcribedText: string;
}

export interface Evaluation {
  score: { scored: number; max: number };
  isCorrect: boolean;
  feedback: string;
  detailedAnalysis: DetailedAnalysis;
  suggestions: string[];
}

export interface DetailedAnalysis {
  scores: Scores;
  errorAnalysis: ErrorAnalysis;
  userText: string;
  correctAnswer?: string;
}

export interface Scores {
  vocabulary: Vocabulary;
}

export interface Vocabulary {
  score: number;
  max: number;
}

export interface ErrorAnalysis {
  pronunciationErrors: any[];
  fluencyErrors: any[];
  contentErrors: any[];
}

export interface Question {
  id: string;
  questionCode: string;
  questionType: string;
  sectionName: string;
}
