import React from 'react';
import { useParams, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { getCourseById, enrollInCourse } from '../services/courses';
import type { Course } from '../services/courses';
import { useAuth } from '../contexts/AuthContext';
import VideoPlayer from '../components/VideoPlayer';
import LessonPlayer from '../components/LessonPlayer';
import ProgressTracker from '../components/progressTracker';
import { useCourseProgress } from '../hooks/useProgress';

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [course, setCourse] = React.useState<Course | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = React.useState(false);
  const { progress, refreshProgress } = useCourseProgress(id || '');

  React.useEffect(() => {
    if (id) {
      fetchCourse();
    }
  }, [id]);

  const fetchCourse = async () => {
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
  };

  const handleEnroll = async () => {
    if (!user) {
      // Redirect to login
      return;
    }

    try {
      setIsEnrolling(true);
      await enrollInCourse(id!);
      // Refresh course data to update enrollment status
      await fetchCourse();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to enroll in course');
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-red-600 mb-4'>Error</h1>
          <p className='text-gray-600 mb-4'>{error || 'Course not found'}</p>
          <div className='space-x-4'>
            <button
              onClick={fetchCourse}
              className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
            >
              Try Again
            </button>
            <Link
              to='/courses'
              className='bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700'
            >
              Back to Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isEnrolled = course.isEnrolled || false;
  const discount = 0; // Can be calculated if originalPrice is added to the API

  // If user is enrolled, show the learning interface
  if (isEnrolled) {
    return (
      <div className='min-h-screen py-8'>
        <div className='container mx-auto px-4'>
          {/* Back Button */}
          <Link
            to='/dashboard'
            className='inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-8'
          >
            <ArrowLeft className='h-4 w-4' />
            <span>Back to Dashboard</span>
          </Link>

          {/* Course Header */}
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-4'>
                  {course.title}
                </h1>
                <p className='text-gray-600 dark:text-gray-300 mb-4'>
                  {course.description}
                </p>

                {/* Progress Bar */}
                {course.userEnrollment && (
                  <div className='mb-4'>
                    <div className='flex justify-between items-center mb-2'>
                      <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                        Course Progress
                      </span>
                      <span className='text-sm font-bold text-gray-900 dark:text-white'>
                        {Math.round(course.userEnrollment.progress || 0)}%
                      </span>
                    </div>
                    <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3'>
                      <div
                        className='bg-blue-600 h-3 rounded-full transition-all duration-500'
                        style={{
                          width: `${course.userEnrollment.progress || 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Course Stats */}
              <div className='ml-8 text-right'>
                <div className='flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400'>
                  <div className='flex items-center space-x-1'>
                    <BookOpen className='h-4 w-4' />
                    <span>{course.sectionCount} sections</span>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <Star className='h-4 w-4 fill-current text-yellow-400' />
                    <span>{course.rating}</span>
                  </div>
                </div>
                {course.userEnrollment?.completed && (
                  <div className='mt-2 inline-flex items-center space-x-1 text-green-600 dark:text-green-400'>
                    <CheckCircle className='h-4 w-4' />
                    <span className='text-sm font-medium'>Completed</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Tracker */}
          {progress && (
            <div className='mb-8'>
              <ProgressTracker progress={progress} />
            </div>
          )}

          {/* Course Content - Learning Interface */}
          <div className='space-y-6'>
            {course.sections?.map((section, sectionIndex) => (
              <div
                key={section.id}
                className='bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden'
              >
                <div className='bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-6 py-4 border-b dark:border-gray-700'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
                      Section {sectionIndex + 1}: {section.title}
                    </h3>
                    <span className='text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full'>
                      {section.lessons.length} lessons
                    </span>
                  </div>
                  {section.description && (
                    <p className='text-gray-600 dark:text-gray-300 mt-2'>
                      {section.description}
                    </p>
                  )}
                </div>

                {/* Section Video */}
                {(section.videoUrl || section.videoKey) && (
                  <div className='p-6 border-b dark:border-gray-700'>
                    <h4 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
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

                {/* Lessons */}
                <div className='p-6'>
                  <h4 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
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
                          progress?.sections
                            .find((s) => s.id === section.id)
                            ?.lessons.find((l) => l.id === lesson.id)
                            ?.isCompleted || false
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
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className='h-4 w-4' />;
      case 'quiz':
        return <HelpCircle className='h-4 w-4' />;
      case 'assignment':
        return <PenTool className='h-4 w-4' />;
      default:
        return <FileText className='h-4 w-4' />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'text-blue-600 dark:text-blue-400';
      case 'quiz':
        return 'text-green-600 dark:text-green-400';
      case 'assignment':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className='min-h-screen py-8'>
      <div className='container mx-auto px-4'>
        {/* Back Button */}
        <Link
          to='/courses'
          className='inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-8'
        >
          <ArrowLeft className='h-4 w-4' />
          <span>Back to Courses</span>
        </Link>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-12'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-8'>
            {/* Course Header */}
            <div>
              <div className='flex items-center space-x-4 mb-4'>
                <span className='px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full'>
                  {course.level}
                </span>
                <div className='flex items-center space-x-1'>
                  <Star className='h-4 w-4 fill-current text-yellow-400' />
                  <span className='text-sm font-medium text-gray-900 dark:text-white'>
                    {course.rating}
                  </span>
                  <span className='text-sm text-gray-500 dark:text-gray-400'>
                    ({course.students} students)
                  </span>
                </div>
              </div>
              <h1 className='text-4xl font-bold text-gray-900 dark:text-white mb-4'>
                {course.title}
              </h1>
              <p className='text-xl text-gray-600 dark:text-gray-300 leading-relaxed'>
                {course.detailedDescription || course.description}
              </p>
            </div>

            {/* Course Preview Video */}
            {(course.coursePreviewVideoUrl ||
              course.curriculum?.[0]?.lessons[0]?.videoUrl) && (
              <div>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
                  Course Preview
                </h2>
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

            {/* Course Content Preview for Enrolled Users */}
            {isEnrolled && course.sections && course.sections.length > 0 && (
              <div>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>
                  Course Content
                </h2>
                <div className='space-y-4'>
                  {course.sections.map((section, sectionIndex) => (
                    <div
                      key={section.id}
                      className='bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700'
                    >
                      <div className='bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b dark:border-gray-600'>
                        <div className='flex items-center justify-between'>
                          <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                            Section {sectionIndex + 1}: {section.title}
                          </h3>
                          <span className='text-sm text-gray-500 dark:text-gray-400'>
                            {section.lessons.length} lessons
                          </span>
                        </div>
                        {section.description && (
                          <p className='text-sm text-gray-600 dark:text-gray-300 mt-2'>
                            {section.description}
                          </p>
                        )}
                      </div>

                      {/* Section Video */}
                      {(section.videoUrl || section.videoKey) && (
                        <div className='p-6 border-b dark:border-gray-600'>
                          <VideoPlayer
                            videoUrl={section.videoUrl}
                            videoKey={section.videoKey}
                            courseId={course.id}
                            title={`${section.title} - Overview`}
                            isPreview={false}
                            isEnrolled={isEnrolled}
                          />
                        </div>
                      )}

                      {/* Lessons */}
                      <div className='p-6'>
                        <div className='space-y-3'>
                          {section.lessons.map((lesson, lessonIndex) => (
                            <div
                              key={lesson.id}
                              className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200'
                            >
                              <div className='flex items-center space-x-3'>
                                <div className='text-gray-400'>
                                  {lesson.type === 'video' ? (
                                    <Video className='h-5 w-5' />
                                  ) : lesson.type === 'audio' ? (
                                    <Headphones className='h-5 w-5' />
                                  ) : (
                                    <FileText className='h-5 w-5' />
                                  )}
                                </div>
                                <div className='flex-1'>
                                  <h4 className='text-sm font-medium text-gray-900 dark:text-white'>
                                    {lesson.title}
                                  </h4>
                                  {lesson.description && (
                                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                      {lesson.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className='flex items-center space-x-3'>
                                <span className='text-xs text-gray-500 dark:text-gray-400'>
                                  {lesson.duration || '15 min'}
                                </span>
                                {lesson.videoUrl && (
                                  <button className='p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200'>
                                    <Play className='h-4 w-4' />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Features */}
            {course.features && course.features.length > 0 && (
              <div>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>
                  What You'll Learn
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {course.features.map((feature, index) => (
                    <div
                      key={index}
                      className='flex items-start space-x-3'
                    >
                      <CheckCircle className='h-5 w-5 text-green-500 mt-0.5 flex-shrink-0' />
                      <span className='text-gray-700 dark:text-gray-300'>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Curriculum */}
            {course.curriculum && course.curriculum.length > 0 && (
              <div>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>
                  Course Curriculum
                </h2>
                <div className='space-y-4'>
                  {course.curriculum.map((module, index) => (
                    <div
                      key={index}
                      className='bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden'
                    >
                      <div className='bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b dark:border-gray-600'>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                          Module {index + 1}: {module.title}
                        </h3>
                        <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                          {module.lessons.length} lessons
                        </p>
                      </div>
                      <div className='p-6'>
                        <ul className='space-y-4'>
                          {module.lessons.map((lesson, lessonIndex) => (
                            <li
                              key={lessonIndex}
                              className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'
                            >
                              <div className='flex items-center space-x-3'>
                                <div className={`${getTypeColor(lesson.type)}`}>
                                  {getTypeIcon(lesson.type)}
                                </div>
                                <div>
                                  <span className='text-gray-900 dark:text-white font-medium'>
                                    {lesson.title}
                                  </span>
                                  {lesson.duration && (
                                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                                      {lesson.duration}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className='flex items-center space-x-2'>
                                {lesson.isPreview && (
                                  <span className='text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full'>
                                    Preview
                                  </span>
                                )}
                                {lesson.type === 'video' && lesson.videoUrl && (
                                  <button
                                    className={`p-2 rounded-full transition-colors duration-200 ${
                                      lesson.isPreview || isEnrolled
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                                        : 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
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

            {/* Instructor */}
            {course.instructor && (
              <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>
                  Your Instructor
                </h2>
                <div className='flex items-start space-x-4'>
                  <div className='bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold'>
                    {course.instructor.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                      {course.instructor.name}
                    </h3>
                    <p className='text-gray-600 dark:text-gray-300 mb-2'>
                      {course.instructor.experience} of teaching experience
                    </p>
                    <p className='text-gray-700 dark:text-gray-300'>
                      {course.instructor.bio}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className='lg:col-span-1'>
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-24'>
              {/* Price */}
              <div className='text-center mb-6'>
                <div className='flex items-center justify-center space-x-2 mb-2'>
                  <span className='text-3xl font-bold text-blue-600 dark:text-blue-400'>
                    ${course.price}
                  </span>
                </div>
                {course.isFree && (
                  <span className='inline-block bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-md text-sm font-semibold'>
                    FREE
                  </span>
                )}
              </div>

              {/* Course Info */}
              <div className='space-y-4 mb-6'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <Clock className='h-5 w-5 text-gray-400' />
                    <span className='text-gray-700 dark:text-gray-300'>
                      Duration
                    </span>
                  </div>
                  <span className='font-medium text-gray-900 dark:text-white'>
                    {course.duration}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <Users className='h-5 w-5 text-gray-400' />
                    <span className='text-gray-700 dark:text-gray-300'>
                      Students
                    </span>
                  </div>
                  <span className='font-medium text-gray-900 dark:text-white'>
                    {course.students}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <BookOpen className='h-5 w-5 text-gray-400' />
                    <span className='text-gray-700 dark:text-gray-300'>
                      Level
                    </span>
                  </div>
                  <span className='font-medium text-gray-900 dark:text-white'>
                    {course.level}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <Video className='h-5 w-5 text-gray-400' />
                    <span className='text-gray-700 dark:text-gray-300'>
                      Sections
                    </span>
                  </div>
                  <span className='font-medium text-gray-900 dark:text-white'>
                    {course.sectionCount}
                  </span>
                </div>
              </div>

              {/* Enroll Button */}
              {user ? (
                isEnrolled ? (
                  <div className='space-y-3'>
                    <div className='w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold text-center'>
                      ✓ Enrolled
                    </div>
                    <Link
                      to='/dashboard'
                      className='w-full border border-green-600 text-green-600 dark:text-green-400 py-3 px-4 rounded-lg font-semibold text-center block hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors duration-200'
                    >
                      Go to Dashboard
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={isEnrolling}
                    className='w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {isEnrolling
                      ? 'Enrolling...'
                      : course.isFree
                      ? 'Enroll for Free'
                      : 'Enroll Now'}
                  </button>
                )
              ) : (
                <div className='space-y-3'>
                  <Link
                    to='/register'
                    className='w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold text-center block transition-colors duration-200'
                  >
                    Sign Up to Enroll
                  </Link>
                  <Link
                    to='/login'
                    className='w-full border border-blue-600 text-blue-600 dark:text-blue-400 py-3 px-4 rounded-lg font-semibold text-center block hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200'
                  >
                    Already have an account?
                  </Link>
                </div>
              )}

              {/* 30-day guarantee */}
              <div className='mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg'>
                <div className='flex items-center space-x-2 mb-2'>
                  <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />
                  <span className='font-semibold text-green-800 dark:text-green-300'>
                    30-Day Money Back Guarantee
                  </span>
                </div>
                <p className='text-sm text-green-700 dark:text-green-300'>
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
