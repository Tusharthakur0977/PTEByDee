import {
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getQuestionWithResponses } from '../services/portal';
import AIReportModal from './AiReportModal';

interface QuestionResponseHistoryProps {
  questionId: string;
  onClose: () => void;
  className?: string;
}

const QuestionResponseHistory: React.FC<QuestionResponseHistoryProps> = ({
  questionId,
  onClose,
  className = '',
}) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [showAIReport, setShowAIReport] = useState(false);

  useEffect(() => {
    if (questionId) {
      fetchQuestionResponses();
    }
  }, [questionId]);

  const fetchQuestionResponses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getQuestionWithResponses(questionId);
      setData(response);
    } catch (err: any) {
      setError('Failed to load response history');
      console.error('Error fetching question responses:', err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleShowAIReport = (response: any) => {
    setSelectedResponse(response);
    setShowAIReport(true);
  };

  if (isLoading) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 ${className}`}
      >
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600 dark:text-gray-300'>
            Loading response history...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 ${className}`}
      >
        <div className='text-center'>
          <XCircle className='h-8 w-8 text-red-500 mx-auto mb-4' />
          <p className='text-red-600 dark:text-red-400 mb-4'>
            {error || 'Failed to load data'}
          </p>
          <button
            onClick={fetchQuestionResponses}
            className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { question, responses } = data;
  const bestScore = Math.max(...responses.map((r: any) => r.score), 0);
  const averageScore =
    responses.length > 0
      ? responses.reduce((sum: number, r: any) => sum + r.score, 0) /
        responses.length
      : 0;
  const totalAttempts = responses.length;
  const correctAttempts = responses.filter((r: any) => r.isCorrect).length;

  return (
    <>
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
      >
        {/* Header */}
        <div className='p-6 border-b dark:border-gray-700'>
          <div className='flex items-start justify-between'>
            <div>
              <h3 className='text-xl font-bold text-gray-900 dark:text-white mb-2'>
                {question.questionCode}
              </h3>
              <div className='flex items-center space-x-3'>
                <span className='px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full'>
                  {question.questionType
                    .replace(/_/g, ' ')
                    .toLowerCase()
                    .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </span>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    question.difficultyLevel === 'EASY'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : question.difficultyLevel === 'MEDIUM'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}
                >
                  {question.difficultyLevel}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className='p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
            >
              <X className='h-5 w-5' />
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className='p-6 border-b dark:border-gray-700'>
          <h4 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Performance Summary
          </h4>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
              <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                {totalAttempts}
              </div>
              <div className='text-xs text-gray-600 dark:text-gray-300'>
                Total Attempts
              </div>
            </div>
            <div className='text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
              <div className={`text-2xl font-bold ${getScoreColor(bestScore)}`}>
                {Math.round(bestScore)}%
              </div>
              <div className='text-xs text-gray-600 dark:text-gray-300'>
                Best Score
              </div>
            </div>
            <div className='text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
              <div className='text-2xl font-bold text-purple-600 dark:text-purple-400'>
                {Math.round(averageScore)}%
              </div>
              <div className='text-xs text-gray-600 dark:text-gray-300'>
                Average
              </div>
            </div>
            <div className='text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg'>
              <div className='text-2xl font-bold text-orange-600 dark:text-orange-400'>
                {Math.round((correctAttempts / totalAttempts) * 100)}%
              </div>
              <div className='text-xs text-gray-600 dark:text-gray-300'>
                Accuracy
              </div>
            </div>
          </div>
        </div>

        {/* Response History */}
        <div className='p-6'>
          <h4 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Response History ({responses.length})
          </h4>

          {responses.length === 0 ? (
            <div className='text-center py-8'>
              <Zap className='h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4' />
              <p className='text-gray-600 dark:text-gray-300'>
                No responses yet. Start practicing to see your history here.
              </p>
            </div>
          ) : (
            <div className='space-y-3 max-h-96 overflow-y-auto'>
              {responses.map((response: any, index: number) => (
                <div
                  key={response.id}
                  className={`border rounded-lg p-4 ${getScoreBg(
                    response.score
                  )} border-gray-200 dark:border-gray-600`}
                >
                  <div className='flex items-start justify-between mb-3'>
                    <div className='flex items-center space-x-3'>
                      <div className='flex items-center space-x-2'>
                        {response.isCorrect ? (
                          <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />
                        ) : (
                          <XCircle className='h-5 w-5 text-red-600 dark:text-red-400' />
                        )}
                        <span
                          className={`text-lg font-bold ${getScoreColor(
                            response.score
                          )}`}
                        >
                          {Math.round(response.score)}%
                        </span>
                      </div>
                      <span className='text-sm text-gray-600 dark:text-gray-300'>
                        Attempt #{responses.length - index}
                      </span>
                    </div>
                    <div className='text-right'>
                      <div className='flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mb-1'>
                        <Calendar className='h-3 w-3' />
                        <span>
                          {new Date(response.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className='flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400'>
                        <Clock className='h-3 w-3' />
                        <span>{formatTime(response.timeTakenSeconds)}</span>
                      </div>
                    </div>
                  </div>

                  {response.aiFeedback && (
                    <div className='mb-3'>
                      <p className='text-sm text-gray-700 dark:text-gray-300 line-clamp-2'>
                        {response.aiFeedback}
                      </p>
                    </div>
                  )}

                  {response.transcribedText && (
                    <div className='mb-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800'>
                      <p className='text-xs font-medium text-purple-800 dark:text-purple-300 mb-1'>
                        Transcribed Audio:
                      </p>
                      <p className='text-sm text-purple-700 dark:text-purple-300 italic'>
                        "{response.transcribedText}"
                      </p>
                    </div>
                  )}

                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      {response.suggestions &&
                        response.suggestions.length > 0 && (
                          <span className='text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-full'>
                            {response.suggestions.length} tips
                          </span>
                        )}
                    </div>
                    <button
                      onClick={() => handleShowAIReport(response)}
                      className='flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium'
                    >
                      <Eye className='h-4 w-4' />
                      <span>View AI Report</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Report Modal */}
      {showAIReport && selectedResponse && (
        <AIReportModal
          response={selectedResponse}
          question={question}
          onClose={() => {
            setShowAIReport(false);
            setSelectedResponse(null);
          }}
        />
      )}
    </>
  );
};

export default QuestionResponseHistory;
