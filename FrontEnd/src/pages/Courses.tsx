/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import { getCourses, getCategories } from '../services/courses';
import { useAuth } from '../contexts/AuthContext';
import type { Course, Category, CourseFilters } from '../services/courses';
import useDebounce from '../hooks/useDebounce';

const Courses: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
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
    selectedLevel,
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
      // Don't show error to user for public course listing, just show empty state
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
    }
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-');
    setSortBy(newSortBy);
    setSortOrder(newSortOrder as 'asc' | 'desc');
  };

  // Remove error display since we're handling errors gracefully now

  return (
    <div className='min-h-screen py-8'>
      <div className='container mx-auto px-4'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-gray-900 dark:text-white mb-4'>
            PTE Academic Courses
          </h1>
          <p className='text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto'>
            Choose from our comprehensive range of PTE preparation courses
            designed to help you achieve your target score.
          </p>
        </div>

        {/* Search and Filters */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'>
            {/* Search */}
            <div className='relative sm:col-span-2 lg:col-span-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
              <input
                type='text'
                placeholder='Search courses...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
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
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              >
                <option value='all'>All Prices</option>
                <option value='free'>Free</option>
                <option value='paid'>Paid</option>
              </select>
            </div>

            {/* Level Filter */}
            <div>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              >
                <option value='all'>All Levels</option>
                <option value='Beginner'>Beginner</option>
                <option value='Intermediate'>Intermediate</option>
                <option value='Advanced'>Advanced</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => handleSortChange(e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
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
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8'>
          <p className='text-gray-600 dark:text-gray-300'>
            {isLoading
              ? 'Loading courses...'
              : `Showing ${courses.length} of ${
                  pagination?.totalCourses || 0
                } courses`}
          </p>
          <div className='flex items-center space-x-2 text-gray-600 dark:text-gray-300'>
            <Filter className='h-4 w-4' />
            <span className='text-sm'>
              {debouncedSearchTerm ||
              selectedCategory !== 'all' ||
              selectedPriceRange !== 'all' ||
              selectedLevel !== 'all'
                ? 'Filters applied'
                : 'No filters'}
            </span>
          </div>
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8'>
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className='bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-pulse'
              >
                <div className='w-full h-48 bg-gray-300 dark:bg-gray-600'></div>
                <div className='p-6 space-y-4'>
                  <div className='h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4'></div>
                  <div className='h-3 bg-gray-300 dark:bg-gray-600 rounded w-full'></div>
                  <div className='h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3'></div>
                  <div className='flex justify-between items-center'>
                    <div className='h-6 bg-gray-300 dark:bg-gray-600 rounded w-16'></div>
                    <div className='h-8 bg-gray-300 dark:bg-gray-600 rounded w-24'></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8'>
              {courses.map((course) => (
                <CourseCard
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
                    className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700'
                  >
                    Previous
                  </button>

                  <span className='px-4 py-2 text-gray-600 dark:text-gray-300'>
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>

                  <button
                    onClick={() => {
                      // Handle next page
                    }}
                    disabled={!pagination.hasNextPage}
                    className='px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700'
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className='text-center py-16'>
            <div className='text-gray-400 dark:text-gray-500 mb-4'>
              <Search className='h-16 w-16 mx-auto' />
            </div>
            <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
              No courses found
            </h3>
            <p className='text-gray-600 dark:text-gray-300 mb-6'>
              Try adjusting your search criteria or filters
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedLevel('all');
                setSelectedPriceRange('all');
                setSelectedCategory('all');
                setSortBy('createdAt');
                setSortOrder('desc');
              }}
              className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200'
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
