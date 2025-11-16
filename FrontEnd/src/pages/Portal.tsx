import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle,
  Clock,
  Play,
  Zap,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import PracticeHistory from '../components/PracticeHistory';
import PracticeQuestion from '../components/PracticeQuestions';
import PracticeStatsOverview from '../components/PracticeStatsOverview';
import QuestionResponseHistory from '../components/QuestionResponseHistory';
import QuestionSidebar from '../components/QuestionSidebar';
import QuestionTypeSelector from '../components/QuestionTypeSelector';
import { mockTests } from '../data/mockPte';
import {
  getPracticeQuestions,
  getQuestionWithResponses,
} from '../services/portal';
import { getPracticeStats } from '../services/practice';
import { PteQuestionTypeName } from '../types/pte';

// Helper functions for question transformation
const getInstructionsForQuestionType = (questionType: string): string => {
  const instructions: { [key: string]: string } = {
    READ_ALOUD:
      'Look at the text below. In 40 seconds, you must read this text aloud as naturally and clearly as possible.',
    REPEAT_SENTENCE:
      'You will hear a sentence. Please repeat the sentence exactly as you hear it.',
    DESCRIBE_IMAGE:
      'Look at the image below. In 25 seconds, please speak into the microphone and describe in detail what the image is showing.',
    RE_TELL_LECTURE:
      'You will hear a lecture. After listening to the lecture, in 10 seconds, please speak into the microphone and retell what you have just heard from the lecture in your own words.',
    ANSWER_SHORT_QUESTION:
      'You will hear a question. Please give a simple and short answer.',
  };
  return instructions[questionType] || 'Complete the question as instructed.';
};

const getPreparationTimeForQuestionType = (questionType: string): number => {
  const preparationTimes: { [key: string]: number } = {
    READ_ALOUD: 35,
    REPEAT_SENTENCE: 0,
    DESCRIBE_IMAGE: 25,
    RE_TELL_LECTURE: 10,
    ANSWER_SHORT_QUESTION: 0,
  };
  return preparationTimes[questionType] || 0;
};

const getRecordingTimeForQuestionType = (questionType: string): number => {
  const recordingTimes: { [key: string]: number } = {
    READ_ALOUD: 40,
    REPEAT_SENTENCE: 15,
    DESCRIBE_IMAGE: 40,
    RE_TELL_LECTURE: 40,
    ANSWER_SHORT_QUESTION: 10,
  };
  return recordingTimes[questionType] || 40;
};

