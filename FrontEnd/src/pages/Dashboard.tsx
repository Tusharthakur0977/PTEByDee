import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  CreditCard,
  Play,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Video,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import CourseImage from '../components/CourseImage';
import { useAuth } from '../contexts/AuthContext';
import { useProgressOverview } from '../hooks/useProgress';
import type { Course } from '../services/courses';
import { getCourses, getEnrolledCourses } from '../services/courses';

const panelClass =
  'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = React.useState<Course[]>([]);
  const [recommendedCourses, setRecommendedCourses] = React.useState<Course[]>([]);
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

      const enrolledCoursesResponse = await getEnrolledCourses();
      const allCoursesResponse = await getCourses({ limit: 50 });
      const allCourses = allCoursesResponse.courses;

      const recommended = allCourses.filter((course) => !course.isEnrolled).slice(0, 3);

      setEnrolledCourses(enrolledCoursesResponse.courses);
      setRecommendedCourses(recommended);

      setRecentActivity([
        {
          id: '1',
          type: 'lesson_completed',
          title: 'Completed "Speaking Module 1"',
          courseTitle: enrolledCoursesResponse.courses[0]?.title || 'PTE Course',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          icon: CheckCircle,
          color: 'green',
        },
        {
          id: '2',
          type: 'course_started',
          title: 'Started new course',
          courseTitle: enrolledCoursesResponse.courses[1]?.title || 'Writing Excellence',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          icon: Play,
          color: 'blue',
        },
        {
          id: '3',
          type: 'achievement',
          title: 'Achieved 90% in Mock Test',
          courseTitle: 'Practice Test Series',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          icon: Trophy,
          color: 'slate',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressTone = (progress: number) => {
    if (progress >= 80) {
      return {
        bar: 'bg-emerald-500',
        badge:
          'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
      };
    }
    if (progress >= 50) {
      return {
        bar: 'bg-blue-500',
        badge:
          'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20',
      };
    }
    if (progress >= 25) {
      return {
        bar: 'bg-amber-500',
        badge:
          'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
      };
    }
    return {
      bar: 'bg-slate-400 dark:bg-slate-500',
      badge:
        'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    };
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-50 px-4 dark:bg-slate-950'>
        <div className='rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900'>
          <h1 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
            Please log in to access your dashboard
          </h1>
          <Link to='/login' className='mt-3 inline-flex text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const completedCourses = enrolledCourses.filter((course) => course.userEnrollment?.completed).length;
  const averageProgress = enrolledCourses.length
    ? Math.round(
        enrolledCourses.reduce((sum, course) => sum + (course.userEnrollment?.progress || 0), 0) /
          enrolledCourses.length,
      )
    : 0;
  const activeCourses = enrolledCourses.filter((course) => (course.userEnrollment?.progress || 0) > 0).length;
  const continueCourse =
    enrolledCourses.find(
      (course) =>
        (course.userEnrollment?.progress || 0) > 0 &&
        !course.userEnrollment?.completed,
    ) || enrolledCourses[0];

  const stats = [
    {
      label: 'Enrolled Courses',
      value: enrolledCourses.length,
      meta: `${completedCourses} completed`,
      icon: BookOpen,
    },
    {
      label: 'Active Learning',
      value: activeCourses,
      meta: 'Courses in progress',
      icon: TrendingUp,
    },
    {
      label: 'Average Progress',
      value: `${progressOverview ? Math.round(progressOverview.statistics.averageProgress) : averageProgress}%`,
      meta: progressOverview
        ? `${progressOverview.statistics.totalTimeSpent}m total time`
        : 'Across enrolled courses',
      icon: Target,
    },
    {
      label: 'Best Momentum',
      value: progressOverview ? `${progressOverview.statistics.completedCourses}` : `${completedCourses}`,
      meta: progressOverview ? 'Courses completed' : 'Course completions',
      icon: Award,
    },
  ];

  const activityFeed = (progressOverview?.recentActivity || recentActivity).slice(0, 5);

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        <div className='mb-6 grid gap-4 xl:grid-cols-[1.35fr_0.95fr]'>
          <div className='rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950'>
            <div className='flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between'>
              <div>
                <p className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                  My Dashboard
                </p>
                <h1 className='mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl'>
                  Welcome back, {user.name}
                </h1>
                <p className='mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400'>
                  Track your progress, jump back into active courses, and keep your PTE preparation moving every day.
                </p>
              </div>
              <div className='w-full lg:w-[340px]'>
                <div className='rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/80'>
                  <p className='text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400'>
                    Next Step
                  </p>

                  {continueCourse ? (
                    <div className='mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900'>
                      <p className='text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400'>
                        Continue Course
                      </p>
                      <h2 className='mt-2 line-clamp-2 text-lg font-semibold text-slate-900 dark:text-slate-100'>
                        {continueCourse.title}
                      </h2>
                      <div className='mt-3 flex items-center justify-between gap-3 text-sm'>
                        <span className='text-slate-500 dark:text-slate-400'>
                          Progress
                        </span>
                        <span className='font-semibold text-slate-900 dark:text-slate-100'>
                          {Math.round(continueCourse.userEnrollment?.progress || 0)}%
                        </span>
                      </div>
                      <div className='mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800'>
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            getProgressTone(
                              Math.round(
                                continueCourse.userEnrollment?.progress || 0,
                              ),
                            ).bar
                          }`}
                          style={{
                            width: `${Math.round(
                              continueCourse.userEnrollment?.progress || 0,
                            )}%`,
                          }}
                        />
                      </div>
                      <Link
                        to={`/courses/${continueCourse.id}`}
                        className='mt-4 inline-flex items-center gap-2 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                      >
                        <Play className='h-4 w-4' />
                        <span>Continue</span>
                      </Link>
                    </div>
                  ) : (
                    <div className='mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900'>
                      <p className='text-sm leading-6 text-slate-600 dark:text-slate-400'>
                        You have not started a course yet. Explore the library or jump into the portal for practice.
                      </p>
                      <Link
                        to='/courses'
                        className='mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                      >
                        <BookOpen className='h-4 w-4' />
                        <span>Browse Courses</span>
                      </Link>
                    </div>
                  )}

                 
                </div>
              </div>
            </div>
          </div>

          <div className={`${panelClass} p-5`}>
            <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
              Quick Actions
            </h2>
            <div className='mt-4 grid gap-3'>
              <Link
                to='/portal'
                className='inline-flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
              >
                <span className='inline-flex items-center gap-2'>
                  <Target className='h-4 w-4' />
                  Practice Portal
                </span>
                <ArrowRight className='h-4 w-4' />
              </Link>
              <Link
                to='/courses'
                className='inline-flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              >
                <span className='inline-flex items-center gap-2'>
                  <BookOpen className='h-4 w-4' />
                  Browse Courses
                </span>
                <ArrowRight className='h-4 w-4' />
              </Link>
              <Link
                to='/payment/history'
                className='inline-flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              >
                <span className='inline-flex items-center gap-2'>
                  <CreditCard className='h-4 w-4' />
                  Payment History
                </span>
                <ArrowRight className='h-4 w-4' />
              </Link>
            </div>
          </div>
        </div>

        <div className='mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`${panelClass} p-5`}>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <p className='text-sm font-medium text-slate-500 dark:text-slate-400'>{stat.label}</p>
                    <p className='mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100'>{stat.value}</p>
                  </div>
                  <div className='rounded-xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200'>
                    <Icon className='h-5 w-5' />
                  </div>
                </div>
                <p className='mt-4 text-sm text-slate-500 dark:text-slate-400'>{stat.meta}</p>
              </div>
            );
          })}
        </div>

        <div className='grid gap-6 xl:grid-cols-[1.55fr_0.95fr]'>
          <div className='space-y-6'>
            <div className={`${panelClass} p-6`}>
              <div className='mb-5 flex items-center justify-between gap-4'>
                <div>
                  <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                    My Courses
                  </h2>
                  <p className='mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100'>
                    Continue where you left off
                  </p>
                </div>
                <Link
                  to='/courses'
                  className='text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
                >
                  View all
                </Link>
              </div>

              {isLoading ? (
                <div className='space-y-4'>
                  {[...Array(2)].map((_, index) => (
                    <div key={index} className='animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950'>
                      <div className='flex gap-4'>
                        <div className='h-20 w-20 rounded-xl bg-slate-200 dark:bg-slate-800' />
                        <div className='flex-1'>
                          <div className='h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800' />
                          <div className='mt-3 h-3 w-full rounded bg-slate-200 dark:bg-slate-800' />
                          <div className='mt-4 h-2 w-full rounded bg-slate-200 dark:bg-slate-800' />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : enrolledCourses.length > 0 ? (
                <div className='space-y-4'>
                  {enrolledCourses.map((course) => {
                    const progress = Math.round(course.userEnrollment?.progress || 0);
                    const progressTone = getProgressTone(progress);

                    return (
                      <div key={course.id} className='rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950'>
                        <div className='flex flex-col gap-5 sm:flex-row'>
                          <div className='flex-shrink-0'>
                            <CourseImage
                              src={course.imageUrl}
                              alt={course.title}
                              className='h-24 w-24'
                              showLoadingSpinner={true}
                            />
                          </div>
                          <div className='min-w-0 flex-1'>
                            <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                              <div className='min-w-0'>
                                <h3 className='line-clamp-1 text-xl font-semibold text-slate-900 dark:text-slate-100'>
                                  {course.title}
                                </h3>
                                <p className='mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-400'>
                                  {course.description}
                                </p>
                              </div>
                              <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ${progressTone.badge}`}>
                                {course.userEnrollment?.completed ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started'}
                              </span>
                            </div>

                            <div className='mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400'>
                              <span className='inline-flex items-center gap-1'>
                                <Video className='h-4 w-4' />
                                {course.sectionCount} sections
                              </span>
                              <span className='inline-flex items-center gap-1'>
                                <Star className='h-4 w-4 fill-current text-amber-400' />
                                {course.rating}
                              </span>
                              <span className='inline-flex items-center gap-1'>
                                <Clock className='h-4 w-4' />
                                Enrolled {new Date(course.userEnrollment?.enrolledAt || '').toLocaleDateString()}
                              </span>
                            </div>

                            <div className='mt-5'>
                              <div className='mb-2 flex items-center justify-between gap-3'>
                                <span className='text-sm font-medium text-slate-700 dark:text-slate-300'>Progress</span>
                                <span className='text-sm font-semibold text-slate-900 dark:text-slate-100'>{progress}%</span>
                              </div>
                              <div className='h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800'>
                                <div className={`h-full rounded-full transition-all duration-500 ${progressTone.bar}`} style={{ width: `${progress}%` }} />
                              </div>
                            </div>

                            <div className='mt-5 flex flex-wrap items-center gap-3'>
                              <Link
                                to={`/courses/${course.id}`}
                                className='inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                              >
                                <Play className='h-4 w-4' />
                                <span>Continue Learning</span>
                              </Link>
                              <Link
                                to={`/courses/${course.id}`}
                                className='inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                              >
                                <BookOpen className='h-4 w-4' />
                                <span>View Details</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className='rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-slate-950'>
                  <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'>
                    <BookOpen className='h-8 w-8' />
                  </div>
                  <h3 className='text-xl font-semibold text-slate-900 dark:text-slate-100'>
                    Start your learning journey
                  </h3>
                  <p className='mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400'>
                    You have not enrolled in any courses yet. Explore the course library or jump into the portal for practice.
                  </p>
                  <div className='mt-6 flex flex-col justify-center gap-3 sm:flex-row'>
                    <Link
                      to='/courses'
                      className='inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                    >
                      <BookOpen className='h-4 w-4' />
                      <span>Browse Courses</span>
                    </Link>
                    <Link
                      to='/portal'
                      className='inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                    >
                      <Target className='h-4 w-4' />
                      <span>Open Portal</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className={`${panelClass} p-6`}>
              <div className='mb-5'>
                <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                  Recent Activity
                </h2>
                <p className='mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100'>
                  Your latest learning updates
                </p>
              </div>
              <div className='space-y-3'>
                {activityFeed.map((activity) => {
                  const IconComponent = activity.icon || CheckCircle;
                  const tone = activity.isCompleted || activity.color === 'green'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : activity.color === 'blue'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

                  return (
                    <div key={activity.id} className='flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950'>
                      <div className={`rounded-xl p-3 ${tone}`}>
                        <IconComponent className='h-4 w-4' />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='text-sm font-medium text-slate-900 dark:text-slate-100'>
                          {activity.title ||
                            (activity.isCompleted ? 'Completed' : 'Accessed') + ` "${activity.lessonTitle}"`}
                        </p>
                        <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
                          {activity.courseTitle || activity.sectionTitle}
                        </p>
                        <p className='mt-2 text-xs text-slate-400 dark:text-slate-500'>
                          {activity.timestamp
                            ? formatTimeAgo(activity.timestamp)
                            : new Date(activity.lastAccessedAt || activity.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className='space-y-6'>
            <div className={`${panelClass} p-5`}>
              <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                Learning Snapshot
              </h2>
              <div className='mt-4 space-y-3'>
                <div className='rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950'>
                  <div className='flex items-center justify-between gap-4'>
                    <span className='text-sm text-slate-500 dark:text-slate-400'>Completed courses</span>
                    <span className='text-base font-semibold text-slate-900 dark:text-slate-100'>
                      {progressOverview ? progressOverview.statistics.completedCourses : completedCourses}
                    </span>
                  </div>
                </div>
                <div className='rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950'>
                  <div className='flex items-center justify-between gap-4'>
                    <span className='text-sm text-slate-500 dark:text-slate-400'>Average progress</span>
                    <span className='text-base font-semibold text-slate-900 dark:text-slate-100'>
                      {progressOverview ? Math.round(progressOverview.statistics.averageProgress) : averageProgress}%
                    </span>
                  </div>
                </div>
                <div className='rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950'>
                  <div className='flex items-center justify-between gap-4'>
                    <span className='text-sm text-slate-500 dark:text-slate-400'>Time spent</span>
                    <span className='text-base font-semibold text-slate-900 dark:text-slate-100'>
                      {progressOverview ? `${progressOverview.statistics.totalTimeSpent}m` : 'Tracked in portal'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${panelClass} p-5`}>
              <div className='mb-4 flex items-center justify-between'>
                <div>
                  <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                    Recommended
                  </h2>
                  <p className='mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100'>
                    Courses to explore next
                  </p>
                </div>
              </div>
              {isLoading ? (
                <div className='space-y-3'>
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className='animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950'>
                      <div className='flex gap-3'>
                        <div className='h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-800' />
                        <div className='flex-1'>
                          <div className='h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800' />
                          <div className='mt-2 h-2 w-full rounded bg-slate-200 dark:bg-slate-800' />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='space-y-3'>
                  {recommendedCourses.map((course) => (
                    <div key={course.id} className='rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950'>
                      <div className='flex items-start gap-3'>
                        <CourseImage
                          src={course.imageUrl}
                          alt={course.title}
                          className='h-14 w-14'
                          showLoadingSpinner={false}
                          fallbackUrl='https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=100'
                        />
                        <div className='min-w-0 flex-1'>
                          <h4 className='line-clamp-1 text-sm font-semibold text-slate-900 dark:text-slate-100'>
                            {course.title}
                          </h4>
                          <p className='mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400'>
                            {course.description}
                          </p>
                          <div className='mt-3 flex items-center justify-between gap-3'>
                            <div className='flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400'>
                              <span className='font-semibold text-slate-900 dark:text-slate-100'>
                                {course.isFree ? 'Free' : `$${course.price}`}
                              </span>
                              <span className='inline-flex items-center gap-1'>
                                <Star className='h-3 w-3 fill-current text-amber-400' />
                                {course.rating}
                              </span>
                            </div>
                            <Link
                              to={`/courses/${course.id}`}
                              className='inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
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
                className='mt-4 inline-flex text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
              >
                View all courses
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
