import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle,
  Clock,
  History,
  Play,
  Zap,
  Flame,
} from 'lucide-react';
import React from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import PracticeHistory from '../components/PracticeHistory';
import QuestionTypeSelector from '../components/QuestionTypeSelector';
import PredictedQuestions from '../components/PredictedQuestions';
import { getPracticePagePath } from '../utils/questionTypeToSlug';
import { mockTests } from '../data/mockPte';
import { PteQuestionTypeName } from '../types/pte';

const Portal: React.FC = () => {
  const freeTests = mockTests.filter(
    (test: { isFree: boolean }) => test.isFree,
  );
  const premiumTests = mockTests.filter(
    (test: { isFree: boolean }) => !test.isFree,
  );
  const { activeTab: tabParam } = useParams<{ activeTab?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Helper to map route tab names to the active tab states
  const getMappedTab = (tab: string | undefined): 'practice' | 'tests' | 'history' | 'predicted' => {
    if (!tab) return 'practice';
    const t = tab.toLowerCase();
    if (t === 'prediction' || t === 'predicted') return 'predicted';
    if (t === 'tests' || t === 'test') return 'tests';
    if (t === 'history') return 'history';
    return 'practice';
  };

  const activeTab = getMappedTab(tabParam);

  // Helper to normalize the query type
  const normalizeQuestionType = (typeStr: string | null): PteQuestionTypeName | null => {
    if (!typeStr) return null;
    const clean = typeStr.toUpperCase().replace(/-/g, '_');
    return clean as PteQuestionTypeName;
  };

  // Synchronize on mount and handle root /portal visits and query parameter parsing
  React.useEffect(() => {
    if (!tabParam) {
      const lastTab = sessionStorage.getItem('portal_active_tab') || 'practice';
      const lastPredictedType = sessionStorage.getItem('last_predicted_question_type');
      if (lastTab === 'predicted' && lastPredictedType) {
        sessionStorage.removeItem('last_predicted_question_type');
        navigate(`/portal/prediction?type=${lastPredictedType}`, { replace: true });
      } else {
        const routeTab = lastTab === 'predicted' ? 'prediction' : lastTab;
        navigate(`/portal/${routeTab}`, { replace: true });
      }
    } else {
      sessionStorage.setItem('portal_active_tab', activeTab);
      
      // If we land on prediction tab, check and clear fallback
      if (activeTab === 'predicted') {
        const hasType = new URLSearchParams(location.search).has('type');
        const lastPredictedType = sessionStorage.getItem('last_predicted_question_type');
        if (hasType && lastPredictedType) {
          sessionStorage.removeItem('last_predicted_question_type');
        } else if (!hasType && lastPredictedType) {
          sessionStorage.removeItem('last_predicted_question_type');
          navigate(`/portal/prediction?type=${lastPredictedType}`, { replace: true });
          return;
        }
      }

      // Parse question type search param only in practice tab
      if (activeTab === 'practice') {
        const queryType = new URLSearchParams(location.search).get('type');
        if (queryType) {
          const normalized = normalizeQuestionType(queryType);
          if (normalized) {
            navigate(getPracticePagePath(normalized), { replace: true });
          }
        }
      }
    }
  }, [tabParam, activeTab, location.search]);

  const setActiveTab = (tab: 'practice' | 'tests' | 'history' | 'predicted') => {
    const routeTab = tab === 'predicted' ? 'prediction' : tab;
    navigate(`/portal/${routeTab}`);
  };
  const renderTabContent = () => {
    switch (activeTab) {
      case 'practice': {
        return (
          <div className='relative'>
            <QuestionTypeSelector
              selectedType={null}
              onTypeSelect={(type) => {
                navigate(getPracticePagePath(type));
              }}
            />
          </div>
        );
      }

      case 'history':
        return <PracticeHistory />;

      case 'predicted':
        return <PredictedQuestions />;

      case 'tests':
        return renderTestsContent();

      default:
        return <PracticeHistory />;
    }
  };

  const renderTestsContent = () => (
    <div className='space-y-6'>
      {/* Available Tests */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Free Tests */}
        <div className='rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl font-semibold text-slate-900 dark:text-white'>
              Free Practice Tests
            </h2>
            <span className='rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'>
              Free Access
            </span>
          </div>
          <div className='space-y-4'>
            {freeTests.map((test) => (
              <div
                key={test.id}
                className='rounded-2xl border border-slate-200 p-5 transition-colors duration-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950'
              >
                <div className='flex items-start justify-between mb-3'>
                  <div className='flex-1'>
                    <h3 className='mb-2 font-semibold text-slate-900 dark:text-white'>
                      {test.title}
                    </h3>
                    <p className='mb-3 text-sm text-slate-600 dark:text-slate-300'>
                      {test.description}
                    </p>
                    <div className='flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400'>
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
                    className='flex items-center space-x-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                  >
                    <Play className='h-4 w-4' />
                    <span>Start Test</span>
                  </Link>
                  <Link
                    to={`/portal/test/${test.id}/results`}
                    className='rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                  >
                    View Results
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Tests */}
        <div className='rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl font-semibold text-slate-900 dark:text-white'>
              Premium Tests
            </h2>
            <span className='rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-400/10 dark:text-blue-300'>
              Premium Only
            </span>
          </div>
          <div className='space-y-4'>
            {premiumTests.map((test) => (
              <div
                key={test.id}
                className='relative overflow-hidden rounded-2xl border border-slate-200 p-5 dark:border-slate-800'
              >
                <div className='absolute inset-0 bg-gradient-to-r from-slate-900/[0.03] to-blue-500/[0.06] dark:from-white/[0.02] dark:to-blue-400/[0.06]'></div>
                <div className='relative'>
                  <div className='flex items-start justify-between mb-3'>
                    <div className='flex-1'>
                      <h3 className='mb-2 font-semibold text-slate-900 dark:text-white'>
                        {test.title}
                      </h3>
                      <p className='mb-3 text-sm text-slate-600 dark:text-slate-300'>
                        {test.description}
                      </p>
                      <div className='flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400'>
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
                      <CheckCircle className='h-4 w-4 text-blue-600 dark:text-blue-300' />
                      <span className='text-sm font-medium text-blue-700 dark:text-blue-300'>
                        Premium Features
                      </span>
                    </div>
                    <button className='rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'>
                      Upgrade to Access
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Upgrade Card */}
            <div className='rounded-[24px] bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-5 text-white'>
              <h3 className='font-semibold mb-2'>Unlock Premium Tests</h3>
              <p className='mb-3 text-sm text-slate-300'>
                Get access to advanced practice tests, detailed analytics, and
                personalized feedback.
              </p>
              <ul className='mb-3 space-y-1 text-sm text-slate-300'>
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
              <button className='rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors duration-200 hover:bg-slate-100'>
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const getHeaderContent = () => {
    switch (activeTab) {
      case 'predicted':
        return {
          title: 'Most Predicted Questions',
          desc: 'Highly vetted questions carrying an elevated likelihood of appearing in upcoming exams.',
        };
      case 'history':
        return {
          title: 'Track Performance and Past Exam Attempts.',
          desc: 'Detailed AI analytics, score breakdown histories, and feedback transcripts of your practice sessions.',
        };
      case 'tests':
        return {
          title: 'Evaluate Your Readiness with Realistic Mock Tests.',
          desc: 'Simulate actual exam environments with immediate comprehensive AI scoring and breakdown.',
        };
      case 'practice':
      default:
        return {
          title: 'Practice, test, and review in one focused portal.',
          desc: 'Targeted practice, mock tests, and history without distractions.',
        };
    }
  };

  const headerContent = getHeaderContent();

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <section className='border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'>
        <div className='container mx-auto px-4 py-6'>
          <div className='flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
            <div className='max-w-3xl min-h-[96px] sm:min-h-[80px] flex flex-col justify-center'>
              <h1 key={`${activeTab}-title`} className='text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl animate-in fade-in duration-300 flex items-center gap-3'>
                {activeTab === 'predicted' && (
                  <Flame className='h-8 w-8 text-orange-500 fill-orange-500 animate-pulse flex-shrink-0' />
                )}
                <span>{headerContent.title}</span>
              </h1>
              <p key={`${activeTab}-desc`} className='mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base animate-in fade-in duration-300'>
                {headerContent.desc}
              </p>
            </div>

            <div className='flex flex-wrap gap-3 lg:justify-end'>
              <button
                onClick={() => setActiveTab('practice')}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === 'practice'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Zap className='h-4 w-4' />
                <span>Practice</span>
              </button>
              <button
                onClick={() => setActiveTab('predicted')}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === 'predicted'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Flame className='h-4 w-4' />
                <span>Predicted</span>
              </button>
              {/* <button
                onClick={() => setActiveTab("tests")}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === "tests"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Mock Tests</span>
              </button> */}
              <button
                onClick={() => setActiveTab('history')}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <History className='h-4 w-4' />
                <span>History</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className='container mx-auto px-4 py-8'>
        <div className='mx-auto max-w-7xl'>{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default Portal;
