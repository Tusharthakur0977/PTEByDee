import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Layers3,
  Star,
  Users,
} from 'lucide-react';
import LazyImage from './LazyImage';
import type { Course } from '../services/courses';

interface CoursesPageCardProps {
  course: Course;
}

const CoursesPageCard: React.FC<CoursesPageCardProps> = ({ course }) => {
  const featureChips =
    course.features?.slice(0, 3) || [
      'Exam-focused content',
      'Structured learning',
      'Practical strategy',
    ];

  return (
    <div className='group isolate mx-auto flex h-full w-full max-w-[380px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900'>
      <div className='relative overflow-hidden [border-top-left-radius:inherit] [border-top-right-radius:inherit]'>
        <LazyImage
          src={
            course.imageUrl ||
            'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=500'
          }
          alt={course.title}
          className='h-48 w-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-105 [border-top-left-radius:inherit] [border-top-right-radius:inherit] sm:h-52'
        />
        <div className='absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent [border-top-left-radius:inherit] [border-top-right-radius:inherit]' />

        <div className='absolute left-4 right-4 top-4 flex items-start justify-between gap-3'>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
              course.isFree
                ? 'bg-emerald-400 text-slate-950'
                : 'bg-white/90 text-slate-900'
            }`}
          >
            {course.isFree ? 'Free Access' : 'Premium Course'}
          </span>

        </div>

        <div className='absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3'>
          <div className='inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white backdrop-blur-sm'>
            <Star className='h-4 w-4 fill-current text-amber-300' />
            <span className='font-medium'>{course.rating}</span>
            <span className='text-white/70'>({course.reviewCount || 0})</span>
          </div>

          {!course.isFree && (
            <div className='rounded-full bg-slate-950/70 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm'>
              ${course.price}
            </div>
          )}
        </div>
      </div>

      <div className='flex flex-1 flex-col p-5 sm:p-6'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h3 className='line-clamp-2 text-xl font-semibold text-slate-900 dark:text-white sm:text-[1.35rem]'>
              {course.title}
            </h3>
          </div>
          {course.isFree && (
            <div className='shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'>
              Free
            </div>
          )}
        </div>

        <p className='mt-4 min-h-[5.25rem] line-clamp-3 text-sm leading-7 text-slate-600 dark:text-slate-300'>
          {course.description}
        </p>

        {/* <div className='mt-5 grid grid-cols-3 gap-2.5'>
          <div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950'>
            <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400'>
              <Clock3 className='h-4 w-4' />
              <span>Duration</span>
            </div>
            <div className='mt-2 text-sm font-semibold text-slate-900 dark:text-white'>
              {course.duration}
            </div>
          </div>
          <div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950'>
            <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400'>
              <Users className='h-4 w-4' />
              <span>Learners</span>
            </div>
            <div className='mt-2 text-sm font-semibold text-slate-900 dark:text-white'>
              {course.students}
            </div>
          </div>
          <div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950'>
            <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400'>
              <Layers3 className='h-4 w-4' />
              <span>Sections</span>
            </div>
            <div className='mt-2 text-sm font-semibold text-slate-900 dark:text-white'>
              {course.sectionCount || 0}
            </div>
          </div>
        </div> */}

        {/* <div className='mt-5 flex flex-wrap gap-2'>
          {featureChips.map((feature, index) => (
            <span
              key={`${feature}-${index}`}
              className='rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'
            >
              {feature}
            </span>
          ))}
        </div> */}

        <div className='mt-auto flex items-center justify-between gap-4 pt-6'>
          <div>
            <p className='text-xs uppercase tracking-[0.2em] text-slate-400'>
              Access
            </p>
            <div className='mt-1 text-xl font-semibold text-slate-900 dark:text-white'>
              {course.isFree ? 'Start free' : `$${course.price}`}
            </div>
          </div>

          <Link
            to={`/courses/${course.id}`}
            className='inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
          >
            <BookOpen className='h-4 w-4' />
            <span>View Details</span>
            <ArrowRight className='h-4 w-4' />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CoursesPageCard;
