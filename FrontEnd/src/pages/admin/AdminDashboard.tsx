import {
  BookOpen,
  Calendar,
  DollarSign,
  Edit,
  Eye,
  Filter,
  Plus,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
          err.response?.data?.message || 'Failed to load dashboard data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-red-600 mb-4'>Error</h1>
          <p className='text-gray-600'>{error}</p>
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
            <div>
              <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                Admin Dashboard
              </h1>
              <p className='text-gray-600 dark:text-gray-300 mt-1'>
                Manage courses, users, and monitor platform performance
              </p>
            </div>
            <Link
              to='/admin/courses/create'
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2'
            >
              <Plus className='h-4 w-4' />
              <span>Create Course</span>
            </Link>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 py-8'>
        {/* Stats Overview */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Total Courses
                </p>
                <p className='text-3xl font-bold text-gray-900 dark:text-white'>
                  {stats?.overview.totalCourses || 0}
                </p>
              </div>
              <div className='bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full'>
                <BookOpen className='h-6 w-6 text-blue-600 dark:text-blue-400' />
              </div>
            </div>
            <div className='mt-4 flex items-center text-sm'>
              <span className='text-green-600 dark:text-green-400'>
                {stats?.overview.freeCourses || 0} free
              </span>
              <span className='text-gray-400 mx-2'>•</span>
              <span className='text-blue-600 dark:text-blue-400'>
                {stats?.overview.paidCourses || 0} paid
              </span>
            </div>
          </div>

          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Total Users
                </p>
                <p className='text-3xl font-bold text-gray-900 dark:text-white'>
                  {totalUsers}
                </p>
              </div>
              <div className='bg-green-100 dark:bg-green-900/30 p-3 rounded-full'>
                <Users className='h-6 w-6 text-green-600 dark:text-green-400' />
              </div>
            </div>
          </div>

          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Total Enrollments
                </p>
                <p className='text-3xl font-bold text-gray-900 dark:text-white'>
                  {stats?.overview.totalEnrollments || 0}
                </p>
              </div>
              <div className='bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full'>
                <TrendingUp className='h-6 w-6 text-purple-600 dark:text-purple-400' />
              </div>
            </div>
            <div className='mt-4 text-sm text-gray-600 dark:text-gray-400'>
              {stats?.overview.completionRate || 0}% completion rate
            </div>
          </div>

          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Potential Revenue
                </p>
                <p className='text-3xl font-bold text-gray-900 dark:text-white'>
                  ${stats?.revenue.totalPotentialRevenue || 0}
                </p>
              </div>
              <div className='bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full'>
                <DollarSign className='h-6 w-6 text-orange-600 dark:text-orange-400' />
              </div>
            </div>
            <div className='mt-4 text-sm text-gray-600 dark:text-gray-400'>
              Avg: ${stats?.revenue.averageCoursePrice || 0}
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Top Performing Courses */}
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
                Top Performing Courses
              </h2>
              <Link
                to='/admin/courses'
                className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium'
              >
                View All
              </Link>
            </div>
            <div className='space-y-4'>
              {stats?.topPerformingCourses.map((course, index) => (
                <div
                  key={course.id}
                  className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg'
                >
                  <div className='flex items-center space-x-3'>
                    <div className='bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold'>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className='font-medium text-gray-900 dark:text-white'>
                        {course.title}
                      </h3>
                      <div className='flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400'>
                        <span>{course.enrollments} enrollments</span>
                        <span>•</span>
                        <div className='flex items-center space-x-1'>
                          <Star className='h-3 w-3 fill-current text-yellow-400' />
                          <span>{course.averageRating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='font-semibold text-gray-900 dark:text-white'>
                      {course.isFree ? 'Free' : `$${course.price}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Courses */}
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
                Recent Courses
              </h2>
              <Link
                to='/admin/courses'
                className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium'
              >
                View All
              </Link>
            </div>
            <div className='space-y-4'>
              {recentCourses.map((course) => (
                <div
                  key={course.id}
                  className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg'
                >
                  <div>
                    <h3 className='font-medium text-gray-900 dark:text-white'>
                      {course.title}
                    </h3>
                    <div className='flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400'>
                      <Calendar className='h-3 w-3' />
                      <span>
                        {new Date(course.createdAt).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>{course.isFree ? 'Free' : `$${course.price}`}</span>
                    </div>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Link
                      to={`/admin/courses/${course.id}`}
                      className='p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                    >
                      <Eye className='h-4 w-4' />
                    </Link>
                    <Link
                      to={`/admin/courses/${course.id}/edit`}
                      className='p-2 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400'
                    >
                      <Edit className='h-4 w-4' />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='mt-8 grid grid-cols-1 md:grid-cols-3 gap-6'>
          <Link
            to='/admin/courses'
            className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200'
          >
            <div className='flex items-center space-x-4'>
              <div className='bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full'>
                <BookOpen className='h-6 w-6 text-blue-600 dark:text-blue-400' />
              </div>
              <div>
                <h3 className='font-semibold text-gray-900 dark:text-white'>
                  Manage Courses
                </h3>
                <p className='text-sm text-gray-600 dark:text-gray-300'>
                  Create, edit, and delete courses
                </p>
              </div>
            </div>
          </Link>

          <Link
            to='/admin/users'
            className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200'
          >
            <div className='flex items-center space-x-4'>
              <div className='bg-green-100 dark:bg-green-900/30 p-3 rounded-full'>
                <Users className='h-6 w-6 text-green-600 dark:text-green-400' />
              </div>
              <div>
                <h3 className='font-semibold text-gray-900 dark:text-white'>
                  Manage Users
                </h3>
                <p className='text-sm text-gray-600 dark:text-gray-300'>
                  View and manage user accounts
                </p>
              </div>
            </div>
          </Link>

          <Link
            to='/admin/categories'
            className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200'
          >
            <div className='flex items-center space-x-4'>
              <div className='bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full'>
                <Filter className='h-6 w-6 text-purple-600 dark:text-purple-400' />
              </div>
              <div>
                <h3 className='font-semibold text-gray-900 dark:text-white'>
                  Manage Categories
                </h3>
                <p className='text-sm text-gray-600 dark:text-gray-300'>
                  Organize course categories
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
