import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  Star,
  Calendar,
  DollarSign,
  BookOpen,
  Play,
  FileText,
  Eye,
  Download,
} from 'lucide-react';
import { getCourseById, deleteCourse } from '../../services/admin';

const AdminCourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCourse();
    }
  }, [id]);

  const fetchCourse = async () => {
    try {
      setIsLoading(true);
      const response = await getCourseById(id!);
      if (response.success) {
        setCourse(response.data);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch course');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    try {
      const response = await deleteCourse(id!);
      if (response.success) {
        navigate('/admin/courses');
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete course');
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
          <p className='text-gray-600'>{error || 'Course not found'}</p>
          <button
            onClick={() => navigate('/admin/courses')}
            className='mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg'
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Header */}
      <div className='bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700'>
        <div className='container mx-auto px-4 py-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <button
                onClick={() => navigate('/admin/courses')}
                className='p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
              >
                <ArrowLeft className='h-5 w-5' />
              </button>
              <div>
                <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                  {course.title}
                </h1>
                <p className='text-gray-600 dark:text-gray-300 mt-1'>
                  Course Details & Management
                </p>
              </div>
            </div>
            <div className='flex items-center space-x-3'>
              <Link
                to={`/courses/${course.id}`}
                className='border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2'
              >
                <Eye className='h-4 w-4' />
                <span>View Public</span>
              </Link>
              <Link
                to={`/admin/courses/${course.id}/edit`}
                className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2'
              >
                <Edit className='h-4 w-4' />
                <span>Edit Course</span>
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2'
              >
                <Trash2 className='h-4 w-4' />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-8'>
            {/* Course Overview */}
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
              <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-4'>
                Course Overview
              </h2>
              <div className='space-y-4'>
                <div>
                  <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide'>
                    Description
                  </h3>
                  <p className='text-gray-900 dark:text-white mt-1'>
                    {course.description}
                  </p>
                </div>

                {course.imageUrl && (
                  <div>
                    <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2'>
                      Course Image
                    </h3>
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className='w-full max-w-md h-48 object-cover rounded-lg'
                    />
                  </div>
                )}

                {course.coursePreviewVideoUrl && (
                  <div>
                    <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2'>
                      Preview Video
                    </h3>
                    <div className='bg-gray-100 dark:bg-gray-700 p-4 rounded-lg'>
                      <a
                        href={course.coursePreviewVideoUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-2'
                      >
                        <Play className='h-4 w-4' />
                        <span>View Preview Video</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Course Content */}
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
              <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-6'>
                Course Content
              </h2>
              {course.sections && course.sections.length > 0 ? (
                <div className='space-y-4'>
                  {course.sections.map((section: any, index: number) => (
                    <div
                      key={section.id}
                      className='border border-gray-200 dark:border-gray-600 rounded-lg p-4'
                    >
                      <div className='flex items-center justify-between mb-3'>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                          Section {index + 1}: {section.title}
                        </h3>
                        <span className='text-sm text-gray-500 dark:text-gray-400'>
                          {section.lessons?.length || 0} lessons
                        </span>
                      </div>

                      {section.description && (
                        <p className='text-gray-600 dark:text-gray-300 mb-3'>
                          {section.description}
                        </p>
                      )}

                      {section.lessons && section.lessons.length > 0 && (
                        <div className='space-y-2'>
                          {section.lessons.map(
                            (lesson: any, lessonIndex: number) => (
                              <div
                                key={lesson.id}
                                className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'
                              >
                                <div className='flex items-center space-x-3'>
                                  <div className='text-gray-400'>
                                    {lesson.videoUrl ? (
                                      <Play className='h-4 w-4' />
                                    ) : (
                                      <FileText className='h-4 w-4' />
                                    )}
                                  </div>
                                  <div>
                                    <h4 className='text-sm font-medium text-gray-900 dark:text-white'>
                                      {lesson.title}
                                    </h4>
                                    {lesson.description && (
                                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                                        {lesson.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <span className='text-xs text-gray-500 dark:text-gray-400'>
                                  Lesson {lessonIndex + 1}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <BookOpen className='h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4' />
                  <p className='text-gray-500 dark:text-gray-400'>
                    No content sections added yet
                  </p>
                </div>
              )}
            </div>

            {/* Enrollments */}
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
              <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-6'>
                Recent Enrollments
              </h2>
              {course.userCourses && course.userCourses.length > 0 ? (
                <div className='space-y-3'>
                  {course.userCourses.slice(0, 10).map((enrollment: any) => (
                    <div
                      key={enrollment.id}
                      className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'
                    >
                      <div className='flex items-center space-x-3'>
                        <div className='bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold'>
                          {enrollment.user.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className='text-sm font-medium text-gray-900 dark:text-white'>
                            {enrollment.user.name}
                          </h4>
                          <p className='text-xs text-gray-500 dark:text-gray-400'>
                            {enrollment.user.email}
                          </p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='text-sm font-medium text-gray-900 dark:text-white'>
                          {Math.round(enrollment.progress)}% Complete
                        </div>
                        <div className='text-xs text-gray-500 dark:text-gray-400'>
                          Enrolled{' '}
                          {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <Users className='h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4' />
                  <p className='text-gray-500 dark:text-gray-400'>
                    No enrollments yet
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Course Stats */}
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
              <h3 className='text-lg font-bold text-gray-900 dark:text-white mb-4'>
                Course Statistics
              </h3>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <Users className='h-4 w-4 text-gray-400' />
                    <span className='text-gray-700 dark:text-gray-300'>
                      Enrollments
                    </span>
                  </div>
                  <span className='font-medium text-gray-900 dark:text-white'>
                    {course.stats?.totalEnrollments || 0}
                  </span>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <BookOpen className='h-4 w-4 text-gray-400' />
                    <span className='text-gray-700 dark:text-gray-300'>
                      Sections
                    </span>
                  </div>
                  <span className='font-medium text-gray-900 dark:text-white'>
                    {course.stats?.totalSections || 0}
                  </span>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <Play className='h-4 w-4 text-gray-400' />
                    <span className='text-gray-700 dark:text-gray-300'>
                      Lessons
                    </span>
                  </div>
                  <span className='font-medium text-gray-900 dark:text-white'>
                    {course.stats?.totalLessons || 0}
                  </span>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <Star className='h-4 w-4 text-gray-400' />
                    <span className='text-gray-700 dark:text-gray-300'>
                      Rating
                    </span>
                  </div>
                  <span className='font-medium text-gray-900 dark:text-white'>
                    {course.averageRating || 0} ({course.reviewCount || 0}{' '}
                    reviews)
                  </span>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <DollarSign className='h-4 w-4 text-gray-400' />
                    <span className='text-gray-700 dark:text-gray-300'>
                      Price
                    </span>
                  </div>
                  <span className='font-medium text-gray-900 dark:text-white'>
                    {course.isFree ? 'Free' : `$${course.price}`}
                  </span>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <Calendar className='h-4 w-4 text-gray-400' />
                    <span className='text-gray-700 dark:text-gray-300'>
                      Created
                    </span>
                  </div>
                  <span className='font-medium text-gray-900 dark:text-white'>
                    {new Date(course.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
              <h3 className='text-lg font-bold text-gray-900 dark:text-white mb-4'>
                Quick Actions
              </h3>
              <div className='space-y-3'>
                <Link
                  to={`/admin/courses/${course.id}/edit`}
                  className='w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2'
                >
                  <Edit className='h-4 w-4' />
                  <span>Edit Course</span>
                </Link>

                <Link
                  to={`/courses/${course.id}`}
                  className='w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center space-x-2'
                >
                  <Eye className='h-4 w-4' />
                  <span>View Public Page</span>
                </Link>

                <button className='w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center space-x-2'>
                  <Download className='h-4 w-4' />
                  <span>Export Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4'>
            <h3 className='text-lg font-bold text-gray-900 dark:text-white mb-4'>
              Confirm Delete
            </h3>
            <p className='text-gray-600 dark:text-gray-300 mb-6'>
              Are you sure you want to delete "{course.title}"? This action
              cannot be undone and will remove all associated data including
              enrollments and progress.
            </p>
            <div className='flex items-center justify-end space-x-3'>
              <button
                onClick={() => setShowDeleteModal(false)}
                className='px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCourse}
                className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200'
              >
                Delete Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourseDetail;
