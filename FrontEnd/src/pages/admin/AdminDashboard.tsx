import {
  BookOpen,
  Calendar,
  DollarSign,
  Edit,
  Eye,
  Filter,
  LifeBuoy,
  MessageCircleQuestionIcon,
  Plus,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StripeProductStatus from '../../components/StripeProductStatus';
import {
  getAllCourses,
  getAllUsers,
  getCourseStats,
} from '../../services/admin';

interface CourseStats {
  overview: {
    totalCourses: number;
    freeCourses: number;
    paidCourses: number;
    totalEnrollments: number;
    completedEnrollments: number;
    completionRate: number;
    totalReviews: number;
    averageRating: number;
  };
  revenue: {
    totalPotentialRevenue: number;
    averageCoursePrice: number;
    lowestPrice: number;
    highestPrice: number;
  };
  topPerformingCourses: Array<{
    id: string;
    title: string;
    enrollments: number;
    averageRating: number;
    reviewCount: number;
    price: number;
    isFree: boolean;
  }>;
}

const panelClass =
  'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [statsData, coursesData, usersData] = await Promise.all([
          getCourseStats(),
          getAllCourses({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
          getAllUsers(),
        ]);

        if (statsData.success) {
          setStats(statsData.data);
        }

        if (coursesData.success) {
          setRecentCourses(coursesData.data.courses);
        }

        if (usersData.success) {
          setTotalUsers(usersData.data.length);
        }
      } catch (err: any) {
        setError(
          err.response?.data?.message || 'Failed to load dashboard data',
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value || 0);

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950'>
        <div className='h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4'>
        <div className='rounded-2xl border border-red-200 bg-white px-6 py-5 text-center shadow-sm dark:border-red-900/40 dark:bg-slate-900'>
          <h1 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
            Dashboard unavailable
          </h1>
          <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>
            {error}
          </p>
        </div>
      </div>
    );
  }

  const quickLinks = [
    {
      to: '/admin/courses',
      label: 'Courses',
      value: 'Manage',
      icon: BookOpen,
    },
    {
      to: '/admin/users',
      label: 'Users',
      value: 'Manage',
      icon: Users,
    },
    {
      to: '/admin/questions',
      label: 'Questions',
      value: 'Manage',
      icon: MessageCircleQuestionIcon,
    },
    {
      to: '/admin/support-tickets',
      label: 'Support',
      value: 'Manage',
      icon: LifeBuoy,
    },
    {
      to: '/admin/payments',
      label: 'Payments',
      value: 'Manage',
      icon: DollarSign,
    },
  ];

  const summaryCards = [
    {
      label: 'Courses',
      value: stats?.overview.totalCourses || 0,
      meta: `${stats?.overview.freeCourses || 0} free / ${
        stats?.overview.paidCourses || 0
      } paid`,
      icon: BookOpen,
    },
    {
      label: 'Users',
      value: totalUsers,
      meta: `${stats?.overview.totalEnrollments || 0} enrollments`,
      icon: Users,
    },
    {
      label: 'Revenue',
      value: formatCurrency(stats?.revenue.totalPotentialRevenue || 0),
      meta: `Avg ${formatCurrency(stats?.revenue.averageCoursePrice || 0)}`,
      icon: DollarSign,
    },
    {
      label: 'Completion',
      value: `${Math.round(stats?.overview.completionRate || 0)}%`,
      meta: `${stats?.overview.completedEnrollments || 0} completed`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        <div className='mb-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]'>
          <div className={`${panelClass} p-4 sm:p-5`}>
            <div className='flex flex-wrap items-center gap-3'>
              <Link
                to='/admin/courses/create'
                className='inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
              >
                <Plus className='h-4 w-4' />
                <span>Create Course</span>
              </Link>
              <Link
                to='/admin/questions'
                className='inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
              >
                <MessageCircleQuestionIcon className='h-4 w-4' />
                <span>Questions</span>
              </Link>
              <Link
                to='/admin/support-tickets'
                className='inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
              >
                <LifeBuoy className='h-4 w-4' />
                <span>Support Queue</span>
              </Link>
              <Link
                to='/admin/payments'
                className='inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
              >
                <DollarSign className='h-4 w-4' />
                <span>Payments</span>
              </Link>
            </div>
          </div>

          <div className={`${panelClass} p-4 sm:p-5`}>
            <div className='grid grid-cols-3 gap-3'>
              <div className='rounded-xl bg-slate-100 px-3 py-3 dark:bg-slate-800'>
                <p className='text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                  Rating
                </p>
                <p className='mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100'>
                  {(stats?.overview.averageRating || 0).toFixed(1)}
                </p>
              </div>
              <div className='rounded-xl bg-slate-100 px-3 py-3 dark:bg-slate-800'>
                <p className='text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                  Reviews
                </p>
                <p className='mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100'>
                  {stats?.overview.totalReviews || 0}
                </p>
              </div>
              <div className='rounded-xl bg-slate-100 px-3 py-3 dark:bg-slate-800'>
                <p className='text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                  Price Range
                </p>
                <p className='mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100'>
                  {formatCurrency(stats?.revenue.lowestPrice || 0)} -{' '}
                  {formatCurrency(stats?.revenue.highestPrice || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className={`${panelClass} p-5`}
              >
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <p className='text-sm font-medium text-slate-500 dark:text-slate-400'>
                      {card.label}
                    </p>
                    <p className='mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100'>
                      {card.value}
                    </p>
                  </div>
                  <div className='rounded-xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200'>
                    <Icon className='h-5 w-5' />
                  </div>
                </div>
                <p className='mt-4 text-sm text-slate-500 dark:text-slate-400'>
                  {card.meta}
                </p>
              </div>
            );
          })}
        </div>

        <div className='mb-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
          <div className={`${panelClass} p-5`}>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                Workspace
              </h2>
            </div>
            <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className='group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700 dark:hover:bg-slate-900'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='rounded-xl bg-white p-3 text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200'>
                        <Icon className='h-5 w-5' />
                      </div>
                      <span className='text-sm font-medium text-slate-400 transition-colors group-hover:text-slate-600 dark:group-hover:text-slate-300'>
                        {link.value}
                      </span>
                    </div>
                    <div className='mt-4 text-sm font-medium text-slate-900 dark:text-slate-100'>
                      {link.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className='space-y-6'>
            <div className={`${panelClass} p-5`}>
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                  Revenue Snapshot
                </h2>
              </div>
              <div className='space-y-3'>
                <div className='rounded-xl bg-slate-100 px-4 py-3 dark:bg-slate-800'>
                  <div className='flex items-center justify-between gap-4'>
                    <span className='text-sm text-slate-500 dark:text-slate-400'>
                      Potential revenue
                    </span>
                    <span className='text-base font-semibold text-slate-900 dark:text-slate-100'>
                      {formatCurrency(
                        stats?.revenue.totalPotentialRevenue || 0,
                      )}
                    </span>
                  </div>
                </div>
                <div className='rounded-xl bg-slate-100 px-4 py-3 dark:bg-slate-800'>
                  <div className='flex items-center justify-between gap-4'>
                    <span className='text-sm text-slate-500 dark:text-slate-400'>
                      Average course price
                    </span>
                    <span className='text-base font-semibold text-slate-900 dark:text-slate-100'>
                      {formatCurrency(stats?.revenue.averageCoursePrice || 0)}
                    </span>
                  </div>
                </div>
                <div className='rounded-xl bg-slate-100 px-4 py-3 dark:bg-slate-800'>
                  <div className='flex items-center justify-between gap-4'>
                    <span className='text-sm text-slate-500 dark:text-slate-400'>
                      Enrollment completion
                    </span>
                    <span className='text-base font-semibold text-slate-900 dark:text-slate-100'>
                      {Math.round(stats?.overview.completionRate || 0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <StripeProductStatus className='rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900' />
          </div>
        </div>

        <div className='grid gap-6 xl:grid-cols-2'>
          <div className={`${panelClass} p-5`}>
            <div className='mb-5 flex items-center justify-between'>
              <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                Top Courses
              </h2>
              <Link
                to='/admin/courses'
                className='text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
              >
                View all
              </Link>
            </div>
            <div className='space-y-3'>
              {stats?.topPerformingCourses.map((course, index) => (
                <div
                  key={course.id}
                  className='flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950'
                >
                  <div className='flex items-center gap-4'>
                    <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900'>
                      {index + 1}
                    </div>
                    <div>
                      <p className='font-medium text-slate-900 dark:text-slate-100'>
                        {course.title}
                      </p>
                      <div className='mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400'>
                        <span>{course.enrollments} enrollments</span>
                        <span className='flex items-center gap-1'>
                          <Star className='h-3.5 w-3.5 fill-current text-amber-400' />
                          {course.averageRating}
                        </span>
                        <span>{course.reviewCount} reviews</span>
                      </div>
                    </div>
                  </div>
                  <div className='text-sm font-semibold text-slate-700 dark:text-slate-200'>
                    {course.isFree ? 'Free' : formatCurrency(course.price)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`${panelClass} p-5`}>
            <div className='mb-5 flex items-center justify-between'>
              <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                Recent Courses
              </h2>
              <Link
                to='/admin/courses'
                className='text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
              >
                View all
              </Link>
            </div>
            <div className='space-y-3'>
              {recentCourses.map((course) => (
                <div
                  key={course.id}
                  className='flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950'
                >
                  <div>
                    <p className='font-medium text-slate-900 dark:text-slate-100'>
                      {course.title}
                    </p>
                    <div className='mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400'>
                      <span className='inline-flex items-center gap-1'>
                        <Calendar className='h-3.5 w-3.5' />
                        {new Date(course.createdAt).toLocaleDateString()}
                      </span>
                      <span>
                        {course.isFree ? 'Free' : formatCurrency(course.price)}
                      </span>
                    </div>
                  </div>
                  <div className='flex items-center gap-1'>
                    <Link
                      to={`/admin/courses/${course.id}`}
                      className='rounded-lg p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'
                    >
                      <Eye className='h-4 w-4' />
                    </Link>
                    <Link
                      to={`/admin/courses/${course.id}/edit`}
                      className='rounded-lg p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'
                    >
                      <Edit className='h-4 w-4' />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
