/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from 'react';
import { Search, Filter, BookOpen, Sparkles, Target } from 'lucide-react';
import CoursesPageCard from '../components/CoursesPageCard';
import { getCourses, getCategories } from '../services/courses';
import type { Course, Category, CourseFilters } from '../services/courses';
import useDebounce from '../hooks/useDebounce';

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch courses when filters change
  React.useEffect(() => {
    fetchCourses();
  }, [
    debouncedSearchTerm,
    selectedPriceRange,
    selectedCategory,
    sortBy,
    sortOrder,
  ]);

  // Fetch categories on component mount
  React.useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);

      const filters: CourseFilters = {
        search: debouncedSearchTerm,
        sortBy,
        sortOrder,
      };

      // Add category filter
      if (selectedCategory !== 'all') {
        filters.categoryId = selectedCategory;
      }

      // Add price filter
      if (selectedPriceRange !== 'all') {
        if (selectedPriceRange === 'free') {
          filters.isFree = true;
        } else if (selectedPriceRange === 'paid') {
          filters.isFree = false;
        }
      }

      const response = await getCourses(filters);
      setCourses(response.courses);
      setPagination(response.pagination);
    } catch (err: any) {
      console.error('Failed to fetch courses:', err);
      // For public course listing, show empty state instead of error
      setCourses([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      // Continue without categories if fetch fails
      setCategories([]);
    }
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-');
    setSortBy(newSortBy);
    setSortOrder(newSortOrder as 'asc' | 'desc');
  };

  // Remove error display since we're handling errors gracefully now

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <section className='relative overflow-hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_30%),radial-gradient(circle_at_78%_12%,_rgba(16,185,129,0.10),_transparent_24%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),radial-gradient(circle_at_78%_12%,_rgba(16,185,129,0.12),_transparent_24%)]' />
        <div className='container relative mx-auto px-5 py-14 sm:px-6 sm:py-18 lg:px-8'>
          <div className='grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center'>
            <div className='max-w-3xl'>
              <div className='inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-400/10 dark:text-blue-300'>
                <BookOpen className='h-4 w-4' />
                <span>PTE Course Library</span>
              </div>
              <h1 className='mt-5 max-w-2xl text-4xl font-semibold leading-[1.12] tracking-tight text-slate-900 dark:text-white sm:text-[3.35rem]'>
                Learn with clear, exam-focused course pathways
              </h1>
              <p className='mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg'>
                Browse a cleaner catalog of guided PTE courses built to help
                you study with structure, practice with purpose, and move
                toward your target score with confidence.
              </p>

              <div className='mt-8 grid gap-3 sm:grid-cols-3'>
                <div className='rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90'>
                  <div className='inline-flex rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'>
                    <Target className='h-4 w-4' />
                  </div>
                  <p className='mt-3 text-sm font-medium text-slate-900 dark:text-slate-100'>
                    Score-focused plans
                  </p>
                  <p className='mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400'>
                    Study paths shaped around exam progress.
                  </p>
                </div>
                <div className='rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90'>
                  <div className='inline-flex rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300'>
                    <Sparkles className='h-4 w-4' />
                  </div>
                  <p className='mt-3 text-sm font-medium text-slate-900 dark:text-slate-100'>
                    Guided preparation
                  </p>
                  <p className='mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400'>
                    Lessons arranged for practical learning flow.
                  </p>
                </div>
                <div className='rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90'>
                  <div className='inline-flex rounded-xl bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-300'>
                    <Filter className='h-4 w-4' />
                  </div>
                  <p className='mt-3 text-sm font-medium text-slate-900 dark:text-slate-100'>
                    Flexible access
                  </p>
                  <p className='mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400'>
                    Explore both free and premium options.
                  </p>
                </div>
              </div>
            </div>

            <div className='rounded-[30px] border border-slate-200 bg-white/90 p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900/90'>
              <div className='rounded-[24px] border border-slate-200 bg-slate-950 p-6 text-white dark:border-slate-800 dark:bg-slate-900'>
                <div className='flex items-start justify-between gap-4 border-b border-white/10 pb-5'>
                  <div>
                    <p className='text-xs uppercase tracking-[0.24em] text-slate-400'>
                      Course catalog
                    </p>
                    <h2 className='mt-2 text-2xl font-semibold'>
                      Pick a preparation path that fits your study style
                    </h2>
                  </div>
                  <div className='rounded-2xl bg-emerald-400/15 px-3 py-2 text-sm font-medium text-emerald-300'>
                    {pagination?.totalCourses || courses.length} available
                  </div>
                </div>

                <div className='mt-6 space-y-3'>
                  <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                    <div className='flex items-center justify-between text-sm text-slate-300'>
                      <span>Access models</span>
                      <span className='font-semibold text-white'>Free + Premium</span>
                    </div>
                  </div>
                  <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                    <div className='flex items-center justify-between text-sm text-slate-300'>
                      <span>Learning format</span>
                      <span className='font-semibold text-white'>Structured modules</span>
                    </div>
                  </div>
                  <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                    <div className='flex items-center justify-between text-sm text-slate-300'>
                      <span>Preparation style</span>
                      <span className='font-semibold text-white'>Exam-oriented</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className='container mx-auto px-4 py-10'>

        {/* Search and Filters */}
        <div className='mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {/* Search */}
            <div className='relative sm:col-span-2 lg:col-span-1'>
              <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400' />
              <input
                type='text'
                placeholder='Search courses...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white'
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className='w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white'
              >
                <option value='all'>All Categories</option>
                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name} ({category.courseCount})
                  </option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div>
              <select
                value={selectedPriceRange}
                onChange={(e) => setSelectedPriceRange(e.target.value)}
                className='w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white'
              >
                <option value='all'>All Prices</option>
                <option value='free'>Free</option>
                <option value='paid'>Paid</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => handleSortChange(e.target.value)}
                className='w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white'
              >
                <option value='createdAt-desc'>Newest First</option>
                <option value='createdAt-asc'>Oldest First</option>
                <option value='title-asc'>Title A-Z</option>
                <option value='title-desc'>Title Z-A</option>
                <option value='averageRating-desc'>Highest Rated</option>
                <option value='price-asc'>Price Low-High</option>
                <option value='price-desc'>Price High-Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className='mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
          <p className='text-slate-600 dark:text-slate-300'>
            {isLoading
              ? 'Loading courses...'
              : `Showing ${courses.length} of ${
                  pagination?.totalCourses || 0
                } courses`}
          </p>
          <div className='inline-flex items-center space-x-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'>
            <Filter className='h-4 w-4' />
            <span className='text-sm'>
              {debouncedSearchTerm ||
              selectedCategory !== 'all' ||
              selectedPriceRange !== 'all'
                ? 'Filters applied'
                : 'No filters'}
            </span>
          </div>
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className='mx-auto grid max-w-[1400px] grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className='mx-auto w-full max-w-[380px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm animate-pulse dark:border-slate-800 dark:bg-slate-900'
              >
                <div className='h-48 w-full bg-slate-200 dark:bg-slate-800'></div>
                <div className='p-6 space-y-4'>
                  <div className='h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800'></div>
                  <div className='h-3 w-full rounded bg-slate-200 dark:bg-slate-800'></div>
                  <div className='h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800'></div>
                  <div className='flex justify-between items-center'>
                    <div className='h-6 w-16 rounded bg-slate-200 dark:bg-slate-800'></div>
                    <div className='h-8 w-24 rounded bg-slate-200 dark:bg-slate-800'></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <>
            <div className='mx-auto grid max-w-[1400px] grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
              {courses.map((course) => (
                <CoursesPageCard
                  key={course.id}
                  course={course}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className='mt-12 flex flex-col sm:flex-row items-center justify-center gap-4'>
                <div className='flex items-center space-x-2'>
                  <button
                    onClick={() => {
                      // Handle previous page
                    }}
                    disabled={!pagination.hasPrevPage}
                    className='rounded-xl border border-slate-300 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                  >
                    Previous
                  </button>

                  <span className='px-4 py-2 text-slate-600 dark:text-slate-300'>
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>

                  <button
                    onClick={() => {
                      // Handle next page
                    }}
                    disabled={!pagination.hasNextPage}
                    className='rounded-xl border border-slate-300 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className='py-16 text-center'>
            <div className='mb-4 text-slate-400 dark:text-slate-500'>
              <Search className='h-16 w-16 mx-auto' />
            </div>
            <h3 className='mb-2 text-xl font-semibold text-slate-900 dark:text-white'>
              No courses found
            </h3>
            <p className='mb-6 text-slate-600 dark:text-slate-300'>
              Try adjusting your search criteria or filters
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedPriceRange('all');
                setSelectedCategory('all');
                setSortBy('createdAt');
                setSortOrder('desc');
              }}
              className='rounded-xl bg-slate-900 px-6 py-2.5 text-white transition-colors duration-200 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
