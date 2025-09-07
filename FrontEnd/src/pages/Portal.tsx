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
import QuestionTypeSelector from '../components/QuestionTypeSelector';
import { mockTests } from '../data/mockPte';
import { getPracticeQuestions } from '../services/portal';
import { getPracticeStats } from '../services/practice';
import { PteQuestionTypeName } from '../types/pte';

const Portal: React.FC = () => {
  const freeTests = mockTests.filter((test) => test.isFree);
  const premiumTests = mockTests.filter((test) => !test.isFree);
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
      const response = await getPracticeQuestions(selectedQuestionType, {
        limit: 10,
        random: true,
      });
      setPracticeQuestions(response.questions);
      setCurrentQuestionIndex(0);
    } catch (error: any) {
      console.error('Error fetching practice questions:', error);
      setQuestionError('Failed to load practice questions');
      setPracticeQuestions([]);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleQuestionComplete = (response: any) => {
    console.log('Question completed:', response);
    // Refresh stats if we're on overview tab
    if (activeTab === 'overview') {
      fetchPracticeStats();
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < practiceQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // End of practice session
      setSelectedQuestionType(null);
      setCurrentQuestionIndex(0);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'practice': {
        if (!selectedQuestionType) {
          return (
            <QuestionTypeSelector
              selectedType={selectedQuestionType}
              onTypeSelect={setSelectedQuestionType}
            />
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
                No practice questions are available for this question type yet.
              </p>
              <div className='space-x-4'>
                <button
                  onClick={fetchPracticeQuestions}
                  className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200'
                >
                  Refresh
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

        const currentQuestion = practiceQuestions[currentQuestionIndex];
        return (
          <div className='space-y-4'>
            <div className='flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm'>
              <button
                onClick={() => setSelectedQuestionType(null)}
                className='flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium'
              >
                <ArrowRight className='h-4 w-4 rotate-180' />
                <span>Back to Question Types</span>
              </button>
              <div className='text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full'>
                Question {currentQuestionIndex + 1} of{' '}
                {practiceQuestions.length}
              </div>
            </div>
            <PracticeQuestion
              question={currentQuestion}
              onComplete={handleQuestionComplete}
              onNext={handleNextQuestion}
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
    </div>
  );
};

export default Portal;
