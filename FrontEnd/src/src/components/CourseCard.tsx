import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, Star, BookOpen } from 'lucide-react';
import LazyImage from './LazyImage';
import type { Course } from '../services/courses';

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group w-full'>
      <div className='relative overflow-hidden'>
        <LazyImage
          src={
            course.imageUrl ||
            'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=500'
          }
          alt={course.title}
          className='w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300'
        />
        {course.isFree && (
          <div className='absolute top-4 left-4 bg-green-500 text-white px-2 py-1 rounded-md text-sm font-semibold'>
            FREE
          </div>
        )}
        <div className='absolute top-4 right-4 bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-medium'>
          {course.level}
        </div>
      </div>

      <div className='p-6'>
        <h3 className='text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2'>
          {course.title}
        </h3>

        <p className='text-gray-600 dark:text-gray-300 mb-4 line-clamp-2'>
          {course.description}
        </p>

        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-4'>
          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400'>
              <Clock className='h-4 w-4' />
              <span>{course.duration}</span>
            </div>
            <div className='flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400'>
              <Users className='h-4 w-4' />
              <span>{course.students}</span>
            </div>
          </div>
          <div className='flex items-center space-x-1'>
            <Star className='h-4 w-4 fill-current text-yellow-400' />
            <span className='text-sm font-medium text-gray-900 dark:text-white'>
              {course.rating}
            </span>
          </div>
        </div>

        <div className='mb-4'>
          <div className='flex flex-wrap gap-1 sm:gap-2'>
            {course.features?.slice(0, 2).map((feature, index) => (
              <span
                key={index}
                className='px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-md truncate'
              >
                {feature}
              </span>
            )) || (
              <>
                <span className='px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-md'>
                  Expert Content
                </span>
                <span className='px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-md'>
                  Lifetime Access
                </span>
              </>
            )}
          </div>
        </div>

        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
          <div className='flex items-center space-x-2'>
            {course.isFree ? (
              <span className='text-2xl font-bold text-green-600 dark:text-green-400'>
                Free
              </span>
            ) : (
              <span className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                ${course.price}
              </span>
            )}
          </div>
          <Link
            to={`/courses/${course.id}`}
            className='flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 text-sm font-medium w-full sm:w-auto justify-center'
          >
            <BookOpen className='h-4 w-4' />
            <span>View Course</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
