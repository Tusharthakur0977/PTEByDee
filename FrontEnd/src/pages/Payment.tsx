import { ArrowLeft, CheckCircle, CreditCard, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CheckoutButton from '../components/CheckoutButton';
import { useAuth } from '../contexts/AuthContext';
import type { Course } from '../services/courses';
import { getCourseById } from '../services/courses';

const Payment: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (courseId) {
      initializeCourse();
    }
  }, [courseId, user]);

  const initializeCourse = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get course details
      const courseData = await getCourseById(courseId!);
      setCourse(courseData);

      // Check if course is free
      if (courseData.isFree) {
        setError('This course is free and does not require payment.');
        return;
      }

      // Check if user is already enrolled
      if (courseData.isEnrolled) {
        setError('You are already enrolled in this course.');
        return;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load course');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckoutError = (error: string) => {
    setError(error);
  };

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
            Authentication Required
          </h1>
          <p className='text-gray-600 dark:text-gray-300 mb-6'>
            Please log in to purchase courses.
          </p>
          <Link
            to='/login'
            className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700'
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600 dark:text-gray-300'>
            Initializing payment...
          </p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center max-w-md mx-auto p-6'>
          <XCircle className='h-16 w-16 text-red-500 mx-auto mb-4' />
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
            Payment Error
          </h1>
          <p className='text-gray-600 dark:text-gray-300 mb-6'>
            {error || 'Course not found'}
          </p>
          <div className='space-y-3'>
            <Link
              to={`/courses/${courseId}`}
              className='block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700'
            >
              Back to Course
            </Link>
            <Link
              to='/courses'
              className='block border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700'
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-8'>
      <div className='container mx-auto px-4 max-w-4xl'>
        {/* Header */}
        <div className='mb-8'>
          <Link
            to={`/courses/${courseId}`}
            className='inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4'
          >
            <ArrowLeft className='h-4 w-4' />
            <span>Back to Course</span>
          </Link>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
            Purchase Course
          </h1>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Course Summary */}
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
            <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-6'>
              Order Summary
            </h2>

            <div className='flex items-start space-x-4 mb-6'>
              <img
                src={
                  course.imageUrl ||
                  'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=300'
                }
                alt={course.title}
                className='w-20 h-20 rounded-lg object-cover'
              />
              <div className='flex-1'>
                <h3 className='font-semibold text-gray-900 dark:text-white mb-2'>
                  {course.title}
                </h3>
                <p className='text-sm text-gray-600 dark:text-gray-300 line-clamp-2'>
                  {course.description}
                </p>
              </div>
            </div>

            <div className='border-t border-gray-200 dark:border-gray-700 pt-4'>
              <div className='flex justify-between items-center mb-2'>
                <span className='text-gray-600 dark:text-gray-300'>
                  Course Price
                </span>
                <span className='font-semibold text-gray-900 dark:text-white'>
                  ${course.price}
                </span>
              </div>
              <div className='flex justify-between items-center mb-2'>
                <span className='text-gray-600 dark:text-gray-300'>Tax</span>
                <span className='font-semibold text-gray-900 dark:text-white'>
                  $0.00
                </span>
              </div>
              <div className='border-t border-gray-200 dark:border-gray-700 pt-2 mt-2'>
                <div className='flex justify-between items-center'>
                  <span className='text-lg font-bold text-gray-900 dark:text-white'>
                    Total
                  </span>
                  <span className='text-lg font-bold text-blue-600 dark:text-blue-400'>
                    ${course.price}
                  </span>
                </div>
              </div>
            </div>

            {/* What's Included */}
            <div className='mt-6 pt-6 border-t border-gray-200 dark:border-gray-700'>
              <h4 className='font-semibold text-gray-900 dark:text-white mb-3'>
                What's Included:
              </h4>
              <ul className='space-y-2 text-sm text-gray-600 dark:text-gray-300'>
                <li className='flex items-center space-x-2'>
                  <CheckCircle className='h-4 w-4 text-green-500' />
                  <span>Lifetime access to course content</span>
                </li>
                <li className='flex items-center space-x-2'>
                  <CheckCircle className='h-4 w-4 text-green-500' />
                  <span>{course.sectionCount} sections with video lessons</span>
                </li>
                <li className='flex items-center space-x-2'>
                  <CheckCircle className='h-4 w-4 text-green-500' />
                  <span>Progress tracking and certificates</span>
                </li>
                <li className='flex items-center space-x-2'>
                  <CheckCircle className='h-4 w-4 text-green-500' />
                  <span>Mobile and desktop access</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
              <div className='text-center mb-6'>
                <div className='bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center'>
                  <CreditCard className='h-8 w-8 text-blue-600 dark:text-blue-400' />
                </div>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
                  Secure Checkout
                </h2>
                <p className='text-gray-600 dark:text-gray-300'>
                  You'll be redirected to our secure payment processor
                </p>
              </div>

              {/* Security Notice */}
              <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6'>
                <div className='flex items-center space-x-2'>
                  <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />
                  <span className='text-sm font-medium text-green-800 dark:text-green-300'>
                    Secure Payment
                  </span>
                </div>
                <p className='text-sm text-green-700 dark:text-green-400 mt-1'>
                  Your payment is processed securely by Stripe. We never store
                  your payment information.
                </p>
              </div>

              {/* Checkout Button */}
              <CheckoutButton
                courseId={course.id}
                courseTitle={course.title}
                price={course.price}
                currency={course.currency || 'USD'}
                onError={handleCheckoutError}
              />

              {/* Error Display */}
              {error && (
                <div className='mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm'>
                  {error}
                </div>
              )}

              {/* Footer */}
              <div className='mt-6 text-center'>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  By completing this purchase, you agree to our{' '}
                  <a
                    href='#'
                    className='text-blue-600 dark:text-blue-400 hover:underline'
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href='#'
                    className='text-blue-600 dark:text-blue-400 hover:underline'
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
