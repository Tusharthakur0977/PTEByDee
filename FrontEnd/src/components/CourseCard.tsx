import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, Star, Users } from 'lucide-react';
import LazyImage from './LazyImage';
import type { Course } from '../services/courses';

interface CourseCardProps {
  course: Course;
  variant?: 'default' | 'featured';
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  variant = 'default',
}) => {
  const featureChips =
    course.features?.slice(0, 2) || ['Expert Content', 'Structured Practice'];
  const isFeatured = variant === 'featured';

  return (
    <div
      className={`group isolate overflow-hidden border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 ${
        isFeatured ? 'rounded-[24px]' : 'rounded-[28px]'
      }`}
      style={isFeatured ? { width: '100%', maxWidth: '340px' } : undefined}
    >
      <div className='relative overflow-hidden [border-top-left-radius:inherit] [border-top-right-radius:inherit]'>
        <LazyImage
          src={
            course.imageUrl ||
            'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=500'
          }
          alt={course.title}
          className={`w-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-105 [border-top-left-radius:inherit] [border-top-right-radius:inherit] ${
            isFeatured ? 'h-44' : 'h-52'
          }`}
        />
        <div className='absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent [border-top-left-radius:inherit] [border-top-right-radius:inherit]' />

        <div className='absolute left-4 right-4 top-4 flex items-start justify-between gap-3'>
          {course.isFree ? (
            <span className='rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-slate-950 shadow-sm'>
              Free Access
            </span>
          ) : (
            <span className='rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm'>
              Premium Course
            </span>
          )}

        </div>

        <div className='absolute bottom-4 left-4 right-4'>
          <div className='inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white backdrop-blur-sm'>
            <Star className='h-4 w-4 fill-current text-amber-300' />
            <span className='font-medium'>{course.rating}</span>
            <span className='text-white/70'>Learner rating</span>
          </div>
        </div>
      </div>

      <div className={isFeatured ? 'p-5' : 'p-6'}>
        <h3
          className={`line-clamp-2 font-semibold text-slate-900 dark:text-white ${
            isFeatured ? 'min-h-[3.5rem] text-xl' : 'min-h-[4rem] text-2xl'
          }`}
        >
          {course.title}
        </h3>


        <div className={`flex flex-wrap gap-2 ${isFeatured ? 'mt-4' : 'mt-5'}`}>
          {(isFeatured ? featureChips.slice(0, 1) : featureChips).map(
            (feature, index) => (
            <span
              key={`${feature}-${index}`}
              className='rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'
            >
              {feature}
            </span>
            ),
          )}
        </div>

        <div
          className={`mt-6 grid gap-3 ${
            isFeatured ? 'grid-cols-1' : 'grid-cols-2'
          }`}
        >
          <div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950'>
            <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400'>
              <Clock3 className='h-4 w-4' />
              <span>Duration</span>
            </div>
            <div className='mt-2 text-sm font-semibold text-slate-900 dark:text-white'>
              {course.duration}
            </div>
          </div>
          {!isFeatured && (
            <div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950'>
              <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400'>
                <Users className='h-4 w-4' />
                <span>Students</span>
              </div>
              <div className='mt-2 text-sm font-semibold text-slate-900 dark:text-white'>
                {course.students}
              </div>
            </div>
          )}
        </div>

        <div className={`flex items-center justify-between gap-4 ${isFeatured ? 'mt-5' : 'mt-6'}`}>
          <div>
            <p className='text-xs uppercase tracking-[0.2em] text-slate-400'>
              Price
            </p>
            <div
              className={`mt-1 font-semibold text-slate-900 dark:text-white ${
                isFeatured ? 'text-xl' : 'text-2xl'
              }`}
            >
              {course.isFree ? 'Free' : `$${course.price}`}
            </div>
          </div>

          <Link
            to={`/courses/${course.id}`}
            className={`inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 ${
              isFeatured ? 'px-4 py-2.5' : 'px-5 py-3'
            }`}
          >
            <span>{isFeatured ? 'Explore Path' : 'View Course'}</span>
            <ArrowRight className='h-4 w-4' />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
