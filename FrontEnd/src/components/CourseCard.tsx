import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, Star, BookOpen } from 'lucide-react';
import LazyImage from './LazyImage';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  duration: string;
  students: number;
  rating: number;
  level: string;
  image: string;
  features: string[];
}

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const discount = course.originalPrice
    ? Math.round(
        ((course.originalPrice - course.price) / course.originalPrice) * 100
      )
    : 0;

  return (
    <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group'>
      <div className='relative overflow-hidden'>
        <LazyImage
          src={course.image}
          alt={course.title}
          className='w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300'
        />
        {discount > 0 && (
          <div className='absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-semibold'>
            {discount}% OFF
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

        <div className='flex items-center justify-between mb-4'>
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
          <div className='flex flex-wrap gap-2'>
            {course.features.slice(0, 2).map((feature, index) => (
              <span
                key={index}
                className='px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-md'
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <span className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
              ${course.price}
            </span>
            {course.originalPrice && (
              <span className='text-lg text-gray-500 dark:text-gray-400 line-through'>
                ${course.originalPrice}
              </span>
            )}
          </div>
          <Link
            to={`/courses/${course.id}`}
            className='flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 text-sm font-medium'
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
