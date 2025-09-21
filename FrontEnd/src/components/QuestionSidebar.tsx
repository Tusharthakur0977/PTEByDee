import {
  BarChart3,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  Filter,
  Search,
  X,
  Play,
  History,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getQuestionList } from '../services/portal';
import { PteQuestionTypeName } from '../types/pte';

interface QuestionSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  questionType: PteQuestionTypeName;
  selectedQuestionId?: string;
  onQuestionSelect: (
    questionId: string,
    action?: 'practice' | 'history'
  ) => void;
  practiceStatus: 'practiced' | 'unpracticed' | 'all';
  difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD' | 'all';
  onFilterChange: (filters: {
    practiceStatus: 'practiced' | 'unpracticed' | 'all';
    difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD' | 'all';
  }) => void;
  className?: string;
}

const QuestionSidebar: React.FC<QuestionSidebarProps> = ({
  isOpen,
  onClose,
  questionType,
  selectedQuestionId,
  onQuestionSelect,
  practiceStatus,
  difficultyLevel,
  onFilterChange,
  className = '',
}) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (isOpen && questionType) {
      fetchQuestions();
    }
  }, [isOpen, questionType, practiceStatus, difficultyLevel]);

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const filters: any = {};
      if (difficultyLevel !== 'all') {
        filters.difficultyLevel = difficultyLevel;
      }
      if (practiceStatus !== 'all') {
        filters.practiceStatus = practiceStatus;
      }

      const response = await getQuestionList(questionType, filters);
      setQuestions(response.questions);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load questions');
      console.error('Error fetching question list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'MEDIUM':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'HARD':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 dark:text-green-400';
    if (score >= 65) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const filteredQuestions = questions.filter((question) =>
    question.questionCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className='fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden'
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${className}`}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b dark:border-gray-700'>
          <div>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Questions
            </h3>
            <p className='text-sm text-gray-600 dark:text-gray-300'>
              {questionType
                .replace(/_/g, ' ')
                .toLowerCase()
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </p>
          </div>
          <button
            onClick={onClose}
            className='p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* Search and Filters */}
        <div className='p-4 border-b dark:border-gray-700 space-y-3'>
          {/* Search */}
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
            <input
              type='text'
              placeholder='Search questions...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className='flex items-center justify-between w-full p-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
          >
            <div className='flex items-center space-x-2'>
              <Filter className='h-4 w-4' />
              <span>Filters</span>
            </div>
            {showFilters ? (
              <ChevronUp className='h-4 w-4' />
            ) : (
              <ChevronDown className='h-4 w-4' />
            )}
          </button>

          {/* Filters */}
          {showFilters && (
            <div className='space-y-3 pt-2'>
              <div>
                <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Practice Status
                </label>
                <select
                  value={practiceStatus}
                  onChange={(e) =>
                    onFilterChange({
                      practiceStatus: e.target.value as any,
                      difficultyLevel,
                    })
                  }
                  className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                >
                  <option value='all'>All Questions</option>
                  <option value='practiced'>Practiced</option>
                  <option value='unpracticed'>Unpracticed</option>
                </select>
              </div>

              <div>
                <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Difficulty Level
                </label>
                <select
                  value={difficultyLevel}
                  onChange={(e) =>
                    onFilterChange({
                      practiceStatus,
                      difficultyLevel: e.target.value as any,
                    })
                  }
                  className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                >
                  <option value='all'>All Levels</option>
                  <option value='EASY'>Easy</option>
                  <option value='MEDIUM'>Medium</option>
                  <option value='HARD'>Hard</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Questions List */}
        <div className='flex-1 overflow-y-auto'>
          {isLoading ? (
            <div className='p-4 text-center'>
              <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2'></div>
              <p className='text-sm text-gray-600 dark:text-gray-300'>
                Loading questions...
              </p>
            </div>
          ) : error ? (
            <div className='p-4 text-center'>
              <p className='text-sm text-red-600 dark:text-red-400 mb-2'>
                {error}
              </p>
              <button
                onClick={fetchQuestions}
                className='text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
              >
                Try Again
              </button>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className='p-4 text-center'>
              <Circle className='h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2' />
              <p className='text-sm text-gray-600 dark:text-gray-300'>
                {searchTerm
                  ? 'No questions match your search'
                  : 'No questions available'}
              </p>
            </div>
          ) : (
            <div className='p-2'>
              {filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className={`p-3 mb-2 rounded-lg border transition-all duration-200 ${
                    selectedQuestionId === question.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className='flex items-start justify-between mb-2'>
                    <div className='flex items-center space-x-2'>
                      <span className='font-medium text-gray-900 dark:text-white text-sm'>
                        {question.questionCode}
                      </span>
                      {question.hasUserResponses && (
                        <CheckCircle className='h-4 w-4 text-green-500' />
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(
                        question.difficultyLevel
                      )}`}
                    >
                      {question.difficultyLevel}
                    </span>
                  </div>

                  {question.hasUserResponses && (
                    <div className='flex items-center justify-between text-xs mb-3'>
                      <div className='flex items-center space-x-1'>
                        <BarChart3 className='h-3 w-3 text-gray-400' />
                        <span
                          className={`font-medium ${getScoreColor(
                            question.bestScore || 0
                          )}`}
                        >
                          Best: {Math.round(question.bestScore || 0)}%
                        </span>
                      </div>
                      <div className='flex items-center space-x-1 text-gray-500 dark:text-gray-400'>
                        <Clock className='h-3 w-3' />
                        <span>
                          {new Date(
                            question.lastAttemptedAt!
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {!question.hasUserResponses && (
                    <div className='text-xs text-gray-500 dark:text-gray-400 mb-3'>
                      Not attempted yet
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className='flex space-x-2'>
                    <button
                      onClick={() => onQuestionSelect(question.id, 'practice')}
                      className='flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors duration-200'
                    >
                      <Play className='h-3 w-3' />
                      <span>Practice</span>
                    </button>
                    {question.hasUserResponses && (
                      <button
                        onClick={() => onQuestionSelect(question.id, 'history')}
                        className='flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-md transition-colors duration-200'
                      >
                        <History className='h-3 w-3' />
                        <span>History</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className='p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700'>
          <div className='grid grid-cols-3 gap-2 text-center'>
            <div>
              <div className='text-lg font-bold text-gray-900 dark:text-white'>
                {filteredQuestions.length}
              </div>
              <div className='text-xs text-gray-600 dark:text-gray-300'>
                Total
              </div>
            </div>
            <div>
              <div className='text-lg font-bold text-green-600 dark:text-green-400'>
                {filteredQuestions.filter((q) => q.hasUserResponses).length}
              </div>
              <div className='text-xs text-gray-600 dark:text-gray-300'>
                Practiced
              </div>
            </div>
            <div>
              <div className='text-lg font-bold text-blue-600 dark:text-blue-400'>
                {filteredQuestions.filter((q) => !q.hasUserResponses).length}
              </div>
              <div className='text-xs text-gray-600 dark:text-gray-300'>
                New
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuestionSidebar;
