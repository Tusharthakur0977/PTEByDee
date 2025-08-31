import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle,
  Clock,
  Eye,
  Headphones,
  Mic,
  Play,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import QuestionTypeSelector from '../components/QuestionTypeSelector';
import { mockTests, pteSections } from '../data/mockPte';
import { getQuestionsByType } from '../data/mockPteQuestions';
import { PteQuestionTypeName } from '../types/pte';
import PracticeQuestion from '../components/PracticeQuestions';

const Portal: React.FC = () => {
  const freeTests = mockTests.filter((test) => test.isFree);
  const premiumTests = mockTests.filter((test) => !test.isFree);
  const [activeTab, setActiveTab] = React.useState<
    'overview' | 'practice' | 'tests'
  >('overview');
  const [selectedQuestionType, setSelectedQuestionType] =
    React.useState<PteQuestionTypeName | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [practiceQuestions, setPracticeQuestions] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (selectedQuestionType) {
      const questions = getQuestionsByType(selectedQuestionType);
      setPracticeQuestions(questions);
      setCurrentQuestionIndex(0);
    }
  }, [selectedQuestionType]);

  const handleQuestionComplete = (response: any) => {
    console.log('Question completed:', response);
    // Here you would typically save the response to your backend
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

        if (practiceQuestions.length === 0) {
          return (
            <div className='text-center py-12'>
              <div className='text-gray-400 dark:text-gray-500 mb-4'>
                <BookOpen className='h-16 w-16 mx-auto' />
              </div>
              <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                No questions available
              </h3>
              <p className='text-gray-600 dark:text-gray-300 mb-6'>
                Questions for this type are being prepared.
              </p>
              <button
                onClick={() => setSelectedQuestionType(null)}
                className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200'
              >
                Back to Question Types
              </button>
            </div>
          );
        }

        const currentQuestion = practiceQuestions[currentQuestionIndex];
        return (
          <div className='space-y-6'>
            <div className='flex items-center justify-between'>
              <button
                onClick={() => setSelectedQuestionType(null)}
                className='flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
              >
                <ArrowLeft className='h-4 w-4' />
                <span>Back to Question Types</span>
              </button>
              <div className='text-sm text-gray-600 dark:text-gray-300'>
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

      case 'tests':
        return renderTestsContent();

      default:
        return renderOverviewContent();
    }
  };

  const renderOverviewContent = () => (
    <>
      {/* Quick Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
        <div className='bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                Tests Completed
              </p>
              <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                12
              </p>
            </div>
            <div className='bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full'>
              <Trophy className='h-6 w-6 text-blue-600 dark:text-blue-400' />
            </div>
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                Best Score
              </p>
              <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                85
              </p>
            </div>
            <div className='bg-green-100 dark:bg-green-900/30 p-3 rounded-full'>
              <Target className='h-6 w-6 text-green-600 dark:text-green-400' />
            </div>
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                Study Hours
              </p>
              <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                48
              </p>
            </div>
            <div className='bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full'>
              <Clock className='h-6 w-6 text-purple-600 dark:text-purple-400' />
            </div>
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                Avg. Score
              </p>
              <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                78
              </p>
            </div>
            <div className='bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full'>
              <BarChart3 className='h-6 w-6 text-orange-600 dark:text-orange-400' />
            </div>
          </div>
        </div>
      </div>

      {/* Test Sections Overview */}
      <div className='mb-8'>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>
          Test Sections
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {pteSections.map((section, index) => (
            <div
              key={section.id}
              className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'
            >
              <div className='flex items-center justify-between mb-4'>
                <div
                  className={`p-3 rounded-full ${
                    index === 0
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : index === 1
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : 'bg-green-100 dark:bg-green-900/30'
                  }`}
                >
                  {index === 0 ? (
                    <Mic className={`h-6 w-6 text-red-600 dark:text-red-400`} />
                  ) : index === 1 ? (
                    <Eye
                      className={`h-6 w-6 text-blue-600 dark:text-blue-400`}
                    />
                  ) : (
                    <Headphones
                      className={`h-6 w-6 text-green-600 dark:text-green-400`}
                    />
                  )}
                </div>
                <span className='text-sm text-gray-500 dark:text-gray-400'>
                  {section.durationMinutes} min
                </span>
              </div>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                {section.name}
              </h3>
              <p className='text-gray-600 dark:text-gray-300 text-sm mb-4'>
                {section.description}
              </p>
              <button
                onClick={() => setActiveTab('practice')}
                className='inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium'
              >
                <span>Practice Section</span>
                <ArrowRight className='h-4 w-4' />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className='mt-8'>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>
          Recent Test Activity
        </h2>
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
          <div className='space-y-4'>
            <div className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg'>
              <div className='flex items-center space-x-3'>
                <div className='bg-green-100 dark:bg-green-900/30 p-2 rounded-full'>
                  <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />
                </div>
                <div>
                  <p className='font-medium text-gray-900 dark:text-white'>
                    PTE Academic Mock Test 1
                  </p>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    Completed • Score: 82/90
                  </p>
                </div>
              </div>
              <div className='text-right'>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  2 hours ago
                </p>
                <Link
                  to='/portal/test/test-1/results'
                  className='text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
                >
                  View Results
                </Link>
              </div>
            </div>

            <div className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg'>
              <div className='flex items-center space-x-3'>
                <div className='bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full'>
                  <Play className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                </div>
                <div>
                  <p className='font-medium text-gray-900 dark:text-white'>
                    Speaking Practice Session
                  </p>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    In Progress • 15 min remaining
                  </p>
                </div>
              </div>
              <div className='text-right'>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  1 day ago
                </p>
                <button
                  onClick={() => setActiveTab('practice')}
                  className='text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
                >
                  Continue
                </button>
              </div>
            </div>

            <div className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg'>
              <div className='flex items-center space-x-3'>
                <div className='bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full'>
                  <BarChart3 className='h-5 w-5 text-purple-600 dark:text-purple-400' />
                </div>
                <div>
                  <p className='font-medium text-gray-900 dark:text-white'>
                    Performance Analysis
                  </p>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    Generated • Reading: 85, Listening: 78
                  </p>
                </div>
              </div>
              <div className='text-right'>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  3 days ago
                </p>
                <Link
                  to='/portal/analytics'
                  className='text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
                >
                  View Analysis
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderTestsContent = () => (
    <>
      {/* Available Tests */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Free Tests */}
        <div>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
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
                className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'
              >
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
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
                      <div className='flex items-center space-x-1'>
                        <Users className='h-4 w-4' />
                        <span>2,847 taken</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-1'>
                    <Star className='h-4 w-4 fill-current text-yellow-400' />
                    <span className='text-sm font-medium text-gray-900 dark:text-white'>
                      4.8
                    </span>
                    <span className='text-sm text-gray-500 dark:text-gray-400'>
                      (1,234 reviews)
                    </span>
                  </div>
                  <div className='flex space-x-2'>
                    <Link
                      to={`/portal/test/${test.id}/instructions`}
                      className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1'
                    >
                      <Play className='h-4 w-4' />
                      <span>Start Test</span>
                    </Link>
                    <Link
                      to={`/portal/test/${test.id}/results`}
                      className='border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200'
                    >
                      View Results
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Tests */}
        <div>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
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
                className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 relative overflow-hidden'
              >
                <div className='absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-transparent w-32 h-full opacity-10'></div>
                <div className='relative'>
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex-1'>
                      <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
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
                    <div className='flex space-x-2'>
                      <button className='bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200'>
                        Upgrade to Access
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Upgrade Card */}
            <div className='bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-6'>
              <h3 className='text-lg font-semibold mb-2'>
                Unlock Premium Tests
              </h3>
              <p className='text-purple-100 text-sm mb-4'>
                Get access to advanced practice tests, detailed analytics, and
                personalized feedback.
              </p>
              <ul className='space-y-2 text-sm text-purple-100 mb-4'>
                <li className='flex items-center space-x-2'>
                  <CheckCircle className='h-4 w-4' />
                  <span>20+ Premium Practice Tests</span>
                </li>
                <li className='flex items-center space-x-2'>
                  <CheckCircle className='h-4 w-4' />
                  <span>Detailed Performance Analytics</span>
                </li>
                <li className='flex items-center space-x-2'>
                  <CheckCircle className='h-4 w-4' />
                  <span>AI-Powered Feedback</span>
                </li>
              </ul>
              <button className='bg-white text-purple-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-50 transition-colors duration-200'>
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Header */}
      <div className='bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12'>
        <div className='container mx-auto px-4'>
          <div className='text-center'>
            <h1 className='text-4xl font-bold mb-4'>
              PTE Academic Test Portal
            </h1>
            <p className='text-xl text-blue-100 max-w-2xl mx-auto'>
              Experience real PTE Academic test conditions with our
              comprehensive simulation platform
            </p>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 py-8'>
        {/* Navigation Tabs */}
        <div className='flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg mb-8 max-w-md mx-auto'>
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
            }`}
          >
            <BarChart3 className='h-4 w-4' />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'practice'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
            }`}
          >
            <Zap className='h-4 w-4' />
            <span>Practice</span>
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'tests'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
            }`}
          >
            <BookOpen className='h-4 w-4' />
            <span>Mock Tests</span>
          </button>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Portal;
