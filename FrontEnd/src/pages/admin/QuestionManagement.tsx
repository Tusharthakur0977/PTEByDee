import {
  Plus,
  Search,
  HelpCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { questionsService } from '../../services/questions';
import QuestionForm from '../../components/QuestionForm';
import QuestionPreview from '../../components/QuestionPreview';

const panelClass =
  'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';
const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-800';

interface Question {
  id: string;
  questionCode: string;
  textContent?: string;
  questionStatement?: string;
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
  tags?: string[];
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
        if (response.data?.archived) {
          setError(response.message);
          fetchQuestions();
        } else {
          setQuestions((prev) =>
            prev.filter((q) => q.id !== questionToDelete.id)
          );
        }
      } else {
        setError(response.message);
      }
    } catch (error: any) {
      console.error('Error deleting question:', error);
      setError(error.response?.data?.message || 'Failed to delete question');
    } finally {
      setShowDeleteModal(false);
      setQuestionToDelete(null);
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        {error && (
          <div className='mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300'>
            {error}
          </div>
        )}

        <div className={`${panelClass} overflow-hidden`}>
          <div className='border-b border-slate-200 p-5 dark:border-slate-800'>
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between'>
                <div>
                  <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                    Questions
                  </h2>
                  <p className='mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100'>
                    {pagination?.totalQuestions || 0} records
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className='inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                >
                  <Plus className='w-4 h-4' />
                  Add Question
                </button>
              </div>

              <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400' />
                  <input
                    type='text'
                    placeholder='Search questions...'
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={`${inputClass} pl-10 pr-4`}
                  />
                </div>

                <select
                  value={selectedSection}
                  onChange={(e) => {
                    setSelectedSection(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={inputClass}
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

                <select
                  value={selectedQuestionType}
                  onChange={(e) => {
                    setSelectedQuestionType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={inputClass}
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

                <select
                  value={selectedTest}
                  onChange={(e) => {
                    setSelectedTest(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={inputClass}
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
          </div>

          {loading ? (
            <div className='p-10 text-center'>
              <div className='mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100'></div>
              <p className='mt-3 text-sm text-slate-500 dark:text-slate-400'>
                Loading questions...
              </p>
            </div>
          ) : questions.length === 0 ? (
            <div className='p-10 text-center'>
              <HelpCircle className='mx-auto mb-4 h-14 w-14 text-slate-300 dark:text-slate-700' />
              <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
                No questions found
              </h3>
              <p className='mb-4 mt-2 text-sm text-slate-500 dark:text-slate-400'>
                {searchTerm ||
                selectedQuestionType ||
                selectedTest ||
                selectedSection
                  ? 'No questions match your current filters'
                  : 'Create your first question to get started'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className='rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
              >
                Create First Question
              </button>
            </div>
          ) : (
            <div className='divide-y divide-slate-200 dark:divide-slate-800'>
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
            <div className='border-t border-slate-200 px-6 py-4 dark:border-slate-800'>
              <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
                <div className='text-sm text-slate-500 dark:text-slate-400'>
                  Showing {(pagination.currentPage - 1) * pagination.limit + 1}{' '}
                  to{' '}
                  {Math.min(
                    pagination.currentPage * pagination.limit,
                    pagination.totalQuestions
                  )}{' '}
                  of {pagination.totalQuestions} results
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className='rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                  >
                    Previous
                  </button>
                  <span className='px-2 py-2 text-sm text-slate-500 dark:text-slate-400'>
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className='rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
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
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm'>
          <div className='w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900'>
            <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
              Delete question
            </h3>
            <p className='mb-6 mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400'>
              Are you sure you want to delete question "
              {questionToDelete.questionCode}"? This action cannot be undone.
            </p>
            <div className='flex items-center justify-end gap-3'>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setQuestionToDelete(null);
                }}
                className='rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteQuestion}
                className='rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700'
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
