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

const panelClass =
  'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';
const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-800';
const iconButtonClass =
  'rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100';

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

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
      setError(null);
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
        setCourses((current) => current.filter((course) => course.id !== courseId));
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
        setCourses((current) => current.filter((course) => !selectedCourses.includes(course.id)));
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
        : [...prev, courseId],
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
      page: key !== 'page' ? 1 : value,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  if (error && !courses.length) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-50 px-4 dark:bg-slate-950'>
        <div className='rounded-2xl border border-red-200 bg-white px-6 py-5 text-center shadow-sm dark:border-red-900/40 dark:bg-slate-900'>
          <h1 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Courses unavailable</h1>
          <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchCourses();
            }}
            className='mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        <div className={`${panelClass} overflow-hidden`}>
          <div className='border-b border-slate-200 p-5 dark:border-slate-800'>
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
                <div>
                  <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>Courses</h2>
                  <p className='mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100'>{pagination?.totalCourses || 0} records</p>
                </div>
                <div className='flex flex-wrap items-center gap-3'>
                  <label className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'>
                    <input
                      type='checkbox'
                      checked={selectedCourses.length === courses.length && courses.length > 0}
                      onChange={handleSelectAll}
                      className='h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-700'
                    />
                    <span>Select all</span>
                  </label>
                  {selectedCourses.length > 0 && (
                    <button onClick={handleBulkDelete} className='inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700'>
                      <Trash2 className='h-4 w-4' />
                      <span>Delete selected ({selectedCourses.length})</span>
                    </button>
                  )}
                  <Link to='/admin/courses/create' className='inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'>
                    <Plus className='h-4 w-4' />
                    <span>Create course</span>
                  </Link>
                </div>
              </div>

              <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5'>
                <div className='md:col-span-2'>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400' />
                    <input type='text' placeholder='Search courses...' value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} className={`${inputClass} pl-10 pr-4`} />
                  </div>
                </div>
                <div>
                  <select value={filters.isFree} onChange={(e) => handleFilterChange('isFree', e.target.value)} className={inputClass}>
                    <option value=''>All Types</option>
                    <option value='true'>Free</option>
                    <option value='false'>Paid</option>
                  </select>
                </div>
                <div>
                  <select value={filters.categoryId} onChange={(e) => handleFilterChange('categoryId', e.target.value)} className={inputClass}>
                    <option value=''>All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
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
                    className={inputClass}
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
          </div>

          {error && (
            <div className='border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300'>
              {error}
            </div>
          )}

          {isLoading ? (
            <div className='p-10 text-center'>
              <div className='mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100' />
              <p className='mt-3 text-sm text-slate-500 dark:text-slate-400'>Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className='p-10 text-center'>
              <BookOpen className='mx-auto mb-4 h-14 w-14 text-slate-300 dark:text-slate-700' />
              <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>No courses found</h3>
              <p className='mt-2 text-sm text-slate-500 dark:text-slate-400'>Get started by creating your first course.</p>
              <Link to='/admin/courses/create' className='mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'>Create course</Link>
            </div>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <table className='min-w-full'>
                  <thead className='bg-slate-50 dark:bg-slate-950'>
                    <tr>
                      <th className='px-6 py-3 text-left'>
                        <input type='checkbox' checked={selectedCourses.length === courses.length} onChange={handleSelectAll} className='h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-700' />
                      </th>
                      {['Course', 'Type', 'Price', 'Enrollments', 'Rating', 'Created'].map((label) => (
                        <th key={label} className='px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                          {label}
                        </th>
                      ))}
                      <th className='px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900'>
                    {courses.map((course) => (
                      <tr key={course.id} className='transition-colors hover:bg-slate-50 dark:hover:bg-slate-950'>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <input type='checkbox' checked={selectedCourses.includes(course.id)} onChange={() => handleSelectCourse(course.id)} className='h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-700' />
                        </td>
                        <td className='px-6 py-4'>
                          <div>
                            <div className='text-sm font-medium text-slate-900 dark:text-slate-100'>{course.title}</div>
                            <div className='mt-1 max-w-md line-clamp-2 text-sm text-slate-500 dark:text-slate-400'>{course.description}</div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${course.isFree ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20' : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700'}`}>
                            {course.isFree ? 'Free' : 'Paid'}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100'>{course.isFree ? 'Free' : `$${course.price}`}</td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300'>
                            <Users className='h-4 w-4' />
                            <span>{course.userCourses?.length || 0}</span>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300'>
                            <Star className='h-4 w-4 fill-current text-amber-400' />
                            <span className='font-medium text-slate-900 dark:text-slate-100'>{course.averageRating || 0}</span>
                            <span className='text-xs text-slate-500 dark:text-slate-400'>({course.reviewCount || 0})</span>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400'>{new Date(course.createdAt).toLocaleDateString()}</td>
                        <td className='px-6 py-4 whitespace-nowrap text-right'>
                          <div className='flex items-center justify-end gap-1'>
                            <Link to={`/admin/courses/${course.id}`} className={iconButtonClass}><Eye className='h-4 w-4' /></Link>
                            <Link to={`/admin/courses/${course.id}/edit`} className={iconButtonClass}><Edit className='h-4 w-4' /></Link>
                            <button
                              onClick={() => {
                                setCourseToDelete(course.id);
                                setShowDeleteModal(true);
                              }}
                              className={`${iconButtonClass} hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-300`}
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

              {pagination && pagination.totalPages > 1 && (
                <div className='border-t border-slate-200 px-6 py-4 dark:border-slate-800'>
                  <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
                    <div className='text-sm text-slate-500 dark:text-slate-400'>
                      Showing {(pagination.currentPage - 1) * pagination.limit + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCourses)} of {pagination.totalCourses} results
                    </div>
                    <div className='flex items-center gap-2'>
                      <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={!pagination.hasPrevPage} className='rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'>
                        <ChevronLeft className='h-4 w-4' />
                      </button>
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const page = i + 1;
                        const isActive = pagination.currentPage === page;
                        return (
                          <button key={page} onClick={() => handlePageChange(page)} className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
                            {page}
                          </button>
                        );
                      })}
                      <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={!pagination.hasNextPage} className='rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'>
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

      {showDeleteModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm'>
          <div className='w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900'>
            <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Delete course</h3>
            <p className='mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400'>This will permanently remove the selected course.</p>
            <div className='mt-6 flex items-center justify-end gap-3'>
              <button onClick={() => { setShowDeleteModal(false); setCourseToDelete(null); }} className='rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'>Cancel</button>
              <button onClick={() => courseToDelete && handleDeleteCourse(courseToDelete)} className='rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700'>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
