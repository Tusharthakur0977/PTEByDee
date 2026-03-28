import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Users,
  Star,
  BookOpen,
  CheckCircle,
  Play,
  ArrowLeft,
  Video,
  FileText,
  HelpCircle,
  PenTool,
  Headphones,
  Sparkles,
  Layers,
} from 'lucide-react';
import { getCourseById, enrollInCourse } from '../services/courses';
import type { Course } from '../services/courses';
import { useAuth } from '../contexts/AuthContext';
import CheckoutButton from '../components/CheckoutButton';
import VideoPlayer from '../components/VideoPlayer';
import LessonPlayer from '../components/LessonPlayer';
import ProgressTracker from '../components/progressTracker';
import { useCourseProgress } from '../hooks/useProgress';
import CourseImage from '../components/CourseImage';

const panelClass =
  'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';

const formatEnrollmentDate = (dateString?: string) => {
  if (!dateString) return 'Not available';

  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = React.useState<Course | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = React.useState(false);

  const isEnrolled = course?.isEnrolled || false;
  const { progress, refreshProgress } = useCourseProgress(
    id || '',
    !!(user && isEnrolled),
  );

  const fetchCourse = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const courseData = await getCourseById(id!);
      setCourse(courseData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch course details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    if (id) {
      fetchCourse();
    }
  }, [id, fetchCourse]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setIsEnrolling(true);
      await enrollInCourse(id!);
      await fetchCourse();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to enroll in course');
    } finally {
      setIsEnrolling(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className='h-4 w-4' />;
      case 'quiz':
        return <HelpCircle className='h-4 w-4' />;
      case 'assignment':
        return <PenTool className='h-4 w-4' />;
      case 'audio':
        return <Headphones className='h-4 w-4' />;
      default:
        return <FileText className='h-4 w-4' />;
    }
  };

  const getTypeTone = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20';
      case 'quiz':
        return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20';
      case 'assignment':
        return 'bg-violet-50 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20';
      case 'audio':
        return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20';
      default:
        return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700';
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950'>
        <div className='h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100' />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-50 px-4 dark:bg-slate-950'>
        <div className='rounded-2xl border border-red-200 bg-white px-6 py-5 text-center shadow-sm dark:border-red-900/40 dark:bg-slate-900'>
          <h1 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
            Course unavailable
          </h1>
          <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>
            {error || 'Course not found'}
          </p>
          <div className='mt-5 flex flex-wrap items-center justify-center gap-3'>
            <button
              onClick={fetchCourse}
              className='rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
            >
              Try Again
            </button>
            <Link
              to='/courses'
              className='rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
            >
              Back to Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(course.userEnrollment?.progress || 0);
  const totalLessons =
    course.sections?.reduce(
      (sum, section) => sum + section.lessons.length,
      0,
    ) ||
    course.curriculum?.reduce(
      (sum, module) => sum + module.lessons.length,
      0,
    ) ||
    0;

  if (isEnrolled) {
    return (
      <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
        <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
          <Link
            to='/dashboard'
            className='inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
          >
            <ArrowLeft className='h-4 w-4' />
            <span>Back to Dashboard</span>
          </Link>

          <div className='mt-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950'>
            <div className='grid gap-6 xl:grid-cols-[1.5fr_0.9fr]'>
              <div>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-700'>
                    {course.sectionCount} sections
                  </span>
                  <span className='inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-700'>
                    <Star className='h-3.5 w-3.5 fill-current text-amber-400' />
                    {course.rating}
                  </span>
                </div>
                <h1 className='mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-100 sm:text-4xl'>
                  {course.title}
                </h1>
                <p className='mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-400'>
                  {course.description}
                </p>
                <div className='mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400'>
                  <span className='inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-700'>
                    <Layers className='h-4 w-4' />
                    {totalLessons} lessons
                  </span>
                  <span className='inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-700'>
                    <Clock className='h-4 w-4' />
                    {course.duration}
                  </span>
                  <span className='inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-700'>
                    <CheckCircle className='h-4 w-4 text-blue-500' />
                    {progressPercent}% completed
                  </span>
                </div>
              </div>

              <div className={`${panelClass} p-5`}>
                <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                  Course Snapshot
                </h2>
                <div className='mt-4 grid grid-cols-2 gap-3'>
                  <div className='rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950'>
                    <p className='text-sm text-slate-500 dark:text-slate-400'>
                      Lessons
                    </p>
                    <p className='mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100'>
                      {totalLessons}
                    </p>
                  </div>
                  <div className='rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950'>
                    <p className='text-sm text-slate-500 dark:text-slate-400'>
                      Duration
                    </p>
                    <p className='mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100'>
                      {course.duration}
                    </p>
                  </div>
                  <div className='rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950'>
                    <p className='text-sm text-slate-500 dark:text-slate-400'>
                      Enrollment
                    </p>
                    <p className='mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100'>
                      {formatEnrollmentDate(course.userEnrollment?.enrolledAt)}
                    </p>
                  </div>
                  <div className='rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950'>
                    <p className='text-sm text-slate-500 dark:text-slate-400'>
                      Status
                    </p>
                    <p className='mt-1 inline-flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100'>
                      {course.userEnrollment?.completed ? (
                        <>
                          <CheckCircle className='h-4 w-4 text-emerald-500' />
                          Completed
                        </>
                      ) : (
                        <>
                          <Play className='h-4 w-4 text-blue-500' />
                          In progress
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {progress && (
            <div className='mt-6'>
              <ProgressTracker progress={progress} />
            </div>
          )}

          <div className='mt-6 space-y-6'>
            {course.sections?.map((section, sectionIndex) => {
              const sectionProgress = progress?.sections.find(
                (s) => s.id === section.id,
              );
              const isSectionCompleted = sectionProgress?.isCompleted || false;

              return (
                <div
                  key={section.id}
                  className={`${panelClass} overflow-hidden`}
                >
                  <div className='border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-950'>
                    <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
                      <div>
                        <p className='text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400'>
                          Section {sectionIndex + 1}
                        </p>
                        <h3 className='mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100'>
                          {section.title}
                        </h3>
                        {section.description && (
                          <p className='mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400'>
                            {section.description}
                          </p>
                        )}
                      </div>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span
                          className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                            isSectionCompleted
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20'
                              : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'
                          }`}
                        >
                          {isSectionCompleted && (
                            <CheckCircle className='h-3.5 w-3.5' />
                          )}
                          {isSectionCompleted ? 'Completed' : 'Pending'}
                        </span>
                        <span className='inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'>
                          {section.lessons.length} lessons
                        </span>
                      </div>
                    </div>
                  </div>

                  {(section.videoUrl || section.videoKey) && (
                    <div className='border-b border-slate-200 p-6 dark:border-slate-800'>
                      <h4 className='mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100'>
                        Section Overview
                      </h4>
                      <VideoPlayer
                        videoUrl={section.videoUrl}
                        videoKey={section.videoKey}
                        courseId={course.id}
                        title={`${section.title} - Overview`}
                        isPreview={false}
                        isEnrolled={true}
                      />
                    </div>
                  )}

                  <div className='p-6'>
                    <h4 className='mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100'>
                      Lessons
                    </h4>
                    <div className='space-y-4'>
                      {section.lessons.map((lesson) => (
                        <LessonPlayer
                          key={lesson.id}
                          lesson={lesson}
                          courseId={course.id}
                          isEnrolled={true}
                          isCompleted={
                            sectionProgress?.lessons.find(
                              (l) => l.id === lesson.id,
                            )?.isCompleted || false
                          }
                          onComplete={(lessonId) => {
                            console.log(`Lesson completed: ${lessonId}`);
                            refreshProgress();
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        <Link
          to='/courses'
          className='inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
        >
          <ArrowLeft className='h-4 w-4' />
          <span>Back to Courses</span>
        </Link>

        <div className='mt-6 grid gap-6 lg:grid-cols-[1.55fr_0.85fr]'>
          <div className='space-y-6'>
            <div className='overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950'>
              <div className='grid gap-6 p-6 xl:grid-cols-[1.2fr_0.8fr]'>
                <div>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-700'>
                      <Star className='h-3.5 w-3.5 fill-current text-amber-400' />
                      {course.rating}
                    </span>
                    <span className='inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-700'>
                      {course.students} learners
                    </span>
                  </div>
                  <h1 className='mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-100 sm:text-4xl'>
                    {course.title}
                  </h1>
                  <p className='mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400'>
                    {course.detailedDescription || course.description}
                  </p>

                  <div className='mt-6 grid gap-3 sm:grid-cols-2'>
                    <div className='rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/80'>
                      <div className='inline-flex rounded-xl bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200'>
                        <Layers className='h-4 w-4' />
                      </div>
                      <p className='mt-3 text-sm text-slate-500 dark:text-slate-400'>
                        Sections
                      </p>
                      <p className='mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100'>
                        {course.sectionCount}
                      </p>
                    </div>
                    <div className='rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/80'>
                      <div className='inline-flex rounded-xl bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200'>
                        <BookOpen className='h-4 w-4' />
                      </div>
                      <p className='mt-3 text-sm text-slate-500 dark:text-slate-400'>
                        Lessons
                      </p>
                      <p className='mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100'>
                        {totalLessons}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <CourseImage
                    src={course.imageUrl}
                    alt={course.title}
                    className='h-[280px] w-full overflow-hidden rounded-2xl'
                    showLoadingSpinner={true}
                  />
                </div>
              </div>
            </div>

            {(course.coursePreviewVideoUrl ||
              course.curriculum?.[0]?.lessons[0]?.videoUrl) && (
              <div className={`${panelClass} p-6`}>
                <div className='mb-5'>
                  <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                    Course Preview
                  </h2>
                  <p className='mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100'>
                    See how the lessons are delivered
                  </p>
                </div>
                <VideoPlayer
                  videoUrl={
                    course.coursePreviewVideoUrl ||
                    course.curriculum?.[0]?.lessons[0]?.videoUrl
                  }
                  courseId={course.id}
                  title={
                    course.curriculum?.[0]?.lessons[0]?.title ||
                    'Course Introduction'
                  }
                  duration={course.curriculum?.[0]?.lessons[0]?.duration}
                  isPreview={true}
                  isEnrolled={isEnrolled}
                />
              </div>
            )}

            {course.features && course.features.length > 0 && (
              <div className={`${panelClass} p-6`}>
                <div className='mb-5'>
                  <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                    What You Will Learn
                  </h2>
                  <p className='mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100'>
                    Outcomes from this course
                  </p>
                </div>
                <div className='grid gap-4 md:grid-cols-2'>
                  {course.features.map((feature, index) => (
                    <div
                      key={index}
                      className='flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950'
                    >
                      <CheckCircle className='mt-0.5 h-5 w-5 text-emerald-500' />
                      <span className='text-sm leading-6 text-slate-700 dark:text-slate-300'>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {course.curriculum && course.curriculum.length > 0 && (
              <div className={`${panelClass} p-6`}>
                <div className='mb-5'>
                  <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                    Curriculum
                  </h2>
                  <p className='mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100'>
                    Course structure and lesson flow
                  </p>
                </div>
                <div className='space-y-4'>
                  {course.curriculum.map((module, index) => (
                    <div
                      key={index}
                      className='overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950'
                    >
                      <div className='border-b border-slate-200 px-5 py-4 dark:border-slate-800'>
                        <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
                          Module {index + 1}: {module.title}
                        </h3>
                        <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
                          {module.lessons.length} lessons
                        </p>
                      </div>
                      <div className='p-5'>
                        <ul className='space-y-3'>
                          {module.lessons.map((lesson, lessonIndex) => (
                            <li
                              key={lessonIndex}
                              className='flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900'
                            >
                              <div className='flex items-center gap-3'>
                                <div
                                  className={`rounded-xl p-2 ${getTypeTone(lesson.type)}`}
                                >
                                  {getTypeIcon(lesson.type)}
                                </div>
                                <div>
                                  <span className='text-sm font-medium text-slate-900 dark:text-slate-100'>
                                    {lesson.title}
                                  </span>
                                  {lesson.duration && (
                                    <p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
                                      {lesson.duration}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className='flex items-center gap-2'>
                                {lesson.isPreview && (
                                  <span className='rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20'>
                                    Preview
                                  </span>
                                )}
                                {lesson.type === 'video' && lesson.videoUrl && (
                                  <button
                                    className={`rounded-full p-2 transition-colors duration-200 ${
                                      lesson.isPreview || isEnrolled
                                        ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
                                    }`}
                                    disabled={!lesson.isPreview && !isEnrolled}
                                  >
                                    <Play className='h-4 w-4' />
                                  </button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className='lg:col-span-1'>
            <div className={`${panelClass} sticky top-24 p-6`}>
              <div className='border-b border-slate-200 pb-6 dark:border-slate-800'>
                <p className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                  Enrollment
                </p>
                <div className='mt-4 flex items-end gap-2'>
                  <span className='text-4xl font-semibold text-slate-900 dark:text-slate-100'>
                    {course.isFree ? 'Free' : `$${course.price}`}
                  </span>
                  {!course.isFree && (
                    <span className='pb-1 text-sm text-slate-500 dark:text-slate-400'>
                      {course.currency || 'USD'}
                    </span>
                  )}
                </div>
                {course.isFree && (
                  <span className='mt-3 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20'>
                    Free access
                  </span>
                )}
              </div>
              <div className='mt-6 space-y-4'>
               
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2 text-slate-600 dark:text-slate-400'>
                    <Users className='h-4 w-4' />
                    <span className='text-sm'>Learners</span>
                  </div>
                  <span className='text-sm font-medium text-slate-900 dark:text-slate-100'>
                    {course.students}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2 text-slate-600 dark:text-slate-400'>
                    <Video className='h-4 w-4' />
                    <span className='text-sm'>Sections</span>
                  </div>
                  <span className='text-sm font-medium text-slate-900 dark:text-slate-100'>
                    {course.sectionCount}
                  </span>
                </div>
              </div>

              <div className='mt-6 space-y-3'>
                {user ? (
                  isEnrolled ? (
                    <div className='space-y-3'>
                      <div className='flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20'>
                        <CheckCircle className='h-4 w-4' />
                        <span>Enrolled</span>
                      </div>
                      <Link
                        to='/dashboard'
                        className='block rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                      >
                        Go to Dashboard
                      </Link>
                    </div>
                  ) : course.isFree ? (
                    <button
                      onClick={handleEnroll}
                      disabled={isEnrolling}
                      className='w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                    >
                      {isEnrolling ? 'Enrolling...' : 'Enroll for Free'}
                    </button>
                  ) : (
                    <CheckoutButton
                      courseId={course.id}
                      courseTitle={course.title}
                      price={course.price}
                      currency={course.currency || 'USD'}
                      onError={(checkoutError) => setError(checkoutError)}
                      onSuccess={() => {
                        console.log(
                          'Checkout initiated for course:',
                          course.title,
                        );
                      }}
                    />
                  )
                ) : (
                  <div className='space-y-3'>
                    <Link
                      to='/register'
                      className='block rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                    >
                      {course.isFree
                        ? 'Sign Up to Enroll for Free'
                        : 'Sign Up to Purchase'}
                    </Link>
                    <Link
                      to='/login'
                      className='block rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                    >
                      {course.isFree
                        ? 'Already have an account?'
                        : 'Login to Purchase'}
                    </Link>
                  </div>
                )}
              </div>

              <div className='mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950'>
                <div className='flex items-center gap-2'>
                  <Sparkles className='h-4 w-4 text-emerald-500' />
                  <span className='text-sm font-semibold text-slate-900 dark:text-slate-100'>
                    30-Day Money Back Guarantee
                  </span>
                </div>
                <p className='mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400'>
                  Not satisfied? Get a full refund within 30 days of purchase.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
