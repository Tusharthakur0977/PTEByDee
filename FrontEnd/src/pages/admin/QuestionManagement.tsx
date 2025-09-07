import {
  Edit,
  Pause,
  Play,
  Plus,
  Search,
  Trash2,
  Volume2,
  FileText,
  Image as ImageIcon,
  Clock,
  Users,
  HelpCircle,
  X,
  Save,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { questionsService } from '../../services/questions';
import QuestionForm from '../../components/QuestionForm';
import QuestionPreview from '../../components/QuestionPreview';

interface Question {
  id: string;
  questionCode: string;
  textContent?: string;
  audioUrl?: string;
  imageUrl?: string;
  options?: any;
  correctAnswers?: any;
  wordCountMin?: number;
  wordCountMax?: number;
  durationMillis?: number;
  originalTextWithErrors?: string;
  incorrectWords?: any;
  orderInTest: number;
  createdAt: string;
  updatedAt: string;
  questionType: {
    id: string;
    name: string;
    description?: string;
    pteSection: {
      id: string;
      name: string;
    };
  };
  test: {
    id: string;
    title: string;
    testType: string;
  };
  responseCount: number;
}

interface QuestionType {
  id: string;
  name: string;
  description?: string;
  expectedTimePerQuestion?: number;
  questionCount: number;
}

interface Test {
  id: string;
  title: string;
  description?: string;
  testType: string;
  totalDuration: number;
  isFree: boolean;
  _count: {
    questions: number;
    testAttempts: number;
  };
}

const QuestionManagement: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionTypes, setQuestionTypes] = useState<any>({});
  const [tests, setTests] = useState<Test[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuestionType, setSelectedQuestionType] = useState('');
  const [selectedTest, setSelectedTest] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(
    null
  );

  // Audio player state
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [
    currentPage,
    searchTerm,
    selectedQuestionType,
    selectedTest,
    selectedSection,
  ]);

  const fetchInitialData = async () => {
    try {
      const [questionTypesData, testsData] = await Promise.all([
        questionsService.getQuestionTypes(),
        questionsService.getTests(),
      ]);

      setQuestionTypes(questionTypesData.data.groupedBySection);
      setTests(testsData.data);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError('Failed to load question types and tests');
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      if (selectedQuestionType) {
        filters.questionType = selectedQuestionType;
      }
      if (selectedTest) {
        filters.testId = selectedTest;
      }
      if (selectedSection) {
        filters.sectionId = selectedSection;
      }

      const response = await questionsService.getQuestions(filters);

      if (response.success) {
        setQuestions(response.data.questions);
        setPagination(response.data.pagination);
      } else {
        setError(response.message);
      }
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      setError(error.response?.data?.message || 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async (data: any) => {
    try {
      const response = await questionsService.createQuestion(data);
      if (response.success) {
        setShowCreateModal(false);
        fetchQuestions();
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Error creating question:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to create question'
      );
    }
  };

  const handleUpdateQuestion = async (data: any) => {
    if (!editingQuestion) return;

    try {
      const response = await questionsService.updateQuestion(
        editingQuestion.id,
        data
      );
      if (response.success) {
        setEditingQuestion(null);
        fetchQuestions();
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Error updating question:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to update question'
      );
    }
  };

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;

    try {
      const response = await questionsService.deleteQuestion(
        questionToDelete.id
      );
      if (response.success) {
        setQuestions(questions.filter((q) => q.id !== questionToDelete.id));
        setShowDeleteModal(false);
        setQuestionToDelete(null);
      } else {
        setError(response.message);
      }
    } catch (error: any) {
      console.error('Error deleting question:', error);
      setError(error.response?.data?.message || 'Failed to delete question');
    }
  };

  const handleAudioPlay = (audioUrl: string, questionId: string) => {
    if (playingAudio === questionId) {
      setPlayingAudio(null);
      const audio = document.getElementById(
        `audio-${questionId}`
      ) as HTMLAudioElement;
      if (audio) audio.pause();
    } else {
      setPlayingAudio(questionId);
      const audio = document.getElementById(
        `audio-${questionId}`
      ) as HTMLAudioElement;
      if (audio) {
        audio.play();
        audio.onended = () => setPlayingAudio(null);
      }
    }
  };

  const formatQuestionTypeName = (name: string) => {
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getQuestionTypeColor = (typeName: string) => {
    const colors: { [key: string]: string } = {
      read_aloud:
        'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      repeat_sentence:
        'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
      describe_image:
        'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      re_tell_lecture:
        'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      answer_short_question:
        'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800',
      summarize_written_text:
        'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      write_essay:
        'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
    };
    return (
      colors[typeName.toLowerCase()] ||
      'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600'
    );
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Header */}
      <div className='bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700'>
        <div className='container mx-auto px-4 py-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                Question Management
              </h1>
              <p className='text-gray-600 dark:text-gray-300 mt-1'>
                Manage PTE practice questions across all sections
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors'
            >
              <Plus className='w-5 h-5' />
              Add Question
            </button>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 py-8'>
        {/* Error Message */}
        {error && (
          <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6'>
            {error}
          </div>
        )}

        {/* Filters */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {/* Search */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
              <input
                type='text'
                placeholder='Search questions...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              />
            </div>

            {/* PTE Section Filter */}
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
            >
              <option value=''>All Sections</option>
              {Object.keys(questionTypes).map((sectionName) => (
                <option
                  key={sectionName}
                  value={questionTypes[sectionName].section?.id}
                >
                  {sectionName}
                </option>
              ))}
            </select>

            {/* Question Type Filter */}
            <select
              value={selectedQuestionType}
              onChange={(e) => setSelectedQuestionType(e.target.value)}
              className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
            >
              <option value=''>All Question Types</option>
              {Object.values(questionTypes).flatMap((section: any) =>
                section.questionTypes.map((qt: QuestionType) => (
                  <option
                    key={qt.name}
                    value={qt.name}
                  >
                    {formatQuestionTypeName(qt.name)}
                  </option>
                ))
              )}
            </select>

            {/* Test Filter */}
            <select
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
            >
              <option value=''>All Tests</option>
              {tests.map((test) => (
                <option
                  key={test.id}
                  value={test.id}
                >
                  {test.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Questions List */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg'>
          <div className='px-6 py-4 border-b dark:border-gray-700'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Questions ({pagination?.totalQuestions || 0})
            </h2>
          </div>

          {loading ? (
            <div className='p-8 text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
              <p className='text-gray-500 dark:text-gray-400 mt-2'>
                Loading questions...
              </p>
            </div>
          ) : questions.length === 0 ? (
            <div className='p-8 text-center'>
              <HelpCircle className='h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                No questions found
              </h3>
              <p className='text-gray-500 dark:text-gray-400 mb-4'>
                {searchTerm ||
                selectedQuestionType ||
                selectedTest ||
                selectedSection
                  ? 'No questions match your current filters'
                  : 'Create your first question to get started'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200'
              >
                Create First Question
              </button>
            </div>
          ) : (
            <div className='divide-y divide-gray-200 dark:divide-gray-700'>
              {questions.map((question) => (
                <QuestionPreview
                  key={question.id}
                  question={question}
                  onEdit={() => setEditingQuestion(question)}
                  onDelete={() => {
                    setQuestionToDelete(question);
                    setShowDeleteModal(true);
                  }}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className='px-6 py-4 border-t dark:border-gray-700'>
              <div className='flex items-center justify-between'>
                <div className='text-sm text-gray-700 dark:text-gray-300'>
                  Showing {(pagination.currentPage - 1) * pagination.limit + 1}{' '}
                  to{' '}
                  {Math.min(
                    pagination.currentPage * pagination.limit,
                    pagination.totalQuestions
                  )}{' '}
                  of {pagination.totalQuestions} results
                </div>
                <div className='flex items-center space-x-2'>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700'
                  >
                    Previous
                  </button>
                  <span className='px-4 py-2 text-gray-600 dark:text-gray-300'>
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700'
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Question Modal */}
      {showCreateModal && (
        <QuestionForm
          questionTypes={questionTypes}
          tests={tests}
          onSubmit={handleCreateQuestion}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <QuestionForm
          question={editingQuestion}
          questionTypes={questionTypes}
          tests={tests}
          onSubmit={handleUpdateQuestion}
          onCancel={() => setEditingQuestion(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && questionToDelete && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full'>
            <h3 className='text-lg font-bold text-gray-900 dark:text-white mb-4'>
              Confirm Delete
            </h3>
            <p className='text-gray-600 dark:text-gray-300 mb-6'>
              Are you sure you want to delete question "
              {questionToDelete.questionCode}"? This action cannot be undone.
            </p>
            <div className='flex items-center justify-end space-x-3'>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setQuestionToDelete(null);
                }}
                className='px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteQuestion}
                className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200'
              >
                Delete Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionManagement;
