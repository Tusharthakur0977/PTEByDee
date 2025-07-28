import { BookOpen, CheckCircle, Play, TrendingUp } from 'lucide-react';
import React from 'react';
import type { CourseProgress } from '../services/progress';

interface ProgressTrackerProps {
  progress: CourseProgress;
  className?: string;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  progress,
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

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Progress */}
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
            Course Progress
          </h3>
          <div className='flex items-center space-x-2'>
            <TrendingUp className='h-5 w-5 text-blue-600 dark:text-blue-400' />
            <span className='text-lg font-bold text-blue-600 dark:text-blue-400'>
              {Math.round(progress.course.overallProgress)}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4'>
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(
              progress.course.overallProgress
            )}`}
            style={{ width: `${progress.course.overallProgress}%` }}
          ></div>
        </div>

        {/* Statistics */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
            <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
              {progress.statistics.completedLessons}
            </div>
            <div className='text-sm text-gray-600 dark:text-gray-300'>
              of {progress.statistics.totalLessons} lessons
            </div>
          </div>
          <div className='text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
            <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
              {progress.statistics.completedSections}
            </div>
            <div className='text-sm text-gray-600 dark:text-gray-300'>
              of {progress.statistics.totalSections} sections
            </div>
          </div>
          <div className='text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
            <div className='text-2xl font-bold text-purple-600 dark:text-purple-400'>
              {formatTime(progress.statistics.timeSpent)}
            </div>
            <div className='text-sm text-gray-600 dark:text-gray-300'>
              time spent
            </div>
          </div>
          <div className='text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg'>
            <div className='text-2xl font-bold text-orange-600 dark:text-orange-400'>
              {progress.course.isCompleted ? '100%' : 'In Progress'}
            </div>
            <div className='text-sm text-gray-600 dark:text-gray-300'>
              status
            </div>
          </div>
        </div>
      </div>

      {/* Section Progress */}
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-6'>
          Section Progress
        </h3>
        <div className='space-y-4'>
          {progress.sections.map((section) => (
            <div
              key={section.id}
              className='border border-gray-200 dark:border-gray-700 rounded-lg p-4'
            >
              <div className='flex items-center justify-between mb-3'>
                <div className='flex items-center space-x-3'>
                  <div
                    className={`p-2 rounded-full ${
                      section.isCompleted
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    {section.isCompleted ? (
                      <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />
                    ) : (
                      <BookOpen className='h-5 w-5 text-gray-600 dark:text-gray-400' />
                    )}
                  </div>
                  <div>
                    <h4 className='font-medium text-gray-900 dark:text-white'>
                      {section.title}
                    </h4>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      {section.completedLessons} of {section.totalLessons}{' '}
                      lessons completed
                    </p>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='text-lg font-bold text-gray-900 dark:text-white'>
                    {Math.round(section.progress)}%
                  </div>
                  {section.completedAt && (
                    <div className='text-xs text-green-600 dark:text-green-400'>
                      Completed{' '}
                      {new Date(section.completedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Section Progress Bar */}
              <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3'>
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(
                    section.progress
                  )}`}
                  style={{ width: `${section.progress}%` }}
                ></div>
              </div>

              {/* Lesson Progress */}
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2'>
                {section.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`flex items-center space-x-2 p-2 rounded-lg text-sm ${
                      lesson.isCompleted
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {lesson.isCompleted ? (
                      <CheckCircle className='h-4 w-4 text-green-600 dark:text-green-400' />
                    ) : (
                      <Play className='h-4 w-4 text-gray-400' />
                    )}
                    <span className='truncate'>{lesson.title}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;
