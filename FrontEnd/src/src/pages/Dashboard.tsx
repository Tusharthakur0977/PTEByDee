import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  Play,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Video,
  CreditCard,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import CourseImage from '../components/CourseImage';
import { useAuth } from '../contexts/AuthContext';
import { useProgressOverview } from '../hooks/useProgress';
import type { Course } from '../services/courses';
import {
  getCourses,
  getEnrolledCourses,
  testEnrollment,
} from '../services/courses';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = React.useState<Course[]>([]);
  const [recommendedCourses, setRecommendedCourses] = React.useState<Course[]>(
    []
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [recentActivity, setRecentActivity] = React.useState<any[]>([]);
  const { overview: progressOverview } = useProgressOverview();

  React.useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch enrolled courses using dedicated endpoint
      const enrolledCoursesResponse = await getEnrolledCourses();
      console.log(
        'Dashboard - Enrolled courses response:',
        enrolledCoursesResponse
      );

      // Fetch all courses for recommendations
      const allCoursesResponse = await getCourses({ limit: 50 });
      const allCourses = allCoursesResponse.courses;

      // Debug logging
      console.log('Dashboard - All courses response:', allCoursesResponse);
      console.log('Dashboard - User from auth context:', user);

      // Get recommended courses (non-enrolled courses)
      const recommended = allCourses
        .filter((course) => !course.isEnrolled)
        .slice(0, 3);

      setEnrolledCourses(enrolledCoursesResponse.courses);
      setRecommendedCourses(recommended);

      // Mock recent activity data (you can replace this with actual API calls)
      setRecentActivity([
        {
          id: '1',
          type: 'lesson_completed',
          title: 'Completed "Speaking Module 1"',
          courseTitle:
            enrolledCoursesResponse.courses[0]?.title || 'PTE Course',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          icon: CheckCircle,
          color: 'green',
        },
        {
          id: '2',
          type: 'course_started',
          title: 'Started new course',
          courseTitle:
            enrolledCoursesResponse.courses[1]?.title || 'Writing Excellence',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          icon: Play,
          color: 'blue',
        },
        {
          id: '3',
          type: 'achievement',
          title: 'Achieved 90% in Mock Test',
          courseTitle: 'Practice Test Series',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          icon: Trophy,
          color: 'purple',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-600';
    if (progress >= 50) return 'bg-blue-600';
    if (progress >= 25) return 'bg-yellow-600';
    return 'bg-gray-600';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  const handleTestEnrollment = async () => {
    try {
      const result = await testEnrollment();
      console.log('Test enrollment result:', result);
      alert('Test enrollment completed. Check console for details.');
      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      console.error('Test enrollment error:', error);
      alert('Test enrollment failed. Check console for details.');
    }
  };
  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
            Please log in to access your dashboard
          </h1>
          <Link
            to='/login'
            className='text-blue-600 hover:text-blue-800'
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-8'>
      <div className='container mx-auto px-4'>
        {/* Welcome Header */}
        <div className='bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-8 mb-8'>
          <div className='flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6'>
            <div>
              <h1 className='text-2xl sm:text-3xl font-bold mb-2'>
                Welcome back, {user.name}!
              </h1>
              <p className='text-blue-100 text-base sm:text-lg'>
                Continue your PTE journey and achieve your goals
              </p>
            </div>
            <div className='w-full lg:w-auto'>
              <div className='bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6'>
                <div className='flex items-center space-x-2 mb-2'>
                  <Trophy className='h-6 w-6 text-yellow-300' />
                  <span className='font-semibold'>Current Progress</span>
                </div>
                <div className='text-2xl font-bold'>
                  {enrolledCourses.length} Courses
                </div>
                <div className='text-sm text-blue-100'>Keep learning!</div>
              </div>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
          {/* Main Content */}
          <div className='xl:col-span-2 space-y-8'>
            {/* Quick Stats */}
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
              <div className='bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center'>
                <div className='bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3'>
                  <BookOpen className='h-6 w-6 text-blue-600 dark:text-blue-400' />
                </div>
                <div className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-white'>
                  {enrolledCourses.length}
                </div>
                <div className='text-xs sm:text-sm text-gray-600 dark:text-gray-300'>
                  Enrolled Courses
                </div>
              </div>

              <div className='bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center'>
                <div className='bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3'>
                  <Clock className='h-6 w-6 text-green-600 dark:text-green-400' />
                </div>
                <div className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-white'>
                  24
                </div>
                <div className='text-xs sm:text-sm text-gray-600 dark:text-gray-300'>
                  Hours Studied
                </div>
              </div>

              <div className='bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center'>
                <div className='bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3'>
                  <Target className='h-6 w-6 text-purple-600 dark:text-purple-400' />
                </div>
                <div className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-white'>
                  85%
                </div>
                <div className='text-xs sm:text-sm text-gray-600 dark:text-gray-300'>
                  Avg. Progress
                </div>
              </div>

              <div className='bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center'>
                <div className='bg-orange-100 dark:bg-orange-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3'>
                  <Star className='h-6 w-6 text-orange-600 dark:text-orange-400' />
                </div>
                <div className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-white'>
                  4.8
                </div>
                <div className='text-xs sm:text-sm text-gray-600 dark:text-gray-300'>
                  Avg. Score
                </div>
              </div>
            </div>

            {/* Enrolled Courses */}
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
              <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>
                My Courses
              </h2>
              {isLoading ? (
                <div className='space-y-4'>
                  {[...Array(2)].map((_, index) => (
                    <div
                      key={index}
                      className='border dark:border-gray-700 rounded-lg p-4 animate-pulse'
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2'></div>
                          <div className='h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mb-3'></div>
                          <div className='flex items-center space-x-4 mb-3'>
                            <div className='h-3 bg-gray-300 dark:bg-gray-600 rounded w-16'></div>
                            <div className='h-3 bg-gray-300 dark:bg-gray-600 rounded w-16'></div>
                          </div>
                          <div className='h-2 bg-gray-300 dark:bg-gray-600 rounded w-full'></div>
                        </div>
                        <div className='ml-4'>
                          <div className='h-8 bg-gray-300 dark:bg-gray-600 rounded w-20'></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : enrolledCourses.length > 0 ? (
                <div className='space-y-4'>
                  {enrolledCourses.map((course) => (
                    <div
                      key={course.id}
                      className='border dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-750'
                    >
                      <div className='flex items-start space-x-4'>
                        {/* Course Image */}
                        <div className='flex-shrink-0'>
                          <CourseImage
                            src={course.imageUrl}
                            alt={course.title}
                            className='w-20 h-20'
                            showLoadingSpinner={true}
                          />
                        </div>

                        {/* Course Info */}
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between mb-3'>
                            <div className='flex-1'>
                              <h3 className='text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1'>
                                {course.title}
                              </h3>
                              <p className='text-gray-600 dark:text-gray-300 mb-3 line-clamp-2 text-sm'>
                                {course.description}
                              </p>
                            </div>
                          </div>

                          {/* Course Stats */}
                          <div className='flex items-center space-x-6 mb-4 text-sm text-gray-500 dark:text-gray-400'>
                            <div className='flex items-center space-x-1'>
                              <Video className='h-4 w-4' />
                              <span>{course.sectionCount} sections</span>
                            </div>
                            <div className='flex items-center space-x-1'>
                              <Star className='h-4 w-4 fill-current text-yellow-400' />
                              <span>{course.rating}</span>
                            </div>
                            <div className='flex items-center space-x-1'>
                              <Clock className='h-4 w-4' />
                              <span>
                                Enrolled{' '}
                                {new Date(
                                  course.userEnrollment?.enrolledAt || ''
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Progress Section */}
                          <div className='mb-4'>
                            <div className='flex justify-between items-center mb-2'>
                              <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Progress
                              </span>
                              <div className='flex items-center space-x-2'>
                                <span className='text-sm font-bold text-gray-900 dark:text-white'>
                                  {Math.round(
                                    course.userEnrollment?.progress || 0
                                  )}
                                  %
                                </span>
                                {course.userEnrollment?.completed && (
                                  <div className='flex items-center space-x-1 text-green-600 dark:text-green-400'>
                                    <Award className='h-4 w-4' />
                                    <span className='text-xs font-medium'>
                                      Completed
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden'>
                              <div
                                className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(
                                  course.userEnrollment?.progress || 0
                                )}`}
                                style={{
                                  width: `${
                                    course.userEnrollment?.progress || 0
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className='flex items-center space-x-3'>
                            <Link
                              to={`/courses/${course.id}`}
                              className='flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg'
                            >
                              <Play className='h-4 w-4' />
                              <span>Continue Learning</span>
                            </Link>

                            <Link
                              to={`/courses/${course.id}`}
                              className='flex items-center space-x-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200'
                            >
                              <BookOpen className='h-4 w-4' />
                              <span>View Details</span>
                            </Link>

                            {course.userEnrollment?.completed && (
                              <div className='flex items-center space-x-1 text-green-600 dark:text-green-400 text-sm'>
                                <Award className='h-4 w-4' />
                                <span>Completed</span>
                              </div>
                            )}

                            {(course.userEnrollment?.progress || 0) > 0 && (
                              <div className='flex items-center space-x-1 text-green-600 dark:text-green-400 text-sm'>
                                <TrendingUp className='h-4 w-4' />
                                <span>In Progress</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-12'>
                  <div className='bg-blue-50 dark:bg-blue-900/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4'>
                    <BookOpen className='h-10 w-10 text-blue-600 dark:text-blue-400' />
                  </div>
                  <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                    Start Your Learning Journey
                  </h3>
                  <p className='text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto'>
                    You haven't enrolled in any courses yet. Explore our
                    comprehensive PTE preparation courses and start achieving
                    your goals.
                  </p>
                  <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                    <Link
                      to='/courses'
                      className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2'
                    >
                      <BookOpen className='h-5 w-5' />
                      <span>Browse Courses</span>
                    </Link>
                    <Link
                      to='/portal'
                      className='border border-blue-600 text-blue-600 dark:text-blue-400 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200 flex items-center justify-center space-x-2'
                    >
                      <Target className='h-5 w-5' />
                      <span>Take Practice Test</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Learning Progress Overview */}
            {enrolledCourses.length > 0 && (
              <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>
                  Learning Progress
                </h2>
                {progressOverview ? (
                  <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                    <div className='text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                      <div className='text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2'>
                        {progressOverview.statistics.totalCourses}
                      </div>
                      <div className='text-sm text-gray-600 dark:text-gray-300'>
                        Enrolled Courses
                      </div>
                    </div>
                    <div className='text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg'>
                      <div className='text-3xl font-bold text-green-600 dark:text-green-400 mb-2'>
                        {progressOverview.statistics.completedCourses}
                      </div>
                      <div className='text-sm text-gray-600 dark:text-gray-300'>
                        Completed
                      </div>
                    </div>
                    <div className='text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
                      <div className='text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2'>
                        {Math.round(
                          progressOverview.statistics.averageProgress
                        )}
                        %
                      </div>
                      <div className='text-sm text-gray-600 dark:text-gray-300'>
                        Average Progress
                      </div>
                    </div>
                    <div className='text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg'>
                      <div className='text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2'>
                        {progressOverview.statistics.totalTimeSpent}m
                      </div>
                      <div className='text-sm text-gray-600 dark:text-gray-300'>
                        Time Spent
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    <div className='text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                      <div className='text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2'>
                        {enrolledCourses.length}
                      </div>
                      <div className='text-sm text-gray-600 dark:text-gray-300'>
                        Enrolled Courses
                      </div>
                    </div>
                    <div className='text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg'>
                      <div className='text-3xl font-bold text-green-600 dark:text-green-400 mb-2'>
                        {
                          enrolledCourses.filter(
                            (c) => c.userEnrollment?.completed
                          ).length
                        }
                      </div>
                      <div className='text-sm text-gray-600 dark:text-gray-300'>
                        Completed
                      </div>
                    </div>
                    <div className='text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
                      <div className='text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2'>
                        {Math.round(
                          enrolledCourses.reduce(
                            (sum, course) =>
                              sum + (course.userEnrollment?.progress || 0),
                            0
                          ) / enrolledCourses.length
                        )}
                        %
                      </div>
                      <div className='text-sm text-gray-600 dark:text-gray-300'>
                        Average Progress
                      </div>
                    </div>
                    <div className='text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg'>
                      <div className='text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2'>
                        <Link
                          to='/payment/history'
                          className='hover:underline'
                        >
                          View
                        </Link>
                      </div>
                      <div className='text-sm text-gray-600 dark:text-gray-300'>
                        Payment History
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recent Activity */}
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
              <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>
                Recent Activity
              </h2>
              <div className='space-y-4'>
                {(progressOverview?.recentActivity || recentActivity)
                  .slice(0, 5)
                  .map((activity) => {
                    const IconComponent = activity.icon;
                    return (
                      <div
                        key={activity.id}
                        className='flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200'
                      >
                        <div
                          className={`p-2 rounded-full ${
                            activity.isCompleted || activity.color === 'green'
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : activity.color === 'blue'
                              ? 'bg-blue-100 dark:bg-blue-900/30'
                              : 'bg-purple-100 dark:bg-purple-900/30'
                          }`}
                        >
                          {IconComponent ? (
                            <IconComponent
                              className={`h-5 w-5 ${
                                activity.isCompleted ||
                                activity.color === 'green'
                                  ? 'text-green-600 dark:text-green-400'
                                  : activity.color === 'blue'
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-purple-600 dark:text-purple-400'
                              }`}
                            />
                          ) : (
                            <CheckCircle
                              className={`h-5 w-5 ${
                                activity.isCompleted
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-blue-600 dark:text-blue-400'
                              }`}
                            />
                          )}
                        </div>
                        <div className='flex-1'>
                          <p className='text-gray-900 dark:text-white font-medium'>
                            {activity.title ||
                              (activity.isCompleted
                                ? 'Completed'
                                : 'Accessed') + ` "${activity.lessonTitle}"`}
                          </p>
                          <p className='text-sm text-gray-500 dark:text-gray-400'>
                            {activity.courseTitle || activity.sectionTitle}
                          </p>
                          <p className='text-xs text-gray-400 dark:text-gray-500 mt-1'>
                            {activity.timestamp
                              ? formatTimeAgo(activity.timestamp)
                              : new Date(
                                  activity.lastAccessedAt ||
                                    activity.completedAt
                                ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Today's Goals */}
            {/* <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
              <h3 className='text-lg font-bold text-gray-900 dark:text-white mb-4'>
                Today's Goals
              </h3>
              <div className='space-y-3'>
                <div className='flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-2 h-2 bg-blue-600 rounded-full'></div>
                    <span className='text-gray-900 dark:text-white font-medium text-sm'>
                      Complete 1 lesson
                    </span>
                  </div>
                  <CheckCircle className='h-4 w-4 text-green-500' />
                </div>
                <div className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-2 h-2 bg-gray-400 rounded-full'></div>
                    <span className='text-gray-900 dark:text-white font-medium text-sm'>
                      Practice speaking for 15 min
                    </span>
                  </div>
                  <div className='w-4 h-4 border-2 border-gray-300 rounded-full'></div>
                </div>
                <div className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-2 h-2 bg-gray-400 rounded-full'></div>
                    <span className='text-gray-900 dark:text-white font-medium text-sm'>
                      Review vocabulary
                    </span>
                  </div>
                  <div className='w-4 h-4 border-2 border-gray-300 rounded-full'></div>
                </div>
              </div>
            </div> */}

            {/* Quick Actions */}
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
              <h3 className='text-lg font-bold text-gray-900 dark:text-white mb-4'>
                Quick Actions
              </h3>
              <div className='space-y-3'>
                <Link
                  to='/portal'
                  className='w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg'
                >
                  <Target className='h-4 w-4' />
                  <span>Take Practice Test</span>
                </Link>
                <Link
                  to='/courses'
                  className='w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center space-x-2'
                >
                  <BookOpen className='h-4 w-4' />
                  <span>Browse Courses</span>
                </Link>
                <Link
                  to='/payment/history'
                  className='w-full border border-blue-600 text-blue-600 dark:text-blue-400 px-4 py-3 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200 flex items-center justify-center space-x-2'
                >
                  <CreditCard className='h-4 w-4' />
                  <span>Payment History</span>
                </Link>
              </div>
            </div>

            {/* Study Streak */}
            {/* <div className='bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl shadow-lg p-6 border border-orange-200 dark:border-orange-800'>
              <div className='text-center'>
                <div className='text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2'>
                  {progressOverview?.statistics.totalTimeSpent
                    ? Math.floor(
                        progressOverview.statistics.totalTimeSpent / 60
                      ) || 1
                    : 7}
                </div>
                <div className='text-sm text-orange-700 dark:text-orange-300 font-medium mb-3'>
                  {progressOverview?.statistics.totalTimeSpent
                    ? 'Hours Studied'
                    : 'Day Study Streak'}
                </div>
                <div className='flex justify-center space-x-1 mb-3'>
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className='w-2 h-2 bg-orange-500 rounded-full'
                    ></div>
                  ))}
                </div>
                <p className='text-xs text-orange-600 dark:text-orange-400'>
                  Keep it up! You're doing great.
                </p>
              </div>
            </div> */}

            {/* Recommended Courses */}
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
              <h3 className='text-lg font-bold text-gray-900 dark:text-white mb-4'>
                Recommended for You
              </h3>
              {isLoading ? (
                <div className='space-y-4'>
                  {[...Array(3)].map((_, index) => (
                    <div
                      key={index}
                      className='border dark:border-gray-700 rounded-lg p-3 animate-pulse'
                    >
                      <div className='h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2'></div>
                      <div className='h-2 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2'></div>
                      <div className='flex items-center justify-between'>
                        <div className='h-3 bg-gray-300 dark:bg-gray-600 rounded w-12'></div>
                        <div className='h-6 bg-gray-300 dark:bg-gray-600 rounded w-12'></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='space-y-4'>
                  {recommendedCourses.map((course) => (
                    <div
                      key={course.id}
                      className='border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200'
                    >
                      <div className='flex items-start space-x-3'>
                        <CourseImage
                          src={course.imageUrl}
                          alt={course.title}
                          className='w-12 h-12'
                          showLoadingSpinner={false}
                          fallbackUrl='https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=100'
                        />
                        <div className='flex-1'>
                          <h4 className='font-semibold text-sm text-gray-900 dark:text-white mb-1'>
                            {course.title}
                          </h4>
                          <p className='text-xs text-gray-600 dark:text-gray-300 mb-3 line-clamp-2'>
                            {course.description}
                          </p>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center space-x-2'>
                              <span className='text-sm font-bold text-blue-600 dark:text-blue-400'>
                                {course.isFree ? 'Free' : `$${course.price}`}
                              </span>
                              <div className='flex items-center space-x-1'>
                                <Star className='h-3 w-3 fill-current text-yellow-400' />
                                <span className='text-xs text-gray-500'>
                                  {course.rating}
                                </span>
                              </div>
                            </div>
                            <Link
                              to={`/courses/${course.id}`}
                              className='text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors duration-200 flex items-center space-x-1'
                            >
                              <span>View</span>
                              <ArrowRight className='h-3 w-3' />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Link
                to='/courses'
                className='block mt-4 text-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium'
              >
                View All Courses →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
