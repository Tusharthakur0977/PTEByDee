import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Plus,
  Search,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  bulkDeleteCourses,
  deleteCourse,
  getAllCourses,
  getCategories,
} from '../../services/admin';

interface Course {
  id: string;
  title: string;
  description: string;
  isFree: boolean;
  price?: number;
  currency?: string;
  averageRating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
  userCourses: any[];
  reviews: any[];
  sections: any[];
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCourses: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    isFree: '',
    categoryId: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, [filters]);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);

      // Transform filters to match CourseFilters interface
      const transformedFilters = {
        ...filters,
        isFree: filters.isFree === '' ? undefined : filters.isFree === 'true',
        categoryId: filters.categoryId === '' ? undefined : filters.categoryId,
      };

      const response = await getAllCourses(transformedFilters);
      if (response.success) {
        setCourses(response.data.courses);
        setPagination(response.data.pagination);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch courses');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const response = await deleteCourse(courseId);
      if (response.success) {
        setCourses(courses.filter((course) => course.id !== courseId));
        setShowDeleteModal(false);
        setCourseToDelete(null);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete course');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCourses.length === 0) return;

    try {
      const response = await bulkDeleteCourses(selectedCourses);
      if (response.success) {
        setCourses(
          courses.filter((course) => !selectedCourses.includes(course.id))
        );
        setSelectedCourses([]);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete courses');
    }
  };

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCourses.length === courses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(courses.map((course) => course.id));
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value, // Reset to page 1 when changing filters
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-red-600 mb-4'>Error</h1>
          <p className='text-gray-600'>{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchCourses();
            }}
            className='mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg'
          >
            Retry
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
            <div>
              <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                Course Management
              </h1>
              <p className='text-gray-600 dark:text-gray-300 mt-1'>
                Create, edit, and manage all courses
              </p>
            </div>
            <div className='flex items-center space-x-3'>
              {selectedCourses.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2'
                >
                  <Trash2 className='h-4 w-4' />
                  <span>Delete Selected ({selectedCourses.length})</span>
                </button>
              )}
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
      </div>

      <div className='container mx-auto px-4 py-8'>
        {/* Filters */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
            <div className='md:col-span-2'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
                <input
                  type='text'
                  placeholder='Search courses...'
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                />
              </div>
            </div>

            <div>
              <select
                value={filters.isFree}
                onChange={(e) => handleFilterChange('isFree', e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              >
                <option value=''>All Types</option>
                <option value='true'>Free</option>
                <option value='false'>Paid</option>
              </select>
            </div>

            <div>
              <select
                value={filters.categoryId}
                onChange={(e) =>
                  handleFilterChange('categoryId', e.target.value)
                }
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              >
                <option value=''>All Categories</option>
                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              >
                <option value='createdAt-desc'>Newest First</option>
                <option value='createdAt-asc'>Oldest First</option>
                <option value='title-asc'>Title A-Z</option>
                <option value='title-desc'>Title Z-A</option>
                <option value='price-desc'>Price High-Low</option>
                <option value='price-asc'>Price Low-High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Course Table */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden'>
          <div className='p-6 border-b dark:border-gray-700'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
                Courses ({pagination?.totalCourses || 0})
              </h2>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  checked={
                    selectedCourses.length === courses.length &&
                    courses.length > 0
                  }
                  onChange={handleSelectAll}
                  className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <label className='text-sm text-gray-600 dark:text-gray-300'>
                  Select All
                </label>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className='p-8 text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
              <p className='text-gray-600 dark:text-gray-300 mt-2'>
                Loading courses...
              </p>
            </div>
          ) : courses.length === 0 ? (
            <div className='p-8 text-center'>
              <BookOpen className='h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                No courses found
              </h3>
              <p className='text-gray-600 dark:text-gray-300 mb-4'>
                Get started by creating your first course
              </p>
              <Link
                to='/admin/courses/create'
                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200'
              >
                Create Course
              </Link>
            </div>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-gray-50 dark:bg-gray-700'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        <input
                          type='checkbox'
                          checked={selectedCourses.length === courses.length}
                          onChange={handleSelectAll}
                          className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                        />
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Course
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Type
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Price
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Enrollments
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Rating
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Created
                      </th>
                      <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                    {courses.map((course) => (
                      <tr
                        key={course.id}
                        className='hover:bg-gray-50 dark:hover:bg-gray-700'
                      >
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <input
                            type='checkbox'
                            checked={selectedCourses.includes(course.id)}
                            onChange={() => handleSelectCourse(course.id)}
                            className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                          />
                        </td>
                        <td className='px-6 py-4'>
                          <div>
                            <div className='text-sm font-medium text-gray-900 dark:text-white'>
                              {course.title}
                            </div>
                            <div className='text-sm text-gray-500 dark:text-gray-400 line-clamp-2'>
                              {course.description}
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              course.isFree
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                            }`}
                          >
                            {course.isFree ? 'Free' : 'Paid'}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                          {course.isFree ? 'Free' : `$${course.price}`}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='flex items-center space-x-1 text-sm text-gray-900 dark:text-white'>
                            <Users className='h-4 w-4' />
                            <span>{course.userCourses?.length || 0}</span>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='flex items-center space-x-1'>
                            <Star className='h-4 w-4 fill-current text-yellow-400' />
                            <span className='text-sm text-gray-900 dark:text-white'>
                              {course.averageRating || 0}
                            </span>
                            <span className='text-xs text-gray-500 dark:text-gray-400'>
                              ({course.reviewCount || 0})
                            </span>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                          {new Date(course.createdAt).toLocaleDateString()}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                          <div className='flex items-center justify-end space-x-2'>
                            <Link
                              to={`/admin/courses/${course.id}`}
                              className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
                            >
                              <Eye className='h-4 w-4' />
                            </Link>
                            <Link
                              to={`/admin/courses/${course.id}/edit`}
                              className='text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300'
                            >
                              <Edit className='h-4 w-4' />
                            </Link>
                            <button
                              onClick={() => {
                                setCourseToDelete(course.id);
                                setShowDeleteModal(true);
                              }}
                              className='text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300'
                            >
                              <Trash2 className='h-4 w-4' />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className='px-6 py-4 border-t dark:border-gray-700'>
                  <div className='flex items-center justify-between'>
                    <div className='text-sm text-gray-700 dark:text-gray-300'>
                      Showing{' '}
                      {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
                      {Math.min(
                        pagination.currentPage * pagination.limit,
                        pagination.totalCourses
                      )}{' '}
                      of {pagination.totalCourses} results
                    </div>
                    <div className='flex items-center space-x-2'>
                      <button
                        onClick={() =>
                          handlePageChange(pagination.currentPage - 1)
                        }
                        disabled={!pagination.hasPrevPage}
                        className='p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700'
                      >
                        <ChevronLeft className='h-4 w-4' />
                      </button>

                      {Array.from(
                        { length: Math.min(5, pagination.totalPages) },
                        (_, i) => {
                          const page = i + 1;
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-2 rounded-lg ${
                                pagination.currentPage === page
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        }
                      )}

                      <button
                        onClick={() =>
                          handlePageChange(pagination.currentPage + 1)
                        }
                        disabled={!pagination.hasNextPage}
                        className='p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700'
                      >
                        <ChevronRight className='h-4 w-4' />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
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
              Are you sure you want to delete this course? This action cannot be
              undone.
            </p>
            <div className='flex items-center justify-end space-x-3'>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCourseToDelete(null);
                }}
                className='px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  courseToDelete && handleDeleteCourse(courseToDelete)
                }
                className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200'
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
