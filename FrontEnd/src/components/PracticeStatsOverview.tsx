import {
  Calendar,
  CheckCircle,
  Clock,
  RefreshCw,
  Target,
  Zap
} from 'lucide-react';
import React from 'react';
import type { PracticeStats } from '../services/practice';

interface PracticeStatsOverviewProps {
  stats: PracticeStats | null;
  isLoading: boolean;
  onRefresh: () => void;
  className?: string;
}

const PracticeStatsOverview: React.FC<PracticeStatsOverviewProps> = ({
  stats,
  isLoading,
  onRefresh,
  className = '',
}) => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600 dark:text-green-400';
    if (accuracy >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getAccuracyBg = (accuracy: number) => {
    if (accuracy >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (accuracy >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className='text-center py-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600 dark:text-gray-300'>
            Loading practice statistics...
          </p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className='text-center py-12'>
          <Target className='h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4' />
          <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
            Start Practicing
          </h3>
          <p className='text-gray-600 dark:text-gray-300 mb-6'>
            Begin your practice journey to see detailed statistics here
          </p>
          <button className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200'>
            Start Practice Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Compact Header with Refresh */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
            Practice Overview
          </h2>
          <p className='text-sm text-gray-600 dark:text-gray-300'>
            Track your progress and performance
          </p>
        </div>
        <button
          onClick={onRefresh}
          className='flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200'
        >
          <RefreshCw className='h-4 w-4' />
          <span>Refresh</span>
        </button>
      </div>

      {/* Compact Overall Statistics */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide'>
                Questions
              </p>
              <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                {stats.overall.totalQuestions}
              </p>
            </div>
            <div className='bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg'>
              <Target className='h-5 w-5 text-blue-600 dark:text-blue-400' />
            </div>
          </div>
          <div className='mt-2 text-xs text-blue-600 dark:text-blue-400'>
            {stats.today.questionsAnswered} today
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide'>
                Accuracy
              </p>
              <p
                className={`text-2xl font-bold ${getAccuracyColor(
                  stats.overall.accuracy
                )}`}
              >
                {Math.round(stats.overall.accuracy)}%
              </p>
            </div>
            <div
              className={`p-2 rounded-lg ${getAccuracyBg(
                stats.overall.accuracy
              )}`}
            >
              <CheckCircle
                className={`h-5 w-5 ${getAccuracyColor(
                  stats.overall.accuracy
                )}`}
              />
            </div>
          </div>
          <div className='mt-2 text-xs text-gray-600 dark:text-gray-400'>
            {stats.overall.correctAnswers} correct
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide'>
                Streak
              </p>
              <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                {stats.overall.practiceStreak}
              </p>
            </div>
            <div className='bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg'>
              <Zap className='h-5 w-5 text-orange-600 dark:text-orange-400' />
            </div>
          </div>
          <div className='mt-2 text-xs text-orange-600 dark:text-orange-400'>
            {stats.overall.practiceStreak > 0 ? 'Keep it up!' : 'Start today'}
          </div>
        </div>

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide'>
                Time
              </p>
              <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                {formatTime(stats.overall.totalTimeSpent)}
              </p>
            </div>
            <div className='bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg'>
              <Clock className='h-5 w-5 text-purple-600 dark:text-purple-400' />
            </div>
          </div>
          <div className='mt-2 text-xs text-purple-600 dark:text-purple-400'>
            {formatTime(stats.today.timeSpent)} today
          </div>
        </div>
      </div>

      {/* Today's Performance */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
          Today's Performance
        </h3>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
            <div className='text-xl font-bold text-blue-600 dark:text-blue-400'>
              {stats.today.questionsAnswered}
            </div>
            <div className='text-xs text-gray-600 dark:text-gray-300'>
              Questions
            </div>
          </div>
          <div className='text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
            <div className='text-xl font-bold text-green-600 dark:text-green-400'>
              {stats.today.correctAnswers}
            </div>
            <div className='text-xs text-gray-600 dark:text-gray-300'>
              Correct
            </div>
          </div>
          <div className='text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
            <div className='text-xl font-bold text-purple-600 dark:text-purple-400'>
              {Math.round(stats.today.accuracy)}%
            </div>
            <div className='text-xs text-gray-600 dark:text-gray-300'>
              Accuracy
            </div>
          </div>
          <div className='text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg'>
            <div className='text-xl font-bold text-orange-600 dark:text-orange-400'>
              {formatTime(stats.today.timeSpent)}
            </div>
            <div className='text-xs text-gray-600 dark:text-gray-300'>Time</div>
          </div>
        </div>
      </div>

      {/* Performance by Section */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
          Performance by Section
        </h3>
        <div className='space-y-3'>
          {stats.bySection.map((section) => (
            <div
              key={section.sectionName}
              className='border border-gray-200 dark:border-gray-700 rounded-lg p-4'
            >
              <div className='flex items-center justify-between mb-2'>
                <h4 className='font-medium text-gray-900 dark:text-white'>
                  {section.sectionName}
                </h4>
                <div className='flex items-center space-x-3'>
                  <span
                    className={`font-semibold ${getAccuracyColor(
                      section.accuracy
                    )}`}
                  >
                    {Math.round(section.accuracy)}%
                  </span>
                  <span className='text-sm text-gray-500 dark:text-gray-400'>
                    {section.totalQuestions} questions
                  </span>
                </div>
              </div>

              <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    section.accuracy >= 80
                      ? 'bg-green-500'
                      : section.accuracy >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${section.accuracy}%` }}
                ></div>
              </div>

              <div className='flex items-center justify-between mt-2 text-xs text-gray-600 dark:text-gray-400'>
                <span>{section.correctAnswers} correct</span>
                <span>
                  Avg: {formatTime(section.totalTime / section.totalQuestions)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sessions - Compact */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
          Recent Sessions
        </h3>
        <div className='space-y-2'>
          {stats.recentSessions.slice(0, 3).map((session) => (
            <div
              key={session.id}
              className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'
            >
              <div className='flex items-center space-x-3'>
                <div className='bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg'>
                  <Calendar className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                </div>
                <div>
                  <p className='font-medium text-gray-900 dark:text-white text-sm'>
                    {new Date(session.sessionDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    {session.totalQuestions} questions
                  </p>
                </div>
              </div>
              <div className='text-right'>
                <div
                  className={`text-sm font-bold ${getAccuracyColor(
                    session.accuracy
                  )}`}
                >
                  {Math.round(session.accuracy)}%
                </div>
                <div className='text-xs text-gray-500 dark:text-gray-400'>
                  {formatTime(session.timeSpent)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Question Types - Compact */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
          Top Question Types
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          {stats.byQuestionType.slice(0, 6).map((questionType) => (
            <div
              key={questionType.questionType}
              className='border border-gray-200 dark:border-gray-700 rounded-lg p-3'
            >
              <div className='flex items-center justify-between mb-1'>
                <h4 className='font-medium text-gray-900 dark:text-white text-sm'>
                  {questionType.questionTypeName}
                </h4>
                <span className='text-xs text-gray-500 dark:text-gray-400'>
                  {questionType.totalQuestions}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-bold text-blue-600 dark:text-blue-400'>
                  {Math.round(questionType.averageScore * 100)}%
                </span>
                <span className='text-xs text-gray-500 dark:text-gray-400'>
                  {formatTime(
                    questionType.totalTime / questionType.totalQuestions
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PracticeStatsOverview;
