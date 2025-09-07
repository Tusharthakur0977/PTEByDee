import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  TrendingUp,
  Lightbulb,
  BarChart3,
} from 'lucide-react';

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
    if (score >= 85) return 'Excellent performance!';
    if (score >= 65) return 'Good performance!';
    return 'Needs improvement';
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center space-x-3'>
          <div className={`p-3 rounded-full ${getScoreBg(evaluation.score)}`}>
            {evaluation.isCorrect ? (
              <CheckCircle
                className={`h-6 w-6 ${getScoreColor(evaluation.score)}`}
              />
            ) : (
              <XCircle
                className={`h-6 w-6 ${getScoreColor(evaluation.score)}`}
              />
            )}
          </div>
          <div>
            <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
              Evaluation Results
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
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            {getPerformanceMessage(evaluation.score)}
          </p>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className='mb-6'>
        <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3'>
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              evaluation.score >= 85
                ? 'bg-green-500'
                : evaluation.score >= 65
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${evaluation.score}%` }}
          ></div>
        </div>
        <div className='flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2'>
          <span>0%</span>
          <span>65% (Pass)</span>
          <span>100%</span>
        </div>
      </div>

      {/* Feedback */}
      <div className='mb-6'>
        <h4 className='font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2'>
          <BarChart3 className='h-5 w-5' />
          <span>AI Feedback</span>
        </h4>
        <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4'>
          <p className='text-gray-700 dark:text-gray-300 leading-relaxed'>
            {evaluation.feedback}
          </p>
        </div>
      </div>

      {/* Detailed Analysis */}
      {evaluation.detailedAnalysis &&
        Object.keys(evaluation.detailedAnalysis).length > 0 && (
          <div className='mb-6'>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className='flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium'
            >
              <TrendingUp className='h-4 w-4' />
              <span>{showDetails ? 'Hide' : 'Show'} Detailed Analysis</span>
            </button>

            {showDetails && (
              <div className='mt-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {Object.entries(evaluation.detailedAnalysis).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className='flex justify-between items-center'
                      >
                        <span className='text-sm font-medium text-gray-700 dark:text-gray-300 capitalize'>
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className='text-sm text-gray-900 dark:text-white'>
                          {typeof value === 'number'
                            ? `${Math.round(value)}${
                                key.includes('score') ||
                                key.includes('accuracy')
                                  ? '%'
                                  : ''
                              }`
                            : String(value)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      {/* Suggestions */}
      {evaluation.suggestions && evaluation.suggestions.length > 0 && (
        <div>
          <h4 className='font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2'>
            <Lightbulb className='h-5 w-5' />
            <span>Improvement Suggestions</span>
          </h4>
          <div className='space-y-2'>
            {evaluation.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className='flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800'
              >
                <div className='bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5'>
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
