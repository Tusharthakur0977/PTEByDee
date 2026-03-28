import { BookOpen, CheckCircle, Play, TrendingUp } from 'lucide-react';
import React from 'react';
import type { CourseProgress } from '../services/progress';

interface ProgressTrackerProps {
  progress: CourseProgress;
  className?: string;
}

const panelClass =
  'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';

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
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-amber-500';
    return 'bg-slate-400';
  };

  const stats = [
    {
      label: 'Lessons',
      value: progress.statistics.completedLessons,
      meta: `of ${progress.statistics.totalLessons} completed`,
    },
    {
      label: 'Sections',
      value: progress.statistics.completedSections,
      meta: `of ${progress.statistics.totalSections} completed`,
    },
    {
      label: 'Time Spent',
      value: formatTime(progress.statistics.timeSpent),
      meta: 'Total study time',
    },
    {
      label: 'Status',
      value: progress.course.isCompleted ? 'Completed' : 'In Progress',
      meta: `${Math.round(progress.course.overallProgress)}% complete`,
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className={`${panelClass} p-6`}>
        <div className='mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h3 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
              Course Progress
            </h3>
            <p className='mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100'>
              Keep moving through each section
            </p>
          </div>
          <div className='inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200'>
            <TrendingUp className='h-5 w-5' />
            <span className='text-lg font-semibold'>
              {Math.round(progress.course.overallProgress)}%
            </span>
          </div>
        </div>

        <div className='mb-6 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800'>
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
              progress.course.overallProgress,
            )}`}
            style={{ width: `${progress.course.overallProgress}%` }}
          />
        </div>

        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {stats.map((stat) => (
            <div
              key={stat.label}
              className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950'
            >
              <p className='text-sm text-slate-500 dark:text-slate-400'>
                {stat.label}
              </p>
              <p className='mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100'>
                {stat.value}
              </p>
              <p className='mt-2 text-xs text-slate-500 dark:text-slate-400'>
                {stat.meta}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className={`${panelClass} p-6`}>
        <div className='mb-5'>
          <h3 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
            Section Progress
          </h3>
          <p className='mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100'>
            Track progress section by section
          </p>
        </div>

        <div className='space-y-4'>
          {progress.sections.map((section) => (
            <div
              key={section.id}
              className='rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950'
            >
              <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                <div className='flex items-start gap-3'>
                  <div
                    className={`rounded-xl p-2 ${
                      section.isCompleted
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20'
                        : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700'
                    }`}
                  >
                    {section.isCompleted ? (
                      <CheckCircle className='h-5 w-5' />
                    ) : (
                      <BookOpen className='h-5 w-5' />
                    )}
                  </div>
                  <div>
                    <h4 className='font-medium text-slate-900 dark:text-slate-100'>
                      {section.title}
                    </h4>
                    <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
                      {section.completedLessons} of {section.totalLessons}{' '}
                      lessons completed
                    </p>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
                    {Math.round(section.progress)}%
                  </div>
                  {section.completedAt && (
                    <div className='mt-1 text-xs text-emerald-600 dark:text-emerald-400'>
                      Completed {new Date(section.completedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div className='mb-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800'>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                    section.progress,
                  )}`}
                  style={{ width: `${section.progress}%` }}
                />
              </div>

              <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
                {section.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                      lesson.isCompleted
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : 'bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800'
                    }`}
                  >
                    {lesson.isCompleted ? (
                      <CheckCircle className='h-4 w-4 shrink-0' />
                    ) : (
                      <Play className='h-4 w-4 shrink-0 text-slate-400' />
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
