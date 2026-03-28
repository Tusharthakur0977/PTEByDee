import React, { useEffect, useState } from 'react';
import {
  Play,
  Video,
  FileText,
  Headphones,
  Clock,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import { useProgress } from '../hooks/useProgress';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  videoKey?: string;
  audioUrl?: string;
  textContent?: string;
  type: 'video' | 'audio' | 'text' | 'quiz' | 'assignment';
  duration?: string;
  order: number;
}

interface LessonPlayerProps {
  lesson: Lesson;
  courseId: string;
  isEnrolled: boolean;
  isCompleted?: boolean;
  onComplete?: (lessonId: string) => void;
  className?: string;
}

const LessonPlayer: React.FC<LessonPlayerProps> = ({
  lesson,
  courseId,
  isEnrolled,
  isCompleted: initialCompleted = false,
  onComplete,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [actionLoading, setActionLoading] = useState<
    'complete' | 'incomplete' | null
  >(null);
  const { updateProgress } = useProgress();

  useEffect(() => {
    setIsCompleted(initialCompleted);
  }, [initialCompleted]);

  const handleComplete = async () => {
    try {
      setActionLoading('complete');
      await updateProgress(lesson.id, { isCompleted: true });
      setIsCompleted(true);
      onComplete?.(lesson.id);
    } catch (error) {
      console.error('Failed to mark lesson as completed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleVideoProgress = async (watchedDuration: number) => {
    try {
      await updateProgress(lesson.id, { watchedDuration });
    } catch (error) {
      console.error('Failed to update video progress:', error);
    }
  };

  const handleMarkIncomplete = async () => {
    try {
      setActionLoading('incomplete');
      await updateProgress(lesson.id, { isCompleted: false });
      setIsCompleted(false);
    } catch (error) {
      console.error('Failed to mark lesson as incomplete:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getTypeIcon = () => {
    switch (lesson.type) {
      case 'video':
        return <Video className='h-4 w-4' />;
      case 'audio':
        return <Headphones className='h-4 w-4' />;
      case 'text':
        return <FileText className='h-4 w-4' />;
      default:
        return <FileText className='h-4 w-4' />;
    }
  };

  const getTypeTone = () => {
    switch (lesson.type) {
      case 'video':
        return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20';
      case 'audio':
        return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20';
      case 'text':
        return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20';
      default:
        return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700';
    }
  };

  const hasContent =
    (lesson.type === 'video' && (lesson.videoUrl || lesson.videoKey)) ||
    (lesson.type === 'audio' && lesson.audioUrl) ||
    (lesson.type === 'text' && lesson.textContent);

  const lessonStatus = isCompleted ? 'Completed' : 'Pending';
  const lessonStatusClass = isCompleted
    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20'
    : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700';

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 ${className}`}
    >
      <button
        type='button'
        className='w-full px-5 py-4 text-left transition-colors hover:bg-white/70 dark:hover:bg-slate-900/70'
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className='flex items-start justify-between gap-4'>
          <div className='flex min-w-0 flex-1 items-start gap-3'>
            <div className={`mt-0.5 rounded-xl p-2 ${getTypeTone()}`}>
              {getTypeIcon()}
            </div>
            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <span className='text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500'>
                  Lesson {lesson.order}
                </span>
                <span className='rounded-full bg-white px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'>
                  {lesson.type}
                </span>
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-medium ${lessonStatusClass}`}
                >
                  {lessonStatus}
                </span>
              </div>
              <h4 className='mt-2 text-base font-semibold text-slate-900 dark:text-slate-100'>
                {lesson.title}
              </h4>
              {lesson.description && (
                <p className='mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400'>
                  {lesson.description}
                </p>
              )}
              <div className='mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400'>
                {lesson.duration && (
                  <span className='inline-flex items-center gap-1'>
                    <Clock className='h-3.5 w-3.5' />
                    <span>{lesson.duration}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className='flex shrink-0 items-center gap-3'>
            {hasContent && (
              <span className='hidden shrink-0 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white dark:bg-slate-100 dark:text-slate-900 sm:inline-flex'>
                Open lesson
              </span>
            )}
            <ChevronRight
              className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className='border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'>
          {lesson.type === 'video' && (lesson.videoUrl || lesson.videoKey) && (
            <div className='p-5'>
              <VideoPlayer
                videoUrl={lesson.videoUrl}
                videoKey={lesson.videoKey}
                courseId={courseId}
                title={lesson.title}
                duration={lesson.duration}
                isPreview={false}
                isEnrolled={isEnrolled}
                onPlay={() => console.log(`Playing lesson: ${lesson.title}`)}
                onProgress={handleVideoProgress}
              />
            </div>
          )}

          {lesson.type === 'audio' && lesson.audioUrl && (
            <div className='p-5'>
              <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950'>
                <audio
                  controls
                  className='w-full'
                  src={lesson.audioUrl}
                  title={lesson.title}
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          )}

          {lesson.type === 'text' && lesson.textContent && (
            <div className='p-5'>
              <div className='prose max-w-none rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-700 dark:prose-invert dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'>
                <div dangerouslySetInnerHTML={{ __html: lesson.textContent }} />
              </div>
            </div>
          )}

          {!hasContent && (
            <div className='p-5 text-center'>
              <div className='rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400'>
                Content for this lesson is not yet available.
              </div>
            </div>
          )}

          <div className='flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950'>
            <div className='text-sm text-slate-500 dark:text-slate-400'>
              Track completion as you finish this lesson.
            </div>
            <div className='flex flex-wrap items-center gap-3 sm:flex-nowrap'>
              {isCompleted ? (
                <>
                  <div className='inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400'>
                    <CheckCircle className='h-4 w-4' />
                    <span>Completed</span>
                  </div>
                  <button
                    onClick={handleMarkIncomplete}
                    disabled={actionLoading !== null}
                    className='inline-flex min-w-[150px] items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900'
                  >
                    {actionLoading === 'incomplete' ? (
                      <span className='flex items-center gap-2'>
                        <span className='h-4 w-4 animate-spin rounded-full border-2 border-slate-400/30 border-t-slate-700 dark:border-slate-500/30 dark:border-t-slate-200'></span>
                        <span>Saving...</span>
                      </span>
                    ) : (
                      'Mark Incomplete'
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={actionLoading !== null}
                  className='inline-flex min-w-[160px] items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                >
                  {actionLoading === 'complete' ? (
                    <span className='flex items-center gap-2'>
                      <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-400/30 dark:border-t-slate-900'></span>
                      <span>Saving...</span>
                    </span>
                  ) : (
                    'Mark as Complete'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonPlayer;
