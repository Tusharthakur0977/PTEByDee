import React from 'react';
import {
  Award,
  CheckCircle,
  XCircle,
  Target,
  TrendingUp,
  Clock,
  BarChart3,
  Lightbulb,
  Volume2,
} from 'lucide-react';
import { PteQuestionTypeName } from '../types/pte';

interface QuestionEvaluation {
  score: number;
  isCorrect: boolean;
  feedback: string;
  detailedAnalysis: any;
  suggestions: string[];
}

interface QuestionResponseEvaluatorProps {
  evaluation: QuestionEvaluation;
  questionType: PteQuestionTypeName;
  transcribedText?: string;
  className?: string;
}

const QuestionResponseEvaluator: React.FC<QuestionResponseEvaluatorProps> = ({
  evaluation,
  questionType,
  transcribedText,
  className = '',
}) => {
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

  const isFillInTheBlanksQuestion = questionType.includes('FILL_IN_THE_BLANKS');

  const ScoreIcon = getScoreIcon(evaluation.score);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Score */}
      <div
        className={`rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${getScoreBg(
          evaluation.score
        )}`}
      >
        <div className='flex items-center justify-between mb-4'>
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
                  .replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </p>
            </div>
          </div>
          <div className='text-right'>
            <div
              className={`text-4xl font-bold ${getScoreColor(
                evaluation.score
              )}`}
            >
              {Math.round(evaluation.score)}
            </div>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              {evaluation.score >= 65 ? 'PASS' : 'NEEDS IMPROVEMENT'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4'>
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

        {/* Quick Stats */}
        <div className='grid grid-cols-3 gap-4 text-center'>
          <div>
            <div className='flex items-center justify-center space-x-1 mb-1'>
              <Clock className='h-4 w-4 text-gray-600 dark:text-gray-400' />
              <span className='text-sm font-medium text-gray-900 dark:text-white'>
                {evaluation.detailedAnalysis?.timeTakenSeconds
                  ? `${Math.floor(
                      evaluation.detailedAnalysis.timeTakenSeconds / 60
                    )}:${(evaluation.detailedAnalysis.timeTakenSeconds % 60)
                      .toString()
                      .padStart(2, '0')}`
                  : 'N/A'}
              </span>
            </div>
            <div className='text-xs text-gray-600 dark:text-gray-300'>
              Time Taken
            </div>
          </div>
          <div>
            <div className='flex items-center justify-center space-x-1 mb-1'>
              {evaluation.isCorrect ? (
                <CheckCircle className='h-4 w-4 text-green-600 dark:text-green-400' />
              ) : (
                <XCircle className='h-4 w-4 text-red-600 dark:text-red-400' />
              )}
              <span className='text-sm font-medium text-gray-900 dark:text-white'>
                {evaluation.isCorrect ? 'Correct' : 'Incorrect'}
              </span>
            </div>
            <div className='text-xs text-gray-600 dark:text-gray-300'>
              Result
            </div>
          </div>
          <div>
            <div className='flex items-center justify-center space-x-1 mb-1'>
              <BarChart3 className='h-4 w-4 text-gray-600 dark:text-gray-400' />
              <span className='text-sm font-medium text-gray-900 dark:text-white'>
                {evaluation.score}%
              </span>
            </div>
            <div className='text-xs text-gray-600 dark:text-gray-300'>
              Score
            </div>
          </div>
        </div>
      </div>

      {/* AI Feedback */}
      <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800'>
        <h4 className='font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2'>
          <BarChart3 className='h-5 w-5' />
          <span>AI Feedback</span>
        </h4>
        <p className='text-gray-700 dark:text-gray-300 leading-relaxed'>
          {evaluation.feedback || 'Response evaluated successfully.'}
        </p>
      </div>

      {/* Transcribed Text for Audio Questions */}
      {isAudioBasedQuestion && transcribedText && (
        <div className='bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800'>
          <h4 className='font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2'>
            <Volume2 className='h-5 w-5' />
            <span>Transcribed Audio</span>
          </h4>
          <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700'>
            <p className='text-purple-700 dark:text-purple-300 italic leading-relaxed'>
              "{transcribedText}"
            </p>
          </div>
        </div>
      )}

      {/* Fill in the Blanks Detailed Results */}
      {isFillInTheBlanksQuestion &&
        evaluation.detailedAnalysis?.blankResults && (
          <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700'>
            <h4 className='font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2'>
              <Target className='h-5 w-5' />
              <span>Blank-by-Blank Analysis</span>
            </h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {Object.entries(evaluation.detailedAnalysis.blankResults).map(
                ([blankKey, result]: [string, any]) => (
                  <div
                    key={blankKey}
                    className={`p-4 rounded-lg border ${
                      result.isCorrect
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm font-medium text-gray-900 dark:text-white'>
                        {blankKey.replace('blank', 'Blank ')}
                      </span>
                      {result.isCorrect ? (
                        <CheckCircle className='h-4 w-4 text-green-600 dark:text-green-400' />
                      ) : (
                        <XCircle className='h-4 w-4 text-red-600 dark:text-red-400' />
                      )}
                    </div>
                    <div className='space-y-1 text-sm'>
                      <div>
                        <span className='text-gray-600 dark:text-gray-400'>
                          Your answer:{' '}
                        </span>
                        <span
                          className={`font-medium ${
                            result.isCorrect
                              ? 'text-green-700 dark:text-green-300'
                              : 'text-red-700 dark:text-red-300'
                          }`}
                        >
                          {result.userAnswer || '(not selected)'}
                        </span>
                      </div>
                      {!result.isCorrect && (
                        <div>
                          <span className='text-gray-600 dark:text-gray-400'>
                            Correct answer:{' '}
                          </span>
                          <span className='font-medium text-green-700 dark:text-green-300'>
                            {result.correctAnswer}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Summary stats for fill in the blanks */}
            <div className='mt-4 grid grid-cols-3 gap-4 text-center'>
              <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                <div className='text-lg font-bold text-blue-600 dark:text-blue-400'>
                  {evaluation.detailedAnalysis.correctCount}
                </div>
                <div className='text-xs text-gray-600 dark:text-gray-300'>
                  Correct
                </div>
              </div>
              <div className='p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                <div className='text-lg font-bold text-gray-600 dark:text-gray-400'>
                  {evaluation.detailedAnalysis.totalBlanks}
                </div>
                <div className='text-xs text-gray-600 dark:text-gray-300'>
                  Total
                </div>
              </div>
              <div className='p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
                <div className='text-lg font-bold text-purple-600 dark:text-purple-400'>
                  {Math.round(evaluation.detailedAnalysis.accuracy || 0)}%
                </div>
                <div className='text-xs text-gray-600 dark:text-gray-300'>
                  Accuracy
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Detailed Analysis */}
      {evaluation.detailedAnalysis &&
        Object.keys(evaluation.detailedAnalysis).length > 0 && (
          <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700'>
            <h4 className='font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2'>
              <TrendingUp className='h-5 w-5' />
              <span>Detailed Analysis</span>
            </h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {Object.entries(evaluation.detailedAnalysis)
                .filter(
                  ([key, value]) =>
                    key !== 'error' &&
                    key !== 'blankResults' && // Don't show this here as it's shown above
                    key !== 'userOrder' &&
                    key !== 'correctOrder' &&
                    key !== 'userWords' &&
                    key !== 'correctWords' &&
                    value !== null &&
                    value !== undefined
                )
                .map(([key, value]) => (
                  <div
                    key={key}
                    className='flex justify-between items-center py-2 px-3 bg-white dark:bg-gray-700 rounded-lg'
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
                              : key.includes('time') || key.includes('Time')
                              ? 's'
                              : ''
                          }`
                        : typeof value === 'boolean'
                        ? value
                          ? 'Yes'
                          : 'No'
                        : Array.isArray(value)
                        ? `${value.length} items`
                        : String(value).length > 50
                        ? String(value).substring(0, 50) + '...'
                        : String(value)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

      {/* Improvement Suggestions */}
      {evaluation.suggestions &&
        Array.isArray(evaluation.suggestions) &&
        evaluation.suggestions.length > 0 && (
          <div className='bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800'>
            <h4 className='font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2'>
              <Lightbulb className='h-5 w-5' />
              <span>Improvement Tips</span>
            </h4>
            <div className='space-y-3'>
              {evaluation.suggestions.map(
                (suggestion: string, index: number) => (
                  <div
                    key={index}
                    className='flex items-start space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-yellow-200 dark:border-yellow-700'
                  >
                    <div className='bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0'>
                      {index + 1}
                    </div>
                    <p className='text-gray-700 dark:text-gray-300 leading-relaxed'>
                      {suggestion}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default QuestionResponseEvaluator;