const Portal: React.FC = () => {
  const freeTests = mockTests.filter(
    (test: { isFree: boolean }) => test.isFree
  );
  const premiumTests = mockTests.filter(
    (test: { isFree: boolean }) => !test.isFree
  );
  const [activeTab, setActiveTab] = React.useState<
    'overview' | 'practice' | 'tests' | 'history'
  >('practice');
  const [selectedQuestionType, setSelectedQuestionType] =
    React.useState<PteQuestionTypeName | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [practiceQuestions, setPracticeQuestions] = React.useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = React.useState(false);
  const [questionError, setQuestionError] = React.useState<string | null>(null);
  const [practiceStats, setPracticeStats] = React.useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = React.useState(false);

  // New state for enhanced features
  const [showQuestionSidebar, setShowQuestionSidebar] = React.useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = React.useState<
    string | null
  >(null);
  const [showResponseHistory, setShowResponseHistory] = React.useState(false);
  const [selectedQuestionForPractice, setSelectedQuestionForPractice] =
    React.useState<any>(null);
  const [isLoadingSelectedQuestion, setIsLoadingSelectedQuestion] =
    React.useState(false);
  const [practiceFilters, setPracticeFilters] = React.useState({
    practiceStatus: 'all' as 'practiced' | 'unpracticed' | 'all',
    difficultyLevel: 'all' as 'EASY' | 'MEDIUM' | 'HARD' | 'all',
  });

  React.useEffect(() => {
    if (activeTab === 'overview') {
      fetchPracticeStats();
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (selectedQuestionType) {
      fetchPracticeQuestions();
    }
  }, [selectedQuestionType]);

  React.useEffect(() => {
    if (selectedQuestionType) {
      fetchPracticeQuestions();
    }
  }, [practiceFilters]);

  const fetchPracticeStats = async () => {
    try {
      setIsLoadingStats(true);
      const stats = await getPracticeStats();
      setPracticeStats(stats);
    } catch (error) {
      console.error('Error fetching practice stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchPracticeQuestions = async () => {
    if (!selectedQuestionType) return;

    try {
      setIsLoadingQuestions(true);
      setQuestionError(null);

      const options: any = {
        limit: 10,
        random: true,
      };

      if (practiceFilters.difficultyLevel !== 'all') {
        options.difficultyLevel = practiceFilters.difficultyLevel;
      }

      if (practiceFilters.practiceStatus !== 'all') {
        options.practiceStatus = practiceFilters.practiceStatus;
      }

      const response = await getPracticeQuestions(
        selectedQuestionType,
        options
      );
      setPracticeQuestions(response.questions);
      setCurrentQuestionIndex(0);
    } catch (error: any) {
      console.error('Error fetching practice questions:', error);
      setQuestionError(
        error.response?.data?.message || 'Failed to load practice questions'
      );
      setPracticeQuestions([]);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleQuestionComplete = (response: any) => {
    // Refresh stats if we're on overview tab
    if (activeTab === 'overview') {
      fetchPracticeStats();
    }

    // If we completed a selected question, go back to practice session
    if (selectedQuestionForPractice) {
      setSelectedQuestionForPractice(null);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < practiceQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // End of practice session
      setSelectedQuestionType(null);
      setCurrentQuestionIndex(0);
      setShowQuestionSidebar(false);
      setSelectedQuestionId(null);
      setShowResponseHistory(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const loadQuestionForPractice = async (questionId: string) => {
    try {
      setIsLoadingSelectedQuestion(true);
      const response = await getQuestionWithResponses(questionId);

      // Get question type from either new or old structure
      const questionData = response.question as any; // Use any to handle dynamic structure
      const questionType =
        questionData.type ||
        questionData.questionType ||
        questionData.rawQuestion?.questionType;
      const questionCode =
        questionData.questionCode || questionData.rawQuestion?.questionCode;

      // Transform the question data to match PracticeQuestion structure
      const transformedQuestion = {
        id: questionData.id,
        type: questionType as PteQuestionTypeName,
        difficultyLevel: questionData.difficultyLevel,
        title:
          questionData.title ||
          `${questionType?.replace(/_/g, ' ')} - ${questionCode}`,
        instructions:
          questionData.instructions ||
          getInstructionsForQuestionType(questionType),
        content: questionData.content || {
          text:
            questionData.textContent || questionData.rawQuestion?.textContent,
          questionStatement:
            questionData.questionStatement ||
            questionData.rawQuestion?.questionStatement,
          audioUrl: questionData.audioUrl || questionData.rawQuestion?.audioUrl,
          imageUrl: questionData.imageUrl || questionData.rawQuestion?.imageUrl,
          options: questionData.options || questionData.rawQuestion?.options,
          paragraphs: questionData.content?.paragraphs,
          blanks: questionData.content?.blanks,
          timeLimit:
            questionData.content?.timeLimit ||
            (questionType === 'SUMMARIZE_SPOKEN_TEXT' ||
            questionType === 'SUMMARIZE_WRITTEN_TEXT'
              ? 600 // 10 minutes for summarize spoken text and summarize written text
              : questionType === 'WRITE_ESSAY'
              ? 1200 // 20 minutes for write essay
              : Math.floor(
                  (questionData.durationMillis ||
                    questionData.rawQuestion?.durationMillis ||
                    300000) / 1000
                )),
          preparationTime: getPreparationTimeForQuestionType(questionType),
          recordingTime: getRecordingTimeForQuestionType(questionType),
          wordLimit:
            questionData.content?.wordLimit ||
            (questionData.wordCountMin && questionData.wordCountMax
              ? {
                  min: questionData.wordCountMin,
                  max: questionData.wordCountMax,
                }
              : undefined),
        },
        questionCode: questionCode,
      };

      setSelectedQuestionForPractice(transformedQuestion);
      setShowQuestionSidebar(false);
      setShowResponseHistory(false);
      setSelectedQuestionId(null);
    } catch (error: any) {
      console.error('Error loading question for practice:', error);
      setQuestionError(
        error.response?.data?.message || 'Failed to load question'
      );
    } finally {
      setIsLoadingSelectedQuestion(false);
    }
  };

  const handleQuestionSelect = (
    questionId: string,
    action: 'practice' | 'history' = 'history'
  ) => {
    if (action === 'practice') {
      loadQuestionForPractice(questionId);
    } else {
      setSelectedQuestionId(questionId);
      setShowResponseHistory(true);
      setShowQuestionSidebar(false);
      setSelectedQuestionForPractice(null);
    }
  };

  const handleFilterChange = (filters: {
    practiceStatus: 'practiced' | 'unpracticed' | 'all';
    difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD' | 'all';
  }) => {
    setPracticeFilters(filters);
  };
  const renderTabContent = () => {
    switch (activeTab) {
      case 'practice': {
        if (!selectedQuestionType) {
          return (
            <div className='relative'>
              <QuestionTypeSelector
                selectedType={selectedQuestionType}
                onTypeSelect={(type) => {
                  setSelectedQuestionType(type);
                  setShowQuestionSidebar(false);
                  setSelectedQuestionId(null);
                  setShowResponseHistory(false);
                  setSelectedQuestionForPractice(null);
                }}
              />
            </div>
          );
        }

        if (showResponseHistory && selectedQuestionId) {
          return (
            <div className='relative'>
              <QuestionResponseHistory
                questionId={selectedQuestionId}
                onClose={() => {
                  setShowResponseHistory(false);
                  setSelectedQuestionId(null);
                }}
              />
            </div>
          );
        }

        if (isLoadingQuestions) {
          return (
            <div className='text-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                Loading Questions
              </h3>
              <p className='text-gray-600 dark:text-gray-300'>
                Fetching practice questions for{' '}
                {selectedQuestionType?.replace(/_/g, ' ').toLowerCase()}...
              </p>
            </div>
          );
        }

        if (questionError) {
          return (
            <div className='text-center py-8'>
              <div className='text-red-400 dark:text-red-500 mb-4'>
                <BookOpen className='h-12 w-12 mx-auto' />
              </div>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                Error Loading Questions
              </h3>
              <p className='text-gray-600 dark:text-gray-300 mb-6'>
                {questionError}
              </p>
              <div className='space-x-4'>
                <button
                  onClick={fetchPracticeQuestions}
                  className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200'
                >
                  Try Again
                </button>
                <button
                  onClick={() => setSelectedQuestionType(null)}
                  className='border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200'
                >
                  Back to Question Types
                </button>
              </div>
            </div>
          );
        }

        if (practiceQuestions.length === 0) {
          return (
            <div className='text-center py-8'>
              <div className='text-gray-400 dark:text-gray-500 mb-4'>
                <BookOpen className='h-12 w-12 mx-auto' />
              </div>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                No questions available
              </h3>
              <p className='text-gray-600 dark:text-gray-300 mb-6'>
                No practice questions match your current filters for this
                question type.
              </p>
              <div className='space-x-4'>
                <button
                  onClick={() => {
                    setPracticeFilters({
                      practiceStatus: 'all',
                      difficultyLevel: 'all',
                    });
                  }}
                  className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200'
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => setSelectedQuestionType(null)}
                  className='border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200'
                >
                  Back to Question Types
                </button>
              </div>
            </div>
          );
        }

        // Determine which question to show
        const questionToShow =
          selectedQuestionForPractice ||
          practiceQuestions[currentQuestionIndex];
        const isShowingSelectedQuestion = !!selectedQuestionForPractice;

        if (isLoadingSelectedQuestion) {
          return (
            <div className='flex items-center justify-center py-12'>
              <div className='text-center'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
                <p className='text-gray-600 dark:text-gray-400'>
                  Loading question...
                </p>
              </div>
            </div>
          );
        }

        if (!questionToShow) {
          return (
            <div className='text-center py-12'>
              <p className='text-gray-600 dark:text-gray-400'>
                No question available
              </p>
            </div>
          );
        }

        return (
          <div className='space-y-4'>
            <div className='flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm'>
              <button
                onClick={() => {
                  if (isShowingSelectedQuestion) {
                    setSelectedQuestionForPractice(null);
                  } else {
                    setSelectedQuestionType(null);
                    setShowQuestionSidebar(false);
                    setSelectedQuestionId(null);
                    setShowResponseHistory(false);
                  }
                }}
                className='flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium'
              >
                <ArrowRight className='h-4 w-4 rotate-180' />
                <span>
                  {isShowingSelectedQuestion
                    ? 'Back to Practice Session'
                    : 'Back to Question Types'}
                </span>
              </button>
              <div className='flex items-center space-x-3'>
                {/* Filters */}
                <div className='flex items-center space-x-2'>
                  <select
                    value={practiceFilters.practiceStatus}
                    onChange={(e) =>
                      handleFilterChange({
                        ...practiceFilters,
                        practiceStatus: e.target.value as any,
                      })
                    }
                    className='text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  >
                    <option value='all'>All</option>
                    <option value='practiced'>Practiced</option>
                    <option value='unpracticed'>New</option>
                  </select>
                  <select
                    value={practiceFilters.difficultyLevel}
                    onChange={(e) =>
                      handleFilterChange({
                        ...practiceFilters,
                        difficultyLevel: e.target.value as any,
                      })
                    }
                    className='text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  >
                    <option value='all'>All Levels</option>
                    <option value='EASY'>Easy</option>
                    <option value='MEDIUM'>Medium</option>
                    <option value='HARD'>Hard</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowQuestionSidebar(true)}
                  className='flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium'
                >
                  <BarChart3 className='h-4 w-4' />
                  <span>All Questions</span>
                </button>

                <div className='text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full'>
                  {isShowingSelectedQuestion ? (
                    <span>
                      Selected Question: {questionToShow.questionCode}
                    </span>
                  ) : (
                    <span>
                      Question {currentQuestionIndex + 1} of{' '}
                      {practiceQuestions.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <PracticeQuestion
              question={questionToShow}
              onComplete={handleQuestionComplete}
              onNext={
                isShowingSelectedQuestion ? undefined : handleNextQuestion
              }
              onPrevious={
                isShowingSelectedQuestion ? undefined : handlePreviousQuestion
              }
              hasPrevious={
                !isShowingSelectedQuestion && currentQuestionIndex > 0
              }
            />
          </div>
        );
      }

      case 'history':
        return <PracticeHistory />;

      case 'tests':
        return renderTestsContent();

      default:
        return (
          <PracticeStatsOverview
            stats={practiceStats}
            isLoading={isLoadingStats}
            onRefresh={fetchPracticeStats}
          />
        );
    }
  };

  const renderTestsContent = () => (
    <div className='space-y-6'>
      {/* Available Tests */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Free Tests */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
              Free Practice Tests
            </h2>
            <span className='bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium'>
              Free Access
            </span>
          </div>
          <div className='space-y-4'>
            {freeTests.map((test) => (
              <div
                key={test.id}
                className='border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200'
              >
                <div className='flex items-start justify-between mb-3'>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-gray-900 dark:text-white mb-2'>
                      {test.title}
                    </h3>
                    <p className='text-gray-600 dark:text-gray-300 text-sm mb-3'>
                      {test.description}
                    </p>
                    <div className='flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400'>
                      <div className='flex items-center space-x-1'>
                        <Clock className='h-4 w-4' />
                        <span>{test.totalDuration} min</span>
                      </div>
                      <div className='flex items-center space-x-1'>
                        <BookOpen className='h-4 w-4' />
                        <span>{test.questions.length} questions</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className='flex space-x-2'>
                  <Link
                    to={`/portal/test/${test.id}/instructions`}
                    className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-1'
                  >
                    <Play className='h-4 w-4' />
                    <span>Start Test</span>
                  </Link>
                  <Link
                    to={`/portal/test/${test.id}/results`}
                    className='border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200'
                  >
                    View Results
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Tests */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
              Premium Tests
            </h2>
            <span className='bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-3 py-1 rounded-full text-sm font-medium'>
              Premium Only
            </span>
          </div>
          <div className='space-y-4'>
            {premiumTests.map((test) => (
              <div
                key={test.id}
                className='border dark:border-gray-700 rounded-lg p-4 relative overflow-hidden'
              >
                <div className='absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-transparent w-32 h-full opacity-10'></div>
                <div className='relative'>
                  <div className='flex items-start justify-between mb-3'>
                    <div className='flex-1'>
                      <h3 className='font-semibold text-gray-900 dark:text-white mb-2'>
                        {test.title}
                      </h3>
                      <p className='text-gray-600 dark:text-gray-300 text-sm mb-3'>
                        {test.description}
                      </p>
                      <div className='flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400'>
                        <div className='flex items-center space-x-1'>
                          <Clock className='h-4 w-4' />
                          <span>{test.totalDuration} min</span>
                        </div>
                        <div className='flex items-center space-x-1'>
                          <BookOpen className='h-4 w-4' />
                          <span>Advanced Level</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      <CheckCircle className='h-4 w-4 text-purple-600 dark:text-purple-400' />
                      <span className='text-sm text-purple-600 dark:text-purple-400 font-medium'>
                        Premium Features
                      </span>
                    </div>
                    <button className='bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200'>
                      Upgrade to Access
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Upgrade Card */}
            <div className='bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-4'>
              <h3 className='font-semibold mb-2'>Unlock Premium Tests</h3>
              <p className='text-purple-100 text-sm mb-3'>
                Get access to advanced practice tests, detailed analytics, and
                personalized feedback.
              </p>
              <ul className='space-y-1 text-sm text-purple-100 mb-3'>
                <li className='flex items-center space-x-2'>
                  <CheckCircle className='h-3 w-3' />
                  <span>20+ Premium Practice Tests</span>
                </li>
                <li className='flex items-center space-x-2'>
                  <CheckCircle className='h-3 w-3' />
                  <span>Detailed Performance Analytics</span>
                </li>
                <li className='flex items-center space-x-2'>
                  <CheckCircle className='h-3 w-3' />
                  <span>AI-Powered Feedback</span>
                </li>
              </ul>
              <button className='bg-white text-purple-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors duration-200'>
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Compact Header */}
      <div className='bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8'>
        <div className='container mx-auto px-4'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold mb-2'>PTE Practice Portal</h1>
            <p className='text-blue-100 max-w-2xl mx-auto'>
              Practice with real PTE Academic questions and get instant AI
              feedback
            </p>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 py-6'>
        {/* Compact Navigation Tabs */}
        <div className='flex space-x-1 bg-white dark:bg-gray-800 p-1 rounded-lg mb-6 shadow-sm max-w-2xl mx-auto'>
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'practice'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
            }`}
          >
            <Zap className='h-4 w-4' />
            <span>Practice</span>
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
            }`}
          >
            <BarChart3 className='h-4 w-4' />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
            }`}
          >
            <Clock className='h-4 w-4' />
            <span>History</span>
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'tests'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
            }`}
          >
            <BookOpen className='h-4 w-4' />
            <span>Mock Tests</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className='max-w-7xl mx-auto'>{renderTabContent()}</div>
      </div>

      {/* Question Sidebar */}
      {selectedQuestionType && (
        <QuestionSidebar
          isOpen={showQuestionSidebar}
          onClose={() => setShowQuestionSidebar(false)}
          questionType={selectedQuestionType}
          selectedQuestionId={selectedQuestionId!}
          onQuestionSelect={handleQuestionSelect}
          practiceStatus={practiceFilters.practiceStatus}
          difficultyLevel={practiceFilters.difficultyLevel}
          onFilterChange={handleFilterChange}
        />
      )}
    </div>
  );
};

export default Portal;
