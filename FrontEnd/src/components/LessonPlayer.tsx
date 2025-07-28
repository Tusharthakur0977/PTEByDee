import React, { useState } from 'react';
import {
  Play,
  Video,
  FileText,
  Headphones,
  Clock,
  CheckCircle,
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
  const { updateProgress } = useProgress();

  console.log(lesson);

  const handleComplete = async () => {
    try {
      await updateProgress(lesson.id, { isCompleted: true });
      setIsCompleted(true);
      onComplete?.(lesson.id);
    } catch (error) {
      console.error('Failed to mark lesson as completed:', error);
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
      await updateProgress(lesson.id, { isCompleted: false });
      setIsCompleted(false);
    } catch (error) {
      console.error('Failed to mark lesson as incomplete:', error);
    }
  };

  const getTypeIcon = () => {
    switch (lesson.type) {
      case 'video':
        return <Video className='h-5 w-5 text-blue-600 dark:text-blue-400' />;
      case 'audio':
        return (
          <Headphones className='h-5 w-5 text-purple-600 dark:text-purple-400' />
        );
      case 'text':
        return (
          <FileText className='h-5 w-5 text-green-600 dark:text-green-400' />
        );
      default:
        return (
          <FileText className='h-5 w-5 text-gray-600 dark:text-gray-400' />
        );
    }
  };

  const getTypeColor = () => {
    switch (lesson.type) {
      case 'video':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20';
      case 'audio':
        return 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20';
      case 'text':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20';
      default:
        return 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800';
    }
  };

  return (
    <div
      className={`border rounded-lg overflow-hidden ${getTypeColor()} ${className}`}
    >
      {/* Lesson Header */}
      <div
        className='p-4 cursor-pointer hover:bg-opacity-80 transition-all duration-200'
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className='flex-shrink-0'>{getTypeIcon()}</div>
            <div className='flex-1'>
              <h4 className='font-medium text-gray-900 dark:text-white'>
                {lesson.title}
              </h4>
              {lesson.description && (
                <p className='text-sm text-gray-600 dark:text-gray-300 mt-1'>
                  {lesson.description}
                </p>
              )}
              <div className='flex items-center space-x-4 mt-2'>
                <span className='text-xs text-gray-500 dark:text-gray-400 capitalize'>
                  {lesson.type}
                </span>
                {lesson.duration && (
                  <div className='flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400'>
                    <Clock className='h-3 w-3' />
                    <span>{lesson.duration}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            {isCompleted && (
              <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />
            )}
            <Play
              className={`h-5 w-5 transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : ''
              } text-gray-400`}
            />
          </div>
        </div>
      </div>

      {/* Lesson Content */}
      {isExpanded && (
        <div className='border-t border-gray-200 dark:border-gray-700'>
          {/* Video Content */}
          {lesson.type === 'video' && (lesson.videoUrl || lesson.videoKey) && (
            <div className='p-6'>
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

          {/* Audio Content */}
          {lesson.type === 'audio' && lesson.audioUrl && (
            <div className='p-6'>
              <div className='bg-gray-100 dark:bg-gray-800 rounded-lg p-4'>
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

          {/* Text Content */}
          {lesson.type === 'text' && lesson.textContent && (
            <div className='p-6'>
              <div className='prose dark:prose-invert max-w-none'>
                <div
                  dangerouslySetInnerHTML={{ __html: lesson.textContent }}
                  className='text-gray-700 dark:text-gray-300'
                />
              </div>
            </div>
          )}

          {/* No Content Available */}
          {!(
            (lesson.type === 'video' && (lesson.videoUrl || lesson.videoKey)) ||
            (lesson.type === 'audio' && lesson.audioUrl) ||
            (lesson.type === 'text' && lesson.textContent)
          ) && (
            <div className='p-6 text-center'>
              <p className='text-gray-500 dark:text-gray-400'>
                Content for this lesson is not yet available.
              </p>
            </div>
          )}

          {/* Lesson Actions */}
          <div className='p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700'>
            <div className='flex items-center justify-between'>
              <div className='text-sm text-gray-600 dark:text-gray-300'>
                Lesson {lesson.order}
              </div>
              <div className='flex items-center space-x-2'>
                {isCompleted ? (
                  <>
                    <div className='flex items-center space-x-1 text-green-600 dark:text-green-400 text-sm'>
                      <CheckCircle className='h-4 w-4' />
                      <span>Completed</span>
                    </div>
                    <button
                      onClick={handleMarkIncomplete}
                      className='bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors duration-200'
                    >
                      Mark Incomplete
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleComplete}
                    className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200'
                  >
                    Mark as Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonPlayer;
