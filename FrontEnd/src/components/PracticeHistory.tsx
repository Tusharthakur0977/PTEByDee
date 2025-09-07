import {
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Image as ImageIcon,
  Search,
  Volume2,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type {
  PracticeHistoryFilters,
  PracticeResponse,
} from '../services/practice';
import { getPracticeHistory } from '../services/practice';
import { PteQuestionTypeName } from '../types/pte';

const PracticeHistory: React.FC = () => {
  const [responses, setResponses] = useState<PracticeResponse[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<PracticeHistoryFilters>({
    page: 1,
    limit: 15,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  useEffect(() => {
    fetchHistory();
  }, [filters]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getPracticeHistory(filters);
      setResponses(data.responses);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to fetch practice history'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (
    key: keyof PracticeHistoryFilters,
    value: any
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value,
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400';
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getQuestionTypeIcon = (questionType: PteQuestionTypeName) => {
    if (questionType.includes('READING')) return FileText;
    if (questionType.includes('LISTENING')) return Volume2;
    if (questionType === 'DESCRIBE_IMAGE') return ImageIcon;
    return FileText;
  };

  if (error) {
    return (
      <div className='text-center py-8'>
        <div className='text-red-500 mb-4'>
          <XCircle className='h-12 w-12 mx-auto' />
        </div>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
          Error Loading History
        </h3>
        <p className='text-gray-600 dark:text-gray-300 mb-6'>{error}</p>
        <button
          onClick={fetchHistory}
          className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200'
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Compact Header */}
      <div className='text-center'>
        <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-2'>
          Practice History
        </h2>
        <p className='text-sm text-gray-600 dark:text-gray-300'>
          Review your practice sessions and track progress
        </p>
      </div>

      {/* Compact Filters */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
            <input
              type='text'
              placeholder='Search...'
              className='w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
            />
          </div>

          <select
            value={filters.questionType || ''}
            onChange={(e) =>
              handleFilterChange('questionType', e.target.value || undefined)
            }
            className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
          >
            <option value=''>All Types</option>
            {Object.values(PteQuestionTypeName).map((type) => (
              <option
                key={type}
                value={type}
              >
                {type
                  .split('_')
                  .map(
                    (word) =>
                      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                  )
                  .join(' ')}
              </option>
            ))}
          </select>

          <input
            type='date'
            value={filters.dateFrom || ''}
            onChange={(e) =>
              handleFilterChange('dateFrom', e.target.value || undefined)
            }
            className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
          />

          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleFilterChange('sortBy', sortBy);
              handleFilterChange('sortOrder', sortOrder as 'asc' | 'desc');
            }}
            className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
          >
            <option value='createdAt-desc'>Newest First</option>
            <option value='createdAt-asc'>Oldest First</option>
            <option value='score-desc'>Highest Score</option>
            <option value='score-asc'>Lowest Score</option>
            <option value='timeTakenSeconds-asc'>Fastest Time</option>
            <option value='timeTakenSeconds-desc'>Slowest Time</option>
          </select>
        </div>
      </div>

      {/* History List */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden'>
        <div className='p-4 border-b dark:border-gray-700'>
          <h3 className='font-semibold text-gray-900 dark:text-white'>
            Practice Responses ({pagination?.totalResponses || 0})
          </h3>
        </div>

        {isLoading ? (
          <div className='p-8 text-center'>
            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-4'></div>
            <p className='text-gray-600 dark:text-gray-300'>
              Loading history...
            </p>
          </div>
        ) : responses.length === 0 ? (
          <div className='p-8 text-center'>
            <BarChart3 className='h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
              No Practice History
            </h3>
            <p className='text-gray-600 dark:text-gray-300'>
              Start practicing to see your progress here
            </p>
          </div>
        ) : (
          <>
            <div className='divide-y divide-gray-200 dark:divide-gray-700'>
              {responses.map((response) => {
                const IconComponent = getQuestionTypeIcon(
                  response.questionType
                );
                return (
                  <div
                    key={response.id}
                    className='p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex items-start space-x-3'>
                        <div
                          className={`p-2 rounded-lg ${
                            response.isCorrect
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : 'bg-red-100 dark:bg-red-900/30'
                          }`}
                        >
                          <IconComponent
                            className={`h-4 w-4 ${
                              response.isCorrect
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          />
                        </div>
                        <div className='flex-1'>
                          <div className='flex items-center space-x-2 mb-1'>
                            <h4 className='font-medium text-gray-900 dark:text-white text-sm'>
                              {response.questionCode}
                            </h4>
                            <span className='px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full'>
                              {response.questionTypeName}
                            </span>
                          </div>

                          {response.questionPreview.textContent && (
                            <p className='text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-1'>
                              {response.questionPreview.textContent}
                            </p>
                          )}

                          <div className='flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400'>
                            <div className='flex items-center space-x-1'>
                              <Clock className='h-3 w-3' />
                              <span>
                                {formatTime(response.timeTakenSeconds)}
                              </span>
                            </div>
                            <div className='flex items-center space-x-1'>
                              <Calendar className='h-3 w-3' />
                              <span>
                                {new Date(
                                  response.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            {response.questionPreview.hasAudio && (
                              <div className='flex items-center space-x-1'>
                                <Volume2 className='h-3 w-3' />
                                <span>Audio</span>
                              </div>
                            )}
                            {response.questionPreview.hasImage && (
                              <div className='flex items-center space-x-1'>
                                <ImageIcon className='h-3 w-3' />
                                <span>Image</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className='text-right'>
                        <div className='flex items-center space-x-2 mb-1'>
                          {response.isCorrect ? (
                            <CheckCircle className='h-4 w-4 text-green-600 dark:text-green-400' />
                          ) : (
                            <XCircle className='h-4 w-4 text-red-600 dark:text-red-400' />
                          )}
                          <span
                            className={`font-semibold text-sm ${getScoreColor(
                              response.score
                            )}`}
                          >
                            {Math.round(response.score * 100)}%
                          </span>
                        </div>
                        <div className='text-xs text-gray-500 dark:text-gray-400'>
                          {response.isCorrect ? 'Correct' : 'Incorrect'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Compact Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className='px-4 py-3 border-t dark:border-gray-700'>
                <div className='flex items-center justify-between'>
                  <div className='text-sm text-gray-700 dark:text-gray-300'>
                    {(pagination.currentPage - 1) * pagination.limit + 1}-
                    {Math.min(
                      pagination.currentPage * pagination.limit,
                      pagination.totalResponses
                    )}{' '}
                    of {pagination.totalResponses}
                  </div>
                  <div className='flex items-center space-x-2'>
                    <button
                      onClick={() =>
                        handleFilterChange('page', pagination.currentPage - 1)
                      }
                      disabled={!pagination.hasPrevPage}
                      className='p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700'
                    >
                      <ChevronLeft className='h-4 w-4' />
                    </button>
                    <span className='px-3 py-1 text-sm text-gray-600 dark:text-gray-300'>
                      {pagination.currentPage} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() =>
                        handleFilterChange('page', pagination.currentPage + 1)
                      }
                      disabled={!pagination.hasNextPage}
                      className='p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700'
                    >
                      <ChevronRight className='h-4 w-4' />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PracticeHistory;
