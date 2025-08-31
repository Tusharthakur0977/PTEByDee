import { Edit, Pause, Play, Plus, Search, Trash2, Volume2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import api from '../../services/api';

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

interface PteSection {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  questionTypes: QuestionType[];
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuestionType, setSelectedQuestionType] = useState('');
  const [selectedTest, setSelectedTest] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
    fetchQuestionTypes();
    fetchTests();
  }, [
    currentPage,
    searchTerm,
    selectedQuestionType,
    selectedTest,
    selectedSection,
  ]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        ...(selectedQuestionType && { questionType: selectedQuestionType }),
        ...(selectedTest && { testId: selectedTest }),
        ...(selectedSection && { sectionId: selectedSection }),
      });

      const response = await api.get(`/admin/questions?${params}`);
      setQuestions(response.data.questions);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionTypes = async () => {
    try {
      const response = await api.get('/admin/question-types');
      setQuestionTypes(response.data.groupedBySection);
    } catch (error) {
      console.error('Error fetching question types:', error);
    }
  };

  const fetchTests = async () => {
    try {
      const response = await api.get('/admin/tests');
      setTests(response.data);
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this question? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await api.delete(`/admin/questions/${questionId}`);
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const handleAudioPlay = (audioUrl: string, questionId: string) => {
    if (playingAudio === questionId) {
      setPlayingAudio(null);
      // Pause audio
      const audio = document.getElementById(
        `audio-${questionId}`
      ) as HTMLAudioElement;
      if (audio) audio.pause();
    } else {
      setPlayingAudio(questionId);
      // Play audio
      const audio = document.getElementById(
        `audio-${questionId}`
      ) as HTMLAudioElement;
      if (audio) {
        audio.play();
        audio.onended = () => setPlayingAudio(null);
      }
    }
  };

  const getQuestionTypeColor = (typeName: string) => {
    const colors: { [key: string]: string } = {
      READ_aloud: 'bg-blue-100 text-blue-800',
      repeat_sentence: 'bg-green-100 text-green-800',
      describe_image: 'bg-purple-100 text-purple-800',
      re_tell_lecture: 'bg-orange-100 text-orange-800',
      answer_short_question: 'bg-pink-100 text-pink-800',
      summarize_written_text: 'bg-indigo-100 text-indigo-800',
      write_essay: 'bg-red-100 text-red-800',
      multiple_choice_single_answer_reading: 'bg-cyan-100 text-cyan-800',
      multiple_choice_multiple_answers_reading: 'bg-teal-100 text-teal-800',
      re_order_paragraphs: 'bg-yellow-100 text-yellow-800',
      reading_fill_in_the_blanks: 'bg-lime-100 text-lime-800',
      reading_writing_fill_in_the_blanks: 'bg-emerald-100 text-emerald-800',
      summarize_spoken_text: 'bg-violet-100 text-violet-800',
      multiple_choice_single_answer_listening: 'bg-rose-100 text-rose-800',
      multiple_choice_multiple_answers_listening: 'bg-amber-100 text-amber-800',
      listening_fill_in_the_blanks: 'bg-sky-100 text-sky-800',
      highlight_correct_summary: 'bg-slate-100 text-slate-800',
      select_missing_word: 'bg-zinc-100 text-zinc-800',
      highlight_incorrect_words: 'bg-stone-100 text-stone-800',
      write_from_dictation: 'bg-neutral-100 text-neutral-800',
    };
    return colors[typeName.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const formatQuestionTypeName = (name: string) => {
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex justify-between items-center'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Question Management
              </h1>
              <p className='text-gray-600 mt-2'>
                Manage PTE practice questions across all sections
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className='bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors'
            >
              <Plus className='w-5 h-5' />
              Add Question
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {/* Search */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
              <input
                type='text'
                placeholder='Search questions...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
              />
            </div>

            {/* PTE Section Filter */}
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
            >
              <option value=''>All Sections</option>
              {/* {Object.keys(questionTypes).map((sectionName) => (
                <option
                  key={sectionName}
                  value={questionTypes[sectionName].section.id}
                >
                  {sectionName}
                </option>
              ))} */}
            </select>

            {/* Question Type Filter */}
            <select
              value={selectedQuestionType}
              onChange={(e) => setSelectedQuestionType(e.target.value)}
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
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
              className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
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
        <div className='bg-white rounded-xl shadow-sm border border-gray-200'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h2 className='text-lg font-semibold text-gray-900'>Questions</h2>
          </div>

          {loading ? (
            <div className='p-8 text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto'></div>
              <p className='text-gray-500 mt-2'>Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className='p-8 text-center'>
              <p className='text-gray-500'>
                No questions found. Create your first question to get started.
              </p>
            </div>
          ) : (
            <div className='divide-y divide-gray-200'>
              {questions.map((question) => (
                <div
                  key={question.id}
                  className='p-6 hover:bg-gray-50 transition-colors'
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-3'>
                        <h3 className='text-lg font-semibold text-gray-900'>
                          {question.questionCode}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getQuestionTypeColor(
                            question.questionType.name
                          )}`}
                        >
                          {formatQuestionTypeName(question.questionType.name)}
                        </span>
                        <span className='px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700'>
                          {question.questionType.pteSection.name}
                        </span>
                      </div>

                      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4'>
                        <div>
                          <p className='text-sm text-gray-600 mb-1'>
                            Test: {question.test.title}
                          </p>
                          <p className='text-sm text-gray-600 mb-1'>
                            Order: #{question.orderInTest}
                          </p>
                          <p className='text-sm text-gray-600'>
                            Responses: {question.responseCount}
                          </p>
                        </div>

                        <div>
                          {question.wordCountMin && question.wordCountMax && (
                            <p className='text-sm text-gray-600 mb-1'>
                              Word Count: {question.wordCountMin}-
                              {question.wordCountMax}
                            </p>
                          )}
                          {question.durationMillis && (
                            <p className='text-sm text-gray-600 mb-1'>
                              Duration:{' '}
                              {Math.round(question.durationMillis / 1000)}s
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Question Content Preview */}
                      <div className='space-y-3'>
                        {question.textContent && (
                          <div className='bg-gray-50 p-3 rounded-lg'>
                            <p className='text-sm font-medium text-gray-700 mb-1'>
                              Text Content:
                            </p>
                            <p className='text-sm text-gray-600 line-clamp-3'>
                              {question.textContent}
                            </p>
                          </div>
                        )}

                        {question.audioUrl && (
                          <div className='bg-blue-50 p-3 rounded-lg'>
                            <div className='flex items-center justify-between'>
                              <p className='text-sm font-medium text-blue-700'>
                                Audio Content:
                              </p>
                              <button
                                onClick={() =>
                                  handleAudioPlay(
                                    question.audioUrl!,
                                    question.id
                                  )
                                }
                                className='flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
                              >
                                {playingAudio === question.id ? (
                                  <Pause className='w-4 h-4' />
                                ) : (
                                  <Play className='w-4 h-4' />
                                )}
                                <Volume2 className='w-4 h-4' />
                              </button>
                            </div>
                            <audio
                              id={`audio-${question.id}`}
                              src={question.audioUrl}
                              className='hidden'
                              onEnded={() => setPlayingAudio(null)}
                            />
                          </div>
                        )}

                        {question.imageUrl && (
                          <div className='bg-purple-50 p-3 rounded-lg'>
                            <p className='text-sm font-medium text-purple-700 mb-2'>
                              Image Content:
                            </p>
                            <img
                              src={question.imageUrl}
                              alt='Question'
                              className='max-w-xs h-32 object-cover rounded-lg border border-purple-200'
                            />
                          </div>
                        )}

                        {question.options && (
                          <div className='bg-green-50 p-3 rounded-lg'>
                            <p className='text-sm font-medium text-green-700 mb-1'>
                              Options:
                            </p>
                            <p className='text-sm text-green-600'>
                              {Array.isArray(question.options)
                                ? `${question.options.length} options available`
                                : 'Options configured'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className='flex items-center gap-2 ml-4'>
                      <button
                        onClick={() => setEditingQuestion(question)}
                        className='p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors'
                        title='Edit Question'
                      >
                        <Edit className='w-5 h-5' />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className='p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                        title='Delete Question'
                      >
                        <Trash2 className='w-5 h-5' />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='px-6 py-4 border-t border-gray-200 flex items-center justify-between'>
              <div className='text-sm text-gray-700'>
                Page {currentPage} of {totalPages}
              </div>
              <div className='flex gap-2'>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className='px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className='px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Question Modal */}
      {(showCreateModal || editingQuestion) && (
        <QuestionModal
          question={editingQuestion}
          questionTypes={questionTypes}
          tests={tests}
          onClose={() => {
            setShowCreateModal(false);
            setEditingQuestion(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingQuestion(null);
            fetchQuestions();
          }}
        />
      )}
    </div>
  );
};

interface QuestionModalProps {
  question?: Question | null;
  questionTypes: any;
  tests: Test[];
  onClose: () => void;
  onSuccess: () => void;
}

const QuestionModal: React.FC<QuestionModalProps> = ({
  question,
  questionTypes,
  tests,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    questionCode: question?.questionCode || '',
    questionTypeId: question?.questionType.id || '',
    testId: question?.test.id || '',
    orderInTest: question?.orderInTest || 1,
    textContent: question?.textContent || '',
    audioKey: question?.audioUrl || '',
    imageUrl: question?.imageUrl || '',
    options: question?.options || null,
    correctAnswers: question?.correctAnswers || null,
    wordCountMin: question?.wordCountMin || null,
    wordCountMax: question?.wordCountMax || null,
    durationMillis: question?.durationMillis || null,
    originalTextWithErrors: question?.originalTextWithErrors || '',
    incorrectWords: question?.incorrectWords || null,
  });

  const [loading, setLoading] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [selectedQuestionType, setSelectedQuestionType] =
    useState<QuestionType | null>(null);

  useEffect(() => {
    if (formData.questionTypeId) {
      // Find the selected question type
      const foundType = Object.values(questionTypes)
        .flatMap((section: any) => section.questionTypes)
        .find((qt: QuestionType) => qt.id === formData.questionTypeId);
      setSelectedQuestionType(foundType || null);
    }
  }, [formData.questionTypeId, questionTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (question) {
        await api.put(`/admin/questions/${question.id}`, formData);
      } else {
        await api.post('/admin/questions', formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAudioUpload = async (file: File) => {
    setUploadingAudio(true);
    try {
      const formData = new FormData();
      formData.append('questionAudio', file);

      const response = await api.post(
        '/admin/upload/question-audio',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setFormData((prev) => ({
        ...prev,
        audioKey: response.data.audioKey,
      }));
    } catch (error) {
      console.error('Error uploading audio:', error);
    } finally {
      setUploadingAudio(false);
    }
  };

  const requiresAudio =
    selectedQuestionType?.name &&
    [
      'REPEAT_SENT_ENCE',
      'RE_TELL_LECTURE',
      'ANSWER_SHORT_QUESTION',
      'SUMMARIZE_SPOKEN_TEXT',
      'MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING',
      'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING',
      'LISTENING_FILL_IN_THE_BLANKS',
      'HIGHLIGHT_CORRECT_SUMMARY',
      'SELECT_MISSING_WORD',
      'WRITE_FROM_DICTATION',
    ].includes(selectedQuestionType.name);

  const requiresImage = selectedQuestionType?.name === 'DESCRIBE_IMAGE';

  const requiresText =
    selectedQuestionType?.name &&
    [
      'READ_ALOUD',
      'SUMMARIZE_WRITTEN_TEXT',
      'WRITE_ESSAY',
      'MULTIPLE_CHOICE_SINGLE_ANSWER_READING',
      'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING',
      'READING_FILL_IN_THE_BLANKS',
      'READING_WRITING_FILL_IN_THE_BLANKS',
      'RE_ORDER_PARAGRAPHS',
    ].includes(selectedQuestionType.name);

  const requiresOptions =
    selectedQuestionType?.name &&
    [
      'MULTIPLE_CHOICE_SINGLE_ANSWER_READING',
      'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING',
      'MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING',
      'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING',
      'HIGHLIGHT_CORRECT_SUMMARY',
      'SELECT_MISSING_WORD',
    ].includes(selectedQuestionType.name);

  const requiresWordCount =
    selectedQuestionType?.name &&
    ['SUMMARIZE_WRITTEN_TEXT', 'WRITE_ESSAY', 'SUMMARIZE_SPOKEN_TEXT'].includes(
      selectedQuestionType.name
    );

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900'>
            {question ? 'Edit Question' : 'Create New Question'}
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className='p-6 space-y-6'
        >
          {/* Basic Information */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Question Code *
              </label>
              <input
                type='text'
                value={formData.questionCode}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    questionCode: e.target.value,
                  }))
                }
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                placeholder='e.g., RA_001_Test1'
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Order in Test
              </label>
              <input
                type='number'
                value={formData.orderInTest}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    orderInTest: parseInt(e.target.value),
                  }))
                }
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                min='1'
              />
            </div>
          </div>

          {/* Question Type and Test */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Question Type *
              </label>
              <select
                value={formData.questionTypeId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    questionTypeId: e.target.value,
                  }))
                }
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                required
              >
                <option value=''>Select Question Type</option>
                {Object.entries(questionTypes).map(
                  ([sectionName, section]: [string, any]) => (
                    <optgroup
                      key={sectionName}
                      label={sectionName}
                    >
                      {section.questionTypes.map((qt: QuestionType) => (
                        <option
                          key={qt.id}
                          value={qt.id}
                        >
                          {/* {formatQuestionTypeName(qt.name)} */}
                          {qt.name}
                        </option>
                      ))}
                    </optgroup>
                  )
                )}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Test *
              </label>
              <select
                value={formData.testId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, testId: e.target.value }))
                }
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                required
              >
                <option value=''>Select Test</option>
                {tests.map((test) => (
                  <option
                    key={test.id}
                    value={test.id}
                  >
                    {test.title} ({test.testType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Content Fields Based on Question Type */}
          {requiresText && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Text Content *
              </label>
              <textarea
                value={formData.textContent}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    textContent: e.target.value,
                  }))
                }
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                rows={6}
                placeholder='Enter the text content for this question...'
                required
              />
            </div>
          )}

          {requiresAudio && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Audio File *
              </label>
              <div className='border-2 border-dashed border-gray-300 rounded-lg p-6'>
                {formData.audioKey ? (
                  <div className='text-center'>
                    <Volume2 className='w-12 h-12 text-green-600 mx-auto mb-2' />
                    <p className='text-sm text-green-600 font-medium'>
                      Audio uploaded successfully
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>
                      {formData.audioKey}
                    </p>
                    <button
                      type='button'
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, audioKey: '' }))
                      }
                      className='mt-2 text-sm text-red-600 hover:text-red-700'
                    >
                      Remove Audio
                    </button>
                  </div>
                ) : (
                  <div className='text-center'>
                    <Volume2 className='w-12 h-12 text-gray-400 mx-auto mb-2' />
                    <p className='text-sm text-gray-600 mb-2'>
                      Upload audio file
                    </p>
                    <input
                      type='file'
                      accept='audio/*'
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAudioUpload(file);
                      }}
                      className='hidden'
                      id='audio-upload'
                      disabled={uploadingAudio}
                    />
                    <label
                      htmlFor='audio-upload'
                      className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer ${
                        uploadingAudio ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploadingAudio ? 'Uploading...' : 'Choose Audio File'}
                    </label>
                    <p className='text-xs text-gray-500 mt-2'>
                      Supported formats: MP3, WAV, OGG, M4A, AAC (Max: 50MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {requiresImage && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Image URL *
              </label>
              <input
                type='url'
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
                }
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                placeholder='https://example.com/image.jpg'
                required
              />
            </div>
          )}

          {requiresWordCount && (
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Minimum Word Count *
                </label>
                <input
                  type='number'
                  value={formData.wordCountMin || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      wordCountMin: parseInt(e.target.value) || null,
                    }))
                  }
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  min='1'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Maximum Word Count *
                </label>
                <input
                  type='number'
                  value={formData.wordCountMax || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      wordCountMax: parseInt(e.target.value) || null,
                    }))
                  }
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  min='1'
                  required
                />
              </div>
            </div>
          )}

          {requiresOptions && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Options (JSON Format) *
              </label>
              <textarea
                value={
                  formData.options
                    ? JSON.stringify(formData.options, null, 2)
                    : ''
                }
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setFormData((prev) => ({ ...prev, options: parsed }));
                  } catch {
                    // Invalid JSON, keep the text for editing
                  }
                }}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm'
                rows={4}
                placeholder='[{"text": "Option A", "isCorrect": true}, {"text": "Option B", "isCorrect": false}]'
                required
              />
            </div>
          )}

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Correct Answers (JSON Format)
            </label>
            <textarea
              value={
                formData.correctAnswers
                  ? JSON.stringify(formData.correctAnswers, null, 2)
                  : ''
              }
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setFormData((prev) => ({ ...prev, correctAnswers: parsed }));
                } catch {
                  // Invalid JSON, keep the text for editing
                }
              }}
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm'
              rows={3}
              placeholder='["answer1", "answer2"] or "single answer"'
            />
          </div>

          {/* Action Buttons */}
          <div className='flex justify-end gap-4 pt-6 border-t border-gray-200'>
            <button
              type='button'
              onClick={onClose}
              className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading || uploadingAudio}
              className='px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {loading
                ? 'Saving...'
                : question
                ? 'Update Question'
                : 'Create Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionManagement;
