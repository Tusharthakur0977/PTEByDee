import React from 'react';
import {
  X,
  Award,
  Target,
  TrendingUp,
  Lightbulb,
  BarChart3,
  Volume2,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface AIReportModalProps {
  response: any;
  question: any;
  onClose: () => void;
}

const AIReportModal: React.FC<AIReportModalProps> = ({
  response,
  question,
  onClose,
}) => {

  console.log(response, 'SSSS');
  

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isAudioBasedQuestion = [
    'READ_aloud',
    'repeat_sentence',
    'describe_image',
    're_tell_lecture',
    'answer_short_question',
  ].includes(question.questionType.toLowerCase());

  const ScoreIcon = getScoreIcon(response.score);

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 rounded-t-xl'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
                AI Evaluation Report
              </h2>
              <p className='text-gray-600 dark:text-gray-300'>
                {question.questionCode} -{' '}
                {new Date(response.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className='p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
            >
              <X className='w-6 h-6' />
            </button>
          </div>
        </div>

        <div className='p-6 space-y-6'>
          {/* Overall Score */}
          <div
            className={`rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${getScoreBg(
              response.score
            )}`}
          >
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-4'>
                <div
                  className={`p-4 rounded-full ${getScoreBg(response.score)}`}
                >
                  <ScoreIcon
                    className={`h-8 w-8 ${getScoreColor(response.score)}`}
                  />
                </div>
                <div>
                  <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
                    {getPerformanceMessage(response.score)}
                  </h3>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    {question.questionType
                      .replace(/_/g, ' ')
                      .toLowerCase()
                      .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </p>
                </div>
              </div>
              <div className='text-right'>
                <div
                  className={`text-4xl font-bold ${getScoreColor(
                    response.score
                  )}`}
                >
                  {Math.round(response.score)}
                </div>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  {response.score >= 65 ? 'PASS' : 'NEEDS IMPROVEMENT'}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4'>
              <div
                className={`h-3 rounded-full transition-all duration-1000 ${
                  response.score >= 85
                    ? 'bg-green-500'
                    : response.score >= 65
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${response.score}%` }}
              ></div>
            </div>

            {/* Quick Stats */}
            <div className='grid grid-cols-3 gap-4 text-center'>
              <div>
                <div className='flex items-center justify-center space-x-1 mb-1'>
                  <Clock className='h-4 w-4 text-gray-600 dark:text-gray-400' />
                  <span className='text-sm font-medium text-gray-900 dark:text-white'>
                    {formatTime(response.timeTakenSeconds)}
                  </span>
                </div>
                <div className='text-xs text-gray-600 dark:text-gray-300'>
                  Time Taken
                </div>
              </div>
              <div>
                <div className='flex items-center justify-center space-x-1 mb-1'>
                  {response.isCorrect ? (
                    <CheckCircle className='h-4 w-4 text-green-600 dark:text-green-400' />
                  ) : (
                    <XCircle className='h-4 w-4 text-red-600 dark:text-red-400' />
                  )}
                  <span className='text-sm font-medium text-gray-900 dark:text-white'>
                    {response.isCorrect ? 'Correct' : 'Incorrect'}
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
                    {question.difficultyLevel}
                  </span>
                </div>
                <div className='text-xs text-gray-600 dark:text-gray-300'>
                  Difficulty
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
              {response.aiFeedback ||
                'No specific feedback available for this response.'}
            </p>
          </div>

          {/* Transcribed Text for Audio Questions */}
          {isAudioBasedQuestion && response.transcribedText && (
            <div className='bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800'>
              <h4 className='font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2'>
                <Volume2 className='h-5 w-5' />
                <span>Transcribed Audio</span>
              </h4>
              <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700'>
                <div className='flex items-center space-x-2 mb-2'>
                  <FileText className='h-4 w-4 text-purple-600 dark:text-purple-400' />
                  <span className='text-sm font-medium text-purple-800 dark:text-purple-300'>
                    What we heard:
                  </span>
                </div>
                <p className='text-purple-700 dark:text-purple-300 italic leading-relaxed'>
                  "{response.transcribedText}"
                </p>
              </div>
            </div>
          )}

          {/* Detailed Analysis */}
          {response.detailedAnalysis &&
            Object.keys(response.detailedAnalysis).length > 0 && (
              <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700'>
                <h4 className='font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2'>
                  <TrendingUp className='h-5 w-5' />
                  <span>Detailed Analysis</span>
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {Object.entries(response.detailedAnalysis)
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
              </div>
            )}

          {/* Improvement Suggestions */}
          {response.suggestions &&
            Array.isArray(response.suggestions) &&
            response.suggestions.length > 0 && (
              <div className='bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800'>
                <h4 className='font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2'>
                  <Lightbulb className='h-5 w-5' />
                  <span>Improvement Tips</span>
                </h4>
                <div className='space-y-3'>
                  {response.suggestions.map(
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
      </div>
    </div>
  );
};

export default AIReportModal;
