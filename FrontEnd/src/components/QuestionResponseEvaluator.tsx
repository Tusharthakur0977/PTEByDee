import {
  Award,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
  TrendingUp,
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
}

const QuestionResponseEvaluator: React.FC<QuestionResponseEvaluatorProps> = ({
  evaluation,
  questionType,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);

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
    if (score >= 85) return 'Excellent!';
    if (score >= 65) return 'Good job!';
    return 'Keep practicing!';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 85) return Award;
    if (score >= 65) return Target;
    return TrendingUp;
  };

  const ScoreIcon = getScoreIcon(evaluation.score);

  return (
    <div
      className={`bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      {/* Compact Header */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center space-x-3'>
          <div className={`p-3 rounded-full ${getScoreBg(evaluation.score)}`}>
            <ScoreIcon
              className={`h-6 w-6 ${getScoreColor(evaluation.score)}`}
            />
          </div>
          <div>
            <h3 className='text-lg font-bold text-gray-900 dark:text-white'>
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
            className={`text-3xl font-bold ${getScoreColor(evaluation.score)}`}
          >
            {Math.round(evaluation.score)}%
          </div>
          <p className='text-xs text-gray-600 dark:text-gray-400'>
            {evaluation.score >= 65 ? 'PASS' : 'NEEDS IMPROVEMENT'}
          </p>
        </div>
      </div>

      {/* Compact Score Breakdown */}
      <div className='mb-4'>
        <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              evaluation.score >= 85
                ? 'bg-green-500'
                : evaluation.score >= 65
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${evaluation.score}%` }}
          ></div>
        </div>
        <div className='flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1'>
          <span>0%</span>
          <span>65% (Pass)</span>
          <span>100%</span>
        </div>
      </div>

      {/* Feedback */}
      <div className='mb-4'>
        <h4 className='font-semibold text-gray-900 dark:text-white mb-2 flex items-center space-x-2'>
          <BarChart3 className='h-4 w-4' />
          <span>AI Feedback</span>
        </h4>
        <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
          <p className='text-gray-700 dark:text-gray-300 leading-relaxed text-sm'>
            {evaluation.feedback}
          </p>
        </div>
      </div>

      {/* Detailed Analysis Toggle */}
      {evaluation.detailedAnalysis &&
        Object.keys(evaluation.detailedAnalysis).length > 0 && (
          <div className='mb-4'>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className='flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm'
            >
              <TrendingUp className='h-4 w-4' />
              <span>Detailed Analysis</span>
              {showDetails ? (
                <ChevronUp className='h-4 w-4' />
              ) : (
                <ChevronDown className='h-4 w-4' />
              )}
            </button>

            {showDetails && (
              <div className='mt-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  {Object.entries(evaluation.detailedAnalysis)
                    .filter(
                      ([key, value]) =>
                        key !== 'error' &&
                        key !== 'placeholder' &&
                        value !== null &&
                        value !== undefined
                    )
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className='flex justify-between items-center py-1'
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
                                key.includes('Accuracy')
                                  ? '%'
                                  : key.includes('Count') ||
                                    key.includes('Time')
                                  ? ''
                                  : ''
                              }`
                            : typeof value === 'boolean'
                            ? value
                              ? 'Yes'
                              : 'No'
                            : String(value)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

      {/* Suggestions */}
      {evaluation.suggestions && evaluation.suggestions.length > 0 && (
        <div>
          <h4 className='font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2'>
            <Lightbulb className='h-4 w-4' />
            <span>Improvement Tips</span>
          </h4>
          <div className='space-y-2'>
            {evaluation.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className='flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800'
              >
                <div className='bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0'>
                  {index + 1}
                </div>
                <p className='text-yellow-800 dark:text-yellow-200 text-sm leading-relaxed'>
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
