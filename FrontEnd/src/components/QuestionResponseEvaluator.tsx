import {
  Award,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Lightbulb,
  Target,
  TrendingUp,
  Volume2,
} from 'lucide-react';
import React, { useState } from 'react';

interface QuestionEvaluation {
  score: number;
  isCorrect: boolean;
  feedback: string;
  detailedAnalysis: any;
  suggestions: string[];
}

interface QuestionResponseEvaluatorProps {
  evaluation: QuestionEvaluation;
  questionType: string;
  className?: string;
  transcribedText?: string;
}

const QuestionResponseEvaluator: React.FC<QuestionResponseEvaluatorProps> = ({
  evaluation,
  questionType,
  className = '',
  transcribedText,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);

  // Debug logging
  console.log('QuestionResponseEvaluator Debug:', {
    evaluation,
  });

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 dark:text-green-400';
    if (score >= 65) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 65) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const getPerformanceMessage = (score: number) => {
    if (score >= 85) return 'Excellent Performance!';
    if (score >= 65) return 'Good Performance!';
    return 'Keep Practicing!';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 85) return Award;
    if (score >= 65) return Target;
    return TrendingUp;
  };

  const isAudioBasedQuestion = [
    'READ_aloud',
    'repeat_sentence',
    'describe_image',
    're_tell_lecture',
    'answer_short_question',
  ].includes(questionType.toLowerCase());

  const ScoreIcon = getScoreIcon(evaluation.score);

  return (
    <div
      className={`bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      {/* Header with Score */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center space-x-4'>
          <div className={`p-4 rounded-full ${getScoreBg(evaluation.score)}`}>
            <ScoreIcon
              className={`h-8 w-8 ${getScoreColor(evaluation.score)}`}
            />
          </div>
          <div>
            <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
              {getPerformanceMessage(evaluation.score)}
            </h3>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              {questionType
                .replace(/_/g, ' ')
                .toLowerCase()
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </p>
          </div>
        </div>
        <div className='text-right'>
          <div
            className={`text-4xl font-bold ${getScoreColor(evaluation.score)}`}
          >
            {Math.round(evaluation.score)}
          </div>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            {evaluation.score >= 65 ? 'PASS' : 'NEEDS IMPROVEMENT'}
          </p>
        </div>
      </div>

      {/* Score Progress Bar */}
      <div className='mb-6'>
        <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3'>
          <div
            className={`h-3 rounded-full transition-all duration-1000 ${
              evaluation.score >= 85
                ? 'bg-green-500'
                : evaluation.score >= 65
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${evaluation.score}%` }}
          ></div>
        </div>
        <div className='flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2'>
          <span>0%</span>
          <span className='font-medium'>65% (Pass)</span>
          <span>100%</span>
        </div>
      </div>

      {/* AI Feedback */}
      <div className='mb-6'>
        <h4 className='font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2'>
          <BarChart3 className='h-5 w-5' />
          <span>AI Feedback</span>
        </h4>
        <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
          <p className='text-gray-700 dark:text-gray-300 leading-relaxed'>
            {evaluation.feedback}
          </p>
        </div>
      </div>

      {/* Answer Short Question Specific Evaluation */}
      {questionType === 'ANSWER_SHORT_QUESTION' &&
        evaluation.detailedAnalysis?.fullEvaluation && (
          <div className='mb-6'>
            <h4 className='font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2'>
              <Target className='h-5 w-5' />
              <span>Answer Analysis</span>
            </h4>

            {/* Content and Appropriateness Scores */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
              {evaluation.detailedAnalysis.contentAccuracy !== undefined && (
                <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Content Accuracy
                    </span>
                    <span
                      className={`text-lg font-bold ${getScoreColor(
                        evaluation.detailedAnalysis.contentAccuracy
                      )}`}
                    >
                      {Math.round(evaluation.detailedAnalysis.contentAccuracy)}%
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        evaluation.detailedAnalysis.contentAccuracy >= 85
                          ? 'bg-green-500'
                          : evaluation.detailedAnalysis.contentAccuracy >= 65
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${evaluation.detailedAnalysis.contentAccuracy}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {evaluation.detailedAnalysis.appropriateness !== undefined && (
                <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Appropriateness
                    </span>
                    <span
                      className={`text-lg font-bold ${getScoreColor(
                        evaluation.detailedAnalysis.appropriateness
                      )}`}
                    >
                      {Math.round(evaluation.detailedAnalysis.appropriateness)}%
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        evaluation.detailedAnalysis.appropriateness >= 85
                          ? 'bg-green-500'
                          : evaluation.detailedAnalysis.appropriateness >= 65
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${evaluation.detailedAnalysis.appropriateness}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Feedback Categories */}
            {evaluation.detailedAnalysis.fullEvaluation.feedback && (
              <div className='space-y-3'>
                {evaluation.detailedAnalysis.fullEvaluation.feedback
                  .content && (
                  <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800'>
                    <h5 className='font-medium text-blue-900 dark:text-blue-100 mb-2'>
                      Content Feedback
                    </h5>
                    <p className='text-blue-800 dark:text-blue-200 text-sm'>
                      {
                        evaluation.detailedAnalysis.fullEvaluation.feedback
                          .content
                      }
                    </p>
                  </div>
                )}

                {evaluation.detailedAnalysis.fullEvaluation.feedback
                  .appropriateness && (
                  <div className='bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800'>
                    <h5 className='font-medium text-green-900 dark:text-green-100 mb-2'>
                      Appropriateness Feedback
                    </h5>
                    <p className='text-green-800 dark:text-green-200 text-sm'>
                      {
                        evaluation.detailedAnalysis.fullEvaluation.feedback
                          .appropriateness
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Expected vs User Response */}
            {evaluation.detailedAnalysis.fullEvaluation.detailedAnalysis && (
              <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
                {evaluation.detailedAnalysis.fullEvaluation.detailedAnalysis
                  .expectedAnswers && (
                  <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                    <h5 className='font-medium text-gray-900 dark:text-white mb-2'>
                      Expected Answers
                    </h5>
                    <div className='flex flex-wrap gap-2'>
                      {evaluation.detailedAnalysis.fullEvaluation.detailedAnalysis.expectedAnswers.map(
                        (answer: string, index: number) => (
                          <span
                            key={index}
                            className='px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md text-sm'
                          >
                            {answer}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

                {evaluation.detailedAnalysis.fullEvaluation.detailedAnalysis
                  .matchedAnswers && (
                  <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                    <h5 className='font-medium text-gray-900 dark:text-white mb-2'>
                      Matched Answers
                    </h5>
                    <div className='flex flex-wrap gap-2'>
                      {evaluation.detailedAnalysis.fullEvaluation.detailedAnalysis.matchedAnswers.map(
                        (answer: string, index: number) => (
                          <span
                            key={index}
                            className='px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-md text-sm'
                          >
                            {answer}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      {/* Read Aloud and Repeat Sentence Specific Evaluation */}
      {(questionType === 'READ_ALOUD' || questionType === 'REPEAT_SENTENCE') &&
        evaluation.detailedAnalysis?.wordByWordAnalysis && (
          <div className='mb-6'>
            <h4 className='font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2'>
              <Volume2 className='h-5 w-5' />
              <span>
                {questionType === 'READ_ALOUD'
                  ? 'Read Aloud Analysis'
                  : 'Repeat Sentence Analysis'}
              </span>
            </h4>

            {/* Content, Pronunciation, and Fluency Scores */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
              {evaluation.detailedAnalysis.contentPercentage !== undefined && (
                <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Content
                    </span>
                    <span
                      className={`text-lg font-bold ${getScoreColor(
                        evaluation.detailedAnalysis.contentPercentage
                      )}`}
                    >
                      {Math.round(
                        evaluation.detailedAnalysis.contentPercentage
                      )}
                      %
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        evaluation.detailedAnalysis.contentPercentage >= 85
                          ? 'bg-green-500'
                          : evaluation.detailedAnalysis.contentPercentage >= 65
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${evaluation.detailedAnalysis.contentPercentage}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {evaluation.detailedAnalysis.pronunciationPercentage !==
                undefined && (
                <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Pronunciation
                    </span>
                    <span
                      className={`text-lg font-bold ${getScoreColor(
                        evaluation.detailedAnalysis.pronunciationPercentage
                      )}`}
                    >
                      {Math.round(
                        evaluation.detailedAnalysis.pronunciationPercentage
                      )}
                      %
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        evaluation.detailedAnalysis.pronunciationPercentage >=
                        85
                          ? 'bg-green-500'
                          : evaluation.detailedAnalysis
                              .pronunciationPercentage >= 65
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${evaluation.detailedAnalysis.pronunciationPercentage}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {evaluation.detailedAnalysis.fluencyPercentage !== undefined && (
                <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Oral Fluency
                    </span>
                    <span
                      className={`text-lg font-bold ${getScoreColor(
                        evaluation.detailedAnalysis.fluencyPercentage
                      )}`}
                    >
                      {Math.round(
                        evaluation.detailedAnalysis.fluencyPercentage
                      )}
                      %
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        evaluation.detailedAnalysis.fluencyPercentage >= 85
                          ? 'bg-green-500'
                          : evaluation.detailedAnalysis.fluencyPercentage >= 65
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${evaluation.detailedAnalysis.fluencyPercentage}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Word-by-Word Analysis */}
            <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
              <h5 className='font-medium text-gray-900 dark:text-white mb-3'>
                Word Analysis
              </h5>
              <div className='flex flex-wrap gap-2'>
                {evaluation.detailedAnalysis.wordByWordAnalysis.map(
                  (wordAnalysis: any, index: number) => {
                    const getWordColor = (status: string) => {
                      switch (status) {
                        case 'correct':
                          return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
                        case 'mispronounced':
                          return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
                        case 'omitted':
                          return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800 border-dashed line-through';
                        case 'inserted':
                          return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
                        default:
                          return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-800';
                      }
                    };

                    return (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded-md text-sm border ${getWordColor(
                          wordAnalysis.status
                        )}`}
                        title={`Status: ${wordAnalysis.status}`}
                      >
                        {wordAnalysis.word}
                      </span>
                    );
                  }
                )}
              </div>

              {/* Legend */}
              <div className='mt-4 flex flex-wrap gap-4 text-xs'>
                <div className='flex items-center space-x-1'>
                  <div className='w-3 h-3 bg-green-500 rounded'></div>
                  <span className='text-gray-600 dark:text-gray-400'>
                    Correct
                  </span>
                </div>
                <div className='flex items-center space-x-1'>
                  <div className='w-3 h-3 bg-yellow-500 rounded'></div>
                  <span className='text-gray-600 dark:text-gray-400'>
                    Mispronounced
                  </span>
                </div>
                <div className='flex items-center space-x-1'>
                  <div className='w-3 h-3 bg-red-500 rounded border-dashed border border-red-600'></div>
                  <span className='text-gray-600 dark:text-gray-400'>
                    Omitted (dashed)
                  </span>
                </div>
                <div className='flex items-center space-x-1'>
                  <div className='w-3 h-3 bg-blue-500 rounded'></div>
                  <span className='text-gray-600 dark:text-gray-400'>
                    Inserted
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Re-tell Lecture Specific Evaluation */}
      {questionType === 'RE_TELL_LECTURE' &&
        evaluation.detailedAnalysis?.contentPercentage !== undefined && (
          <div className='mb-6'>
            <h4 className='font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2'>
              <Volume2 className='h-5 w-5' />
              <span>Re-tell Lecture Analysis</span>
            </h4>

            {/* Content, Oral Fluency, and Pronunciation Scores */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
              {evaluation.detailedAnalysis.contentPercentage !== undefined && (
                <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Content
                    </span>
                    <span
                      className={`text-lg font-bold ${getScoreColor(
                        evaluation.detailedAnalysis.contentPercentage
                      )}`}
                    >
                      {Math.round(
                        evaluation.detailedAnalysis.contentPercentage
                      )}
                      %
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        evaluation.detailedAnalysis.contentPercentage >= 85
                          ? 'bg-green-500'
                          : evaluation.detailedAnalysis.contentPercentage >= 65
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${evaluation.detailedAnalysis.contentPercentage}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {evaluation.detailedAnalysis.oralFluencyPercentage !==
                undefined && (
                <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Oral Fluency
                    </span>
                    <span
                      className={`text-lg font-bold ${getScoreColor(
                        evaluation.detailedAnalysis.oralFluencyPercentage
                      )}`}
                    >
                      {Math.round(
                        evaluation.detailedAnalysis.oralFluencyPercentage
                      )}
                      %
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        evaluation.detailedAnalysis.oralFluencyPercentage >= 85
                          ? 'bg-green-500'
                          : evaluation.detailedAnalysis.oralFluencyPercentage >=
                            65
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${evaluation.detailedAnalysis.oralFluencyPercentage}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {evaluation.detailedAnalysis.pronunciationPercentage !==
                undefined && (
                <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Pronunciation
                    </span>
                    <span
                      className={`text-lg font-bold ${getScoreColor(
                        evaluation.detailedAnalysis.pronunciationPercentage
                      )}`}
                    >
                      {Math.round(
                        evaluation.detailedAnalysis.pronunciationPercentage
                      )}
                      %
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        evaluation.detailedAnalysis.pronunciationPercentage >=
                        85
                          ? 'bg-green-500'
                          : evaluation.detailedAnalysis
                              .pronunciationPercentage >= 65
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${evaluation.detailedAnalysis.pronunciationPercentage}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Re-tell Lecture Specific Information */}
            <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
              <h5 className='font-medium text-gray-900 dark:text-white mb-3'>
                Performance Summary
              </h5>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                    {evaluation.detailedAnalysis.contentScore || 0}/
                    {evaluation.detailedAnalysis.contentMaxScore || 5}
                  </div>
                  <div className='text-gray-600 dark:text-gray-400'>
                    Content Coverage
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
                    {evaluation.detailedAnalysis.oralFluencyScore || 0}/
                    {evaluation.detailedAnalysis.oralFluencyMaxScore || 5}
                  </div>
                  <div className='text-gray-600 dark:text-gray-400'>
                    Oral Fluency
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-purple-600 dark:text-purple-400'>
                    {evaluation.detailedAnalysis.pronunciationScore || 0}/
                    {evaluation.detailedAnalysis.pronunciationMaxScore || 5}
                  </div>
                  <div className='text-gray-600 dark:text-gray-400'>
                    Pronunciation
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Describe Image Specific Evaluation */}
      {questionType === 'DESCRIBE_IMAGE' &&
        evaluation.detailedAnalysis?.contentPercentage !== undefined && (
          <div className='mb-6'>
            <h4 className='font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2'>
              <FileText className='h-5 w-5' />
              <span>Describe Image Analysis</span>
            </h4>

            {/* Content, Oral Fluency, and Pronunciation Scores */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
              {evaluation.detailedAnalysis.contentPercentage !== undefined && (
                <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Content
                    </span>
                    <span
                      className={`text-lg font-bold ${getScoreColor(
                        evaluation.detailedAnalysis.contentPercentage
                      )}`}
                    >
                      {Math.round(
                        evaluation.detailedAnalysis.contentPercentage
                      )}
                      %
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        evaluation.detailedAnalysis.contentPercentage >= 85
                          ? 'bg-green-500'
                          : evaluation.detailedAnalysis.contentPercentage >= 65
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${evaluation.detailedAnalysis.contentPercentage}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {evaluation.detailedAnalysis.oralFluencyPercentage !==
                undefined && (
                <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Oral Fluency
                    </span>
                    <span
                      className={`text-lg font-bold ${getScoreColor(
                        evaluation.detailedAnalysis.oralFluencyPercentage
                      )}`}
                    >
                      {Math.round(
                        evaluation.detailedAnalysis.oralFluencyPercentage
                      )}
                      %
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        evaluation.detailedAnalysis.oralFluencyPercentage >= 85
                          ? 'bg-green-500'
                          : evaluation.detailedAnalysis.oralFluencyPercentage >=
                            65
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${evaluation.detailedAnalysis.oralFluencyPercentage}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {evaluation.detailedAnalysis.pronunciationPercentage !==
                undefined && (
                <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Pronunciation
                    </span>
                    <span
                      className={`text-lg font-bold ${getScoreColor(
                        evaluation.detailedAnalysis.pronunciationPercentage
                      )}`}
                    >
                      {Math.round(
                        evaluation.detailedAnalysis.pronunciationPercentage
                      )}
                      %
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        evaluation.detailedAnalysis.pronunciationPercentage >=
                        85
                          ? 'bg-green-500'
                          : evaluation.detailedAnalysis
                              .pronunciationPercentage >= 65
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${evaluation.detailedAnalysis.pronunciationPercentage}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Describe Image Specific Information */}
            <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
              <h5 className='font-medium text-gray-900 dark:text-white mb-3'>
                Performance Summary
              </h5>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                    {evaluation.detailedAnalysis.contentScore || 0}/
                    {evaluation.detailedAnalysis.contentMaxScore || 5}
                  </div>
                  <div className='text-gray-600 dark:text-gray-400'>
                    Content Coverage
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
                    {evaluation.detailedAnalysis.oralFluencyScore || 0}/
                    {evaluation.detailedAnalysis.oralFluencyMaxScore || 5}
                  </div>
                  <div className='text-gray-600 dark:text-gray-400'>
                    Oral Fluency
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-purple-600 dark:text-purple-400'>
                    {evaluation.detailedAnalysis.pronunciationScore || 0}/
                    {evaluation.detailedAnalysis.pronunciationMaxScore || 5}
                  </div>
                  <div className='text-gray-600 dark:text-gray-400'>
                    Pronunciation
                  </div>
                </div>
              </div>

              {/* Key Elements Information */}
              {evaluation.detailedAnalysis.keyElementsCovered &&
                evaluation.detailedAnalysis.keyElementsCovered.length > 0 && (
                  <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
                    <h6 className='font-medium text-gray-900 dark:text-white mb-2'>
                      Key Elements to Cover:
                    </h6>
                    <div className='flex flex-wrap gap-2'>
                      {evaluation.detailedAnalysis.keyElementsCovered.map(
                        (element: string, index: number) => (
                          <span
                            key={index}
                            className='px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md text-xs'
                          >
                            {element}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

      {/* Summarize Written Text Specific Evaluation */}
      {questionType === 'SUMMARIZE_WRITTEN_TEXT' &&
        evaluation.detailedAnalysis?.overallScore && (
          <div className='mb-6'>
            <h4 className='font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2'>
              <FileText className='h-5 w-5' />
              <span>Summarize Written Text Analysis</span>
            </h4>

            {/* PTE Scoring Criteria */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
              {/* Content Score */}
              <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Content
                  </span>
                  <span className='text-lg font-bold text-blue-600 dark:text-blue-400'>
                    {evaluation.detailedAnalysis.contentScore || 0}/
                    {evaluation.detailedAnalysis.maxContentScore}
                  </span>
                </div>
                <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                  <div
                    className='h-2 rounded-full transition-all duration-1000 bg-blue-500'
                    style={{
                      width: `${
                        ((evaluation.detailedAnalysis.contentScore || 0) /
                          evaluation.detailedAnalysis.maxContentScore) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <p className='text-xs text-gray-600 dark:text-gray-400 mt-1'>
                  Comprehensiveness & accuracy
                </p>
              </div>

              {/* Form Score */}
              <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Form
                  </span>
                  <span className='text-lg font-bold text-green-600 dark:text-green-400'>
                    {evaluation.detailedAnalysis.formScore || 0}/
                    {evaluation.detailedAnalysis.maxFormScore}
                  </span>
                </div>
                <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                  <div
                    className='h-2 rounded-full transition-all duration-1000 bg-green-500'
                    style={{
                      width: `${
                        ((evaluation.detailedAnalysis.formScore || 0) /
                          evaluation.detailedAnalysis.maxFormScore) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <p className='text-xs text-gray-600 dark:text-gray-400 mt-1'>
                  Single sentence, 5-75 words
                </p>
              </div>

              {/* Grammar Score */}
              <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Grammar
                  </span>
                  <span className='text-lg font-bold text-purple-600 dark:text-purple-400'>
                    {evaluation.detailedAnalysis.grammarScore || 0}/
                    {evaluation.detailedAnalysis.maxGrammarScore}
                  </span>
                </div>
                <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                  <div
                    className='h-2 rounded-full transition-all duration-1000 bg-purple-500'
                    style={{
                      width: `${
                        ((evaluation.detailedAnalysis.grammarScore || 0) /
                          evaluation.detailedAnalysis.maxGrammarScore) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <p className='text-xs text-gray-600 dark:text-gray-400 mt-1'>
                  Grammatical control
                </p>
              </div>

              {/* Vocabulary Score */}
              <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Vocabulary
                  </span>
                  <span className='text-lg font-bold text-orange-600 dark:text-orange-400'>
                    {evaluation.detailedAnalysis.vocabularyScore || 0}/
                    {evaluation.detailedAnalysis.maxVocabularyScore}
                  </span>
                </div>
                <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                  <div
                    className='h-2 rounded-full transition-all duration-1000 bg-orange-500'
                    style={{
                      width: `${
                        ((evaluation.detailedAnalysis.vocabularyScore || 0) /
                          evaluation.detailedAnalysis.maxVocabularyScore) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <p className='text-xs text-gray-600 dark:text-gray-400 mt-1'>
                  Appropriate word choice
                </p>
              </div>
            </div>

            {/* Detailed Feedback */}
            {evaluation.detailedAnalysis.feedback && (
              <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                <h5 className='font-medium text-gray-900 dark:text-white mb-3'>
                  Detailed Feedback
                </h5>

                {/* Overall Summary */}
                {evaluation.detailedAnalysis.feedback.summary && (
                  <div className='mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
                    <h6 className='font-medium text-blue-900 dark:text-blue-200 mb-1'>
                      Overall Assessment
                    </h6>
                    <p className='text-sm text-blue-800 dark:text-blue-300'>
                      {evaluation.detailedAnalysis.feedback.summary}
                    </p>
                  </div>
                )}

                {/* Individual Criteria Feedback */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {evaluation.detailedAnalysis.feedback.content && (
                    <div className='p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg'>
                      <h6 className='font-medium text-gray-900 dark:text-white mb-1 flex items-center space-x-1'>
                        <span className='w-2 h-2 bg-blue-500 rounded-full'></span>
                        <span>Content</span>
                      </h6>
                      <p className='text-sm text-gray-700 dark:text-gray-300'>
                        {evaluation.detailedAnalysis.feedback.content}
                      </p>
                    </div>
                  )}

                  {evaluation.detailedAnalysis.feedback.form && (
                    <div className='p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg'>
                      <h6 className='font-medium text-gray-900 dark:text-white mb-1 flex items-center space-x-1'>
                        <span className='w-2 h-2 bg-green-500 rounded-full'></span>
                        <span>Form</span>
                      </h6>
                      <p className='text-sm text-gray-700 dark:text-gray-300'>
                        {evaluation.detailedAnalysis.feedback.form}
                      </p>
                    </div>
                  )}

                  {evaluation.detailedAnalysis.feedback.grammar && (
                    <div className='p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg'>
                      <h6 className='font-medium text-gray-900 dark:text-white mb-1 flex items-center space-x-1'>
                        <span className='w-2 h-2 bg-purple-500 rounded-full'></span>
                        <span>Grammar</span>
                      </h6>
                      <p className='text-sm text-gray-700 dark:text-gray-300'>
                        {evaluation.detailedAnalysis.feedback.grammar}
                      </p>
                    </div>
                  )}

                  {evaluation.detailedAnalysis.feedback.vocabulary && (
                    <div className='p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg'>
                      <h6 className='font-medium text-gray-900 dark:text-white mb-1 flex items-center space-x-1'>
                        <span className='w-2 h-2 bg-orange-500 rounded-full'></span>
                        <span>Vocabulary</span>
                      </h6>
                      <p className='text-sm text-gray-700 dark:text-gray-300'>
                        {evaluation.detailedAnalysis.feedback.vocabulary}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Word Count Information */}
            {evaluation.detailedAnalysis.actualWordCount !== undefined && (
              <div className='mt-4 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                <h5 className='font-medium text-gray-900 dark:text-white mb-3'>
                  Word Count Analysis
                </h5>
                <div className='flex items-center justify-between'>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                      {evaluation.detailedAnalysis.actualWordCount}
                    </div>
                    <div className='text-sm text-gray-600 dark:text-gray-400'>
                      Actual Words
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                      5-75
                    </div>
                    <div className='text-sm text-gray-600 dark:text-gray-400'>
                      Required Range
                    </div>
                  </div>
                  <div className='text-center'>
                    <div
                      className={`text-2xl font-bold ${
                        evaluation.detailedAnalysis.actualWordCount >= 5 &&
                        evaluation.detailedAnalysis.actualWordCount <= 75
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {evaluation.detailedAnalysis.actualWordCount >= 5 &&
                      evaluation.detailedAnalysis.actualWordCount <= 75
                        ? '✓'
                        : '✗'}
                    </div>
                    <div className='text-sm text-gray-600 dark:text-gray-400'>
                      Within Range
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Write Essay Specific Evaluation */}
      {(questionType === 'WRITE_ESSAY' ||
        questionType === 'Write Essay' ||
        questionType?.toLowerCase().includes('essay')) &&
        evaluation.detailedAnalysis?.scores && (
          <div className='mb-6'>
            <h4 className='font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2'>
              <FileText className='h-5 w-5' />
              <span>Write Essay Analysis</span>
            </h4>

            {/* PTE Essay Scoring Criteria */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4'>
              {/* Content Score */}
              <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Content
                  </span>
                  <span className='text-lg font-bold text-blue-600 dark:text-blue-400'>
                    {evaluation.detailedAnalysis.scores.content?.score || 0}/
                    {evaluation.detailedAnalysis.scores.content?.max || 6}
                  </span>
                </div>
                <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                  <div
                    className='h-2 rounded-full transition-all duration-1000 bg-blue-500'
                    style={{
                      width: `${
                        ((evaluation.detailedAnalysis.scores.content?.score ||
                          0) /
                          (evaluation.detailedAnalysis.scores.content?.max ||
                            6)) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <p className='text-xs text-gray-600 dark:text-gray-400 mt-1'>
                  Addresses prompt & argument quality
                </p>
              </div>

              {/* Form Score */}
              <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Form
                  </span>
                  <span className='text-lg font-bold text-green-600 dark:text-green-400'>
                    {evaluation.detailedAnalysis.scores.form?.score || 0}/
                    {evaluation.detailedAnalysis.scores.form?.max || 2}
                  </span>
                </div>
                <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                  <div
                    className='h-2 rounded-full transition-all duration-1000 bg-green-500'
                    style={{
                      width: `${
                        ((evaluation.detailedAnalysis.scores.form?.score || 0) /
                          (evaluation.detailedAnalysis.scores.form?.max || 2)) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <p className='text-xs text-gray-600 dark:text-gray-400 mt-1'>
                  Word count (200-300 words)
                </p>
              </div>

              {/* Development, Structure & Coherence Score */}
              <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Structure
                  </span>
                  <span className='text-lg font-bold text-purple-600 dark:text-purple-400'>
                    {evaluation.detailedAnalysis.scores
                      .developmentStructureCoherence?.score || 0}
                    /
                    {evaluation.detailedAnalysis.scores
                      .developmentStructureCoherence?.max || 6}
                  </span>
                </div>
                <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                  <div
                    className='h-2 rounded-full transition-all duration-1000 bg-purple-500'
                    style={{
                      width: `${
                        ((evaluation.detailedAnalysis.scores
                          .developmentStructureCoherence?.score || 0) /
                          (evaluation.detailedAnalysis.scores
                            .developmentStructureCoherence?.max || 6)) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <p className='text-xs text-gray-600 dark:text-gray-400 mt-1'>
                  Organization & coherence
                </p>
              </div>

              {/* Grammar Score */}
              <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Grammar
                  </span>
                  <span className='text-lg font-bold text-red-600 dark:text-red-400'>
                    {evaluation.detailedAnalysis.scores.grammar?.score || 0}/
                    {evaluation.detailedAnalysis.scores.grammar?.max || 2}
                  </span>
                </div>
                <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                  <div
                    className='h-2 rounded-full transition-all duration-1000 bg-red-500'
                    style={{
                      width: `${
                        ((evaluation.detailedAnalysis.scores.grammar?.score ||
                          0) /
                          (evaluation.detailedAnalysis.scores.grammar?.max ||
                            2)) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <p className='text-xs text-gray-600 dark:text-gray-400 mt-1'>
                  Grammatical accuracy
                </p>
              </div>

              {/* General Linguistic Range Score */}
              <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Linguistic Range
                  </span>
                  <span className='text-lg font-bold text-indigo-600 dark:text-indigo-400'>
                    {evaluation.detailedAnalysis.scores.generalLinguisticRange
                      ?.score || 0}
                    /
                    {evaluation.detailedAnalysis.scores.generalLinguisticRange
                      ?.max || 6}
                  </span>
                </div>
                <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                  <div
                    className='h-2 rounded-full transition-all duration-1000 bg-indigo-500'
                    style={{
                      width: `${
                        ((evaluation.detailedAnalysis.scores
                          .generalLinguisticRange?.score || 0) /
                          (evaluation.detailedAnalysis.scores
                            .generalLinguisticRange?.max || 6)) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <p className='text-xs text-gray-600 dark:text-gray-400 mt-1'>
                  Language complexity & variety
                </p>
              </div>

              {/* Vocabulary Range Score */}
              <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Vocabulary
                  </span>
                  <span className='text-lg font-bold text-orange-600 dark:text-orange-400'>
                    {evaluation.detailedAnalysis.scores.vocabularyRange
                      ?.score || 0}
                    /
                    {evaluation.detailedAnalysis.scores.vocabularyRange?.max ||
                      2}
                  </span>
                </div>
                <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                  <div
                    className='h-2 rounded-full transition-all duration-1000 bg-orange-500'
                    style={{
                      width: `${
                        ((evaluation.detailedAnalysis.scores.vocabularyRange
                          ?.score || 0) /
                          (evaluation.detailedAnalysis.scores.vocabularyRange
                            ?.max || 2)) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <p className='text-xs text-gray-600 dark:text-gray-400 mt-1'>
                  Lexical repertoire
                </p>
              </div>

              {/* Spelling Score */}
              <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Spelling
                  </span>
                  <span className='text-lg font-bold text-pink-600 dark:text-pink-400'>
                    {evaluation.detailedAnalysis.scores.spelling?.score || 0}/
                    {evaluation.detailedAnalysis.scores.spelling?.max || 2}
                  </span>
                </div>
                <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                  <div
                    className='h-2 rounded-full transition-all duration-1000 bg-pink-500'
                    style={{
                      width: `${
                        ((evaluation.detailedAnalysis.scores.spelling?.score ||
                          0) /
                          (evaluation.detailedAnalysis.scores.spelling?.max ||
                            2)) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <p className='text-xs text-gray-600 dark:text-gray-400 mt-1'>
                  Spelling accuracy
                </p>
              </div>
            </div>

            {/* Detailed Feedback */}
            {evaluation.detailedAnalysis.feedback && (
              <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-4'>
                <h5 className='font-medium text-gray-900 dark:text-white mb-3'>
                  Detailed Feedback
                </h5>

                {/* Overall Summary */}
                {evaluation.detailedAnalysis.feedback.summary && (
                  <div className='mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
                    <h6 className='font-medium text-blue-900 dark:text-blue-200 mb-1'>
                      Overall Assessment
                    </h6>
                    <p className='text-sm text-blue-800 dark:text-blue-300'>
                      {evaluation.detailedAnalysis.feedback.summary}
                    </p>
                  </div>
                )}

                {/* Individual Criteria Feedback */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {evaluation.detailedAnalysis.feedback.content && (
                    <div className='p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg'>
                      <h6 className='font-medium text-gray-900 dark:text-white mb-1 flex items-center space-x-1'>
                        <span className='w-2 h-2 bg-blue-500 rounded-full'></span>
                        <span>Content</span>
                      </h6>
                      <p className='text-sm text-gray-700 dark:text-gray-300'>
                        {evaluation.detailedAnalysis.feedback.content}
                      </p>
                    </div>
                  )}

                  {evaluation.detailedAnalysis.feedback.form && (
                    <div className='p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg'>
                      <h6 className='font-medium text-gray-900 dark:text-white mb-1 flex items-center space-x-1'>
                        <span className='w-2 h-2 bg-green-500 rounded-full'></span>
                        <span>Form</span>
                      </h6>
                      <p className='text-sm text-gray-700 dark:text-gray-300'>
                        {evaluation.detailedAnalysis.feedback.form}
                      </p>
                    </div>
                  )}

                  {evaluation.detailedAnalysis.feedback
                    .developmentStructureCoherence && (
                    <div className='p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg'>
                      <h6 className='font-medium text-gray-900 dark:text-white mb-1 flex items-center space-x-1'>
                        <span className='w-2 h-2 bg-purple-500 rounded-full'></span>
                        <span>Structure & Coherence</span>
                      </h6>
                      <p className='text-sm text-gray-700 dark:text-gray-300'>
                        {
                          evaluation.detailedAnalysis.feedback
                            .developmentStructureCoherence
                        }
                      </p>
                    </div>
                  )}

                  {evaluation.detailedAnalysis.feedback.grammar && (
                    <div className='p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg'>
                      <h6 className='font-medium text-gray-900 dark:text-white mb-1 flex items-center space-x-1'>
                        <span className='w-2 h-2 bg-red-500 rounded-full'></span>
                        <span>Grammar</span>
                      </h6>
                      <p className='text-sm text-gray-700 dark:text-gray-300'>
                        {evaluation.detailedAnalysis.feedback.grammar}
                      </p>
                    </div>
                  )}

                  {evaluation.detailedAnalysis.feedback
                    .generalLinguisticRange && (
                    <div className='p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg'>
                      <h6 className='font-medium text-gray-900 dark:text-white mb-1 flex items-center space-x-1'>
                        <span className='w-2 h-2 bg-indigo-500 rounded-full'></span>
                        <span>Linguistic Range</span>
                      </h6>
                      <p className='text-sm text-gray-700 dark:text-gray-300'>
                        {
                          evaluation.detailedAnalysis.feedback
                            .generalLinguisticRange
                        }
                      </p>
                    </div>
                  )}

                  {evaluation.detailedAnalysis.feedback.vocabularyRange && (
                    <div className='p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg'>
                      <h6 className='font-medium text-gray-900 dark:text-white mb-1 flex items-center space-x-1'>
                        <span className='w-2 h-2 bg-orange-500 rounded-full'></span>
                        <span>Vocabulary Range</span>
                      </h6>
                      <p className='text-sm text-gray-700 dark:text-gray-300'>
                        {evaluation.detailedAnalysis.feedback.vocabularyRange}
                      </p>
                    </div>
                  )}

                  {evaluation.detailedAnalysis.feedback.spelling && (
                    <div className='p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg'>
                      <h6 className='font-medium text-gray-900 dark:text-white mb-1 flex items-center space-x-1'>
                        <span className='w-2 h-2 bg-pink-500 rounded-full'></span>
                        <span>Spelling</span>
                      </h6>
                      <p className='text-sm text-gray-700 dark:text-gray-300'>
                        {evaluation.detailedAnalysis.feedback.spelling}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Word Count Information */}
            {evaluation.detailedAnalysis.actualWordCount !== undefined && (
              <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
                <h5 className='font-medium text-gray-900 dark:text-white mb-3'>
                  Word Count Analysis
                </h5>
                <div className='flex items-center justify-between'>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                      {evaluation.detailedAnalysis.actualWordCount}
                    </div>
                    <div className='text-sm text-gray-600 dark:text-gray-400'>
                      Actual Words
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                      200-300
                    </div>
                    <div className='text-sm text-gray-600 dark:text-gray-400'>
                      Optimal Range
                    </div>
                  </div>
                  <div className='text-center'>
                    <div
                      className={`text-2xl font-bold ${
                        evaluation.detailedAnalysis.actualWordCount >= 200 &&
                        evaluation.detailedAnalysis.actualWordCount <= 300
                          ? 'text-green-600 dark:text-green-400'
                          : evaluation.detailedAnalysis.actualWordCount >=
                              120 &&
                            evaluation.detailedAnalysis.actualWordCount <= 380
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {evaluation.detailedAnalysis.actualWordCount >= 200 &&
                      evaluation.detailedAnalysis.actualWordCount <= 300
                        ? '✓'
                        : evaluation.detailedAnalysis.actualWordCount >= 120 &&
                          evaluation.detailedAnalysis.actualWordCount <= 380
                        ? '⚠'
                        : '✗'}
                    </div>
                    <div className='text-sm text-gray-600 dark:text-gray-400'>
                      {evaluation.detailedAnalysis.actualWordCount >= 200 &&
                      evaluation.detailedAnalysis.actualWordCount <= 300
                        ? 'Optimal'
                        : evaluation.detailedAnalysis.actualWordCount >= 120 &&
                          evaluation.detailedAnalysis.actualWordCount <= 380
                        ? 'Acceptable'
                        : 'Poor'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Transcribed Text for Audio Questions */}
      {isAudioBasedQuestion && transcribedText && (
        <div className='mb-6'>
          <button
            onClick={() => setShowTranscription(!showTranscription)}
            className='flex items-center space-x-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium mb-3'
          >
            <Volume2 className='h-5 w-5' />
            <span>Transcribed Audio</span>
            {showTranscription ? (
              <ChevronUp className='h-4 w-4' />
            ) : (
              <ChevronDown className='h-4 w-4' />
            )}
          </button>

          {showTranscription && (
            <div className='bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800'>
              <div className='flex items-center space-x-2 mb-2'>
                <FileText className='h-4 w-4 text-purple-600 dark:text-purple-400' />
                <span className='text-sm font-medium text-purple-800 dark:text-purple-300'>
                  What we heard:
                </span>
              </div>
              <p className='text-purple-700 dark:text-purple-300 italic leading-relaxed'>
                "{transcribedText}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Detailed Analysis Toggle */}
      {evaluation.detailedAnalysis &&
        Object.keys(evaluation.detailedAnalysis).length > 0 && (
          <div className='mb-6'>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className='flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium'
            >
              <TrendingUp className='h-5 w-5' />
              <span>Detailed Analysis</span>
              {showDetails ? (
                <ChevronUp className='h-4 w-4' />
              ) : (
                <ChevronDown className='h-4 w-4' />
              )}
            </button>

            {showDetails && (
              <div className='mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {Object.entries(evaluation.detailedAnalysis)
                    .filter(
                      ([key, value]) =>
                        key !== 'error' &&
                        key !== 'placeholder' &&
                        key !== 'wordByWordAnalysis' &&
                        key !== 'fullEvaluation' &&
                        value !== null &&
                        value !== undefined
                    )
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className='flex justify-between items-center py-2 px-3 bg-white dark:bg-gray-800 rounded-lg'
                      >
                        <span className='text-sm font-medium text-gray-700 dark:text-gray-300 capitalize'>
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className='text-sm text-gray-900 dark:text-white font-semibold'>
                          {typeof value === 'number'
                            ? `${Math.round(value)}${
                                key.includes('score') ||
                                key.includes('accuracy') ||
                                key.includes('Score') ||
                                key.includes('Accuracy') ||
                                key.includes('Percentage')
                                  ? '%'
                                  : key.includes('Count') ||
                                    key.includes('Time') ||
                                    key.includes('Words')
                                  ? ''
                                  : ''
                              }`
                            : typeof value === 'boolean'
                            ? value
                              ? 'Yes'
                              : 'No'
                            : String(value).length > 50
                            ? String(value).substring(0, 50) + '...'
                            : String(value)}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Time taken display */}
                {evaluation.detailedAnalysis.timeTaken !== undefined && (
                  <div className='mt-4 flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400'>
                    <Clock className='h-4 w-4' />
                    <span>
                      Completed in{' '}
                      {Math.floor(evaluation.detailedAnalysis.timeTaken / 60)}:
                      {(evaluation.detailedAnalysis.timeTaken % 60)
                        .toString()
                        .padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      {/* Improvement Suggestions */}
      {evaluation.suggestions &&
        Array.isArray(evaluation.suggestions) &&
        evaluation.suggestions.length > 0 && (
          <div>
            <h4 className='font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2'>
              <Lightbulb className='h-5 w-5' />
              <span>Improvement Tips</span>
            </h4>
            <div className='space-y-3'>
              {evaluation.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className='flex items-start space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800'
                >
                  <div className='bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0'>
                    {index + 1}
                  </div>
                  <p className='text-yellow-800 dark:text-yellow-200 leading-relaxed'>
                    {suggestion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};

export default QuestionResponseEvaluator;
