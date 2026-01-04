import {
  AlertCircle,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader,
  Volume2,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  getQuestionPreviousResponses,
  getQuestionResponseStats,
  PreviousResponse,
  QuestionResponseStats,
} from '../services/questionResponse';

interface PreviousResponsesProps {
  questionId: string;
  onViewResponse: (response: PreviousResponse) => void;
  className?: string;
}

const PreviousResponses: React.FC<PreviousResponsesProps> = ({
  questionId,
  onViewResponse,
  className = '',
}) => {
  const [responses, setResponses] = useState<PreviousResponse[]>([]);
  const [stats, setStats] = useState<QuestionResponseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResponses, setTotalResponses] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [questionType, setQuestionType] = useState<string>('');

  const fetchData = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both responses and stats in parallel
      const [responsesData, statsData] = await Promise.all([
        getQuestionPreviousResponses(questionId, {
          page,
          limit: 5,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
        getQuestionResponseStats(questionId),
      ]);

      setResponses(responsesData.responses);
      setStats(statsData);
      setQuestionType(responsesData.question.questionType);
      setCurrentPage(responsesData.pagination.currentPage);
      setTotalPages(responsesData.pagination.totalPages);
      setTotalResponses(responsesData.pagination.totalResponses);
    } catch (err: any) {
      console.error('Error fetching previous responses:', err);
      setError(err.message || 'Failed to load previous responses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (questionId) {
      fetchData(1);
    }
  }, [questionId]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchData(page);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isAudioQuestion = (): boolean => {
    const audioQuestionTypes = [
      'READ_ALOUD',
      'REPEAT_SENTENCE',
      'DESCRIBE_IMAGE',
      'RE_TELL_LECTURE',
      'ANSWER_SHORT_QUESTION',
      'SUMMARIZE_SPOKEN_TEXT',
    ];
    return audioQuestionTypes.includes(questionType);
  };

  const getScoreDisplay = (response: PreviousResponse): string => {
    const { score, maxScore } = getScoreAndMax(response);

    if (maxScore > 0) {
      return `${score}/${maxScore}`;
    }

    if (score > 0) {
      return `${score}`;
    }

    return '';
  };

  const getScoreAndMax = (
    response: PreviousResponse
  ): { score: number; maxScore: number } => {
    if (!response.detailedAnalysis) {
      return { score: response.questionScore || 0, maxScore: 0 };
    }

    const analysis = response.detailedAnalysis;

    // Audio questions (Read Aloud, Repeat Sentence, Describe Image, Re-tell Lecture, Answer Short Question, Summarize Spoken Text)
    if (
      (analysis.contentScore !== undefined ||
        analysis.pronunciationScore !== undefined) &&
      questionType !== 'SUMMARIZE_WRITTEN_TEXT' &&
      questionType !== 'WRITE_ESSAY'
    ) {
      const contentScore = analysis.contentScore || 0;
      const pronunciationScore = analysis.pronunciationScore || 0;
      const fluencyScore =
        analysis.fluencyScore || analysis.oralFluencyScore || 0;
      const totalScore = contentScore + pronunciationScore + fluencyScore;

      const contentMax = analysis.contentMaxScore || 5;
      const pronunciationMax = analysis.pronunciationMaxScore || 5;
      const fluencyMax =
        analysis.fluencyMaxScore || analysis.oralFluencyMaxScore || 5;
      const totalMax = contentMax + pronunciationMax + fluencyMax;

      return { score: totalScore, maxScore: totalMax };
    }

    // Writing questions (Summarize Written Text, Write Essay)
    if (analysis.scores) {
      const scores = analysis.scores;
      let totalScore = 0;
      let totalMax = 0;

      Object.values(scores).forEach((component: any) => {
        if (
          component &&
          typeof component === 'object' &&
          'score' in component &&
          'max' in component
        ) {
          totalScore += component.score || 0;
          totalMax += component.max || 0;
        }
      });

      if (totalMax > 0) {
        return { score: totalScore, maxScore: totalMax };
      }
    }

    // Fill in the Blanks and Listening Fill in the Blanks
    if (analysis.totalBlanks !== undefined) {
      const correctCount = analysis.correctCount || response.questionScore || 0;
      return { score: correctCount, maxScore: analysis.totalBlanks };
    }

    // Multiple Choice questions
    if (analysis.totalOptions !== undefined) {
      const correctCount = response.questionScore || 0;
      return { score: correctCount, maxScore: analysis.totalOptions };
    }

    // Fallback: if we have a score but no max, return what we have
    return { score: response.questionScore || 0, maxScore: 0 };
  };

  const calculateScorePercentage = (response: PreviousResponse): number => {
    const { score, maxScore } = getScoreAndMax(response);
    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  };

  const getScoreBgColor = (response: PreviousResponse): string => {
    // if (response.isCorrect === true) {
    //   return 'bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/40 dark:to-green-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-sm';
    // }
    // if (response.isCorrect === false) {
    //   return 'bg-gradient-to-r from-rose-100 to-red-100 dark:from-rose-900/40 dark:to-red-900/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 shadow-sm';
    // }

    // Calculate percentage based on actual score vs total marks
    const percentage = calculateScorePercentage(response);

    if (percentage >= 80) {
      return 'bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/40 dark:to-green-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-sm';
    }
    if (percentage >= 60) {
      return 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-sm';
    }
    if (percentage >= 40) {
      return 'bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700/60 shadow-sm';
    }
    return 'bg-gradient-to-r from-rose-100 to-red-100 dark:from-rose-900/40 dark:to-red-900/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 shadow-sm';
  };

  const getResponsePreview = (response: PreviousResponse): string => {
    if (response.textResponse) {
      return response.textResponse.length > 60
        ? response.textResponse.substring(0, 60) + '...'
        : response.textResponse;
    }
    if (response.audioResponseUrl) {
      return 'Audio Response';
    }
    if (response.selectedOptions && response.selectedOptions.length > 0) {
      return response.selectedOptions.join(', ');
    }
    if (response.orderedItems && response.orderedItems.length > 0) {
      return 'Reordered Items';
    }
    if (response.highlightedWords && response.highlightedWords.length > 0) {
      return `Highlighted: ${response.highlightedWords.join(', ')}`;
    }
    return 'No response data';
  };

  if (loading) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}
      >
        <div className='flex items-center justify-center space-x-3'>
          <Loader className='h-5 w-5 animate-spin text-blue-600' />
          <span className='text-gray-600 dark:text-gray-400'>
            Loading previous responses...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}
      >
        <div className='flex items-center space-x-3 text-red-600 dark:text-red-400'>
          <AlertCircle className='h-5 w-5' />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (totalResponses === 0) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}
      >
        <div className='text-center text-gray-500 dark:text-gray-400'>
          <BarChart3 className='h-12 w-12 mx-auto mb-3 opacity-50' />
          <p className='text-lg font-medium mb-2'>No Previous Attempts</p>
          <p className='text-sm'>
            This is your first time attempting this question.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm ${className}`}
    >
      {/* Enhanced Header */}
      <div className='px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-t-xl'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg'>
              <BarChart3 className='h-5 w-5 text-blue-600 dark:text-blue-400' />
            </div>
            <div>
              <h3 className='text-base font-semibold text-gray-900 dark:text-white'>
                Previous Attempts
              </h3>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                {totalResponses} {totalResponses === 1 ? 'attempt' : 'attempts'}{' '}
                recorded
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Responses List */}
      <div className='divide-y divide-gray-200 dark:divide-gray-700'>
        {responses.map((response, index) => {
          const attemptNumber = (currentPage - 1) * 5 + index + 1;
          const scoreDisplay = getScoreDisplay(response);

          return (
            <div
              key={response.id}
              className='px-6 py-5 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-200 group'
            >
              {/* Top Row: Attempt Number, Date, Score */}
              <div className='flex items-center justify-between mb-3'>
                <div className='flex items-center space-x-4'>
                  {/* Attempt Number Badge */}
                  <div className='flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm'>
                    <span className='text-xs font-bold text-white'>
                      {attemptNumber}
                    </span>
                  </div>

                  {/* Date with Icon */}
                  <div className='flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400'>
                    <Calendar className='h-4 w-4 text-gray-400 dark:text-gray-500' />
                    <span className='font-medium'>
                      {formatDate(response.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Score Badge */}
                {scoreDisplay && (
                  <div
                    className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${getScoreBgColor(
                      response
                    )}`}
                  >
                    {scoreDisplay}
                  </div>
                )}
              </div>

              {/* Bottom Row: Audio Player (if audio question) or Response Preview, View Button */}
              <div className='flex items-center justify-between gap-4'>
                <div className='flex-1 min-w-0'>
                  {isAudioQuestion() && response.audioResponseUrl ? (
                    <div className='flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-800/50'>
                      <Volume2 className='h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0' />
                      <audio
                        controls
                        src={response.audioResponseUrl}
                        className='h-7 flex-1 min-w-0 accent-blue-600 dark:accent-blue-400'
                        onPlay={() => setPlayingAudioId(response.id)}
                        onPause={() => setPlayingAudioId(null)}
                        preload='metadata'
                      />
                    </div>
                  ) : (
                    <div className='bg-gray-50 dark:bg-gray-700/50 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600'>
                      <p className='text-sm text-gray-700 dark:text-gray-300 truncate'>
                        {getResponsePreview(response)}
                      </p>
                    </div>
                  )}
                </div>

                {/* View Button */}
                <button
                  onClick={() => onViewResponse(response)}
                  className='flex-shrink-0 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-600 dark:hover:from-blue-600 dark:hover:to-indigo-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105'
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className='px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl'>
          <div className='flex items-center justify-between'>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className='flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200'
            >
              <ChevronLeft className='h-4 w-4' />
              <span>Previous</span>
            </button>

            <div className='flex items-center space-x-2'>
              <span className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                Page
              </span>
              <span className='px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg font-semibold text-sm'>
                {currentPage}
              </span>
              <span className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                of {totalPages}
              </span>
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className='flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200'
            >
              <span>Next</span>
              <ChevronRight className='h-4 w-4' />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviousResponses;
