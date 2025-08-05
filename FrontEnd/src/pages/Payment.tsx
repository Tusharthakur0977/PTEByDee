import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getCourseById } from '../services/courses';
import { createPaymentIntent, confirmPayment } from '../services/payment';
import PaymentForm from '../components/PaymentForm';
import type { Course } from '../services/courses';

const Payment: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    'pending' | 'processing' | 'success' | 'error'
  >('pending');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (courseId) {
      initializePayment();
    }
  }, [courseId, user]);

  const initializePayment = async () => {
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

      // Create payment intent
      const paymentData = await createPaymentIntent(courseId!);
      setClientSecret(paymentData.clientSecret);
      setPaymentIntentId(paymentData.paymentIntentId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initialize payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      setPaymentStatus('processing');
      const confirmation = await confirmPayment(paymentIntentId);
      setPaymentStatus('success');

      // Redirect to course page after a short delay
      setTimeout(() => {
        navigate(`/courses/${courseId}`);
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to confirm payment');
      setPaymentStatus('error');
    }
  };

  const handlePaymentError = (error: string) => {
    setError(error);
    setPaymentStatus('error');
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

  if (paymentStatus === 'success') {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center max-w-md mx-auto p-6'>
          <CheckCircle className='h-16 w-16 text-green-500 mx-auto mb-4' />
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
            Payment Successful!
          </h1>
          <p className='text-gray-600 dark:text-gray-300 mb-6'>
            You have successfully enrolled in "{course.title}". You will be
            redirected to the course page shortly.
          </p>
          <Link
            to={`/courses/${courseId}`}
            className='bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700'
          >
            Go to Course
          </Link>
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
            {clientSecret && paymentIntentId ? (
              <PaymentForm
                clientSecret={clientSecret}
                amount={course.price}
                currency={course.currency || 'USD'}
                courseTitle={course.title}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                isLoading={paymentStatus === 'processing'}
              />
            ) : (
              <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
                <p className='text-gray-600 dark:text-gray-300'>
                  Setting up payment...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
