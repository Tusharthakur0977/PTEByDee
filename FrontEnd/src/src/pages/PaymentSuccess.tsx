import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Download, Star } from 'lucide-react';
import {
  confirmCheckoutSession,
  getCourseDetailsForPayment,
} from '../services/payment';
import { useAuth } from '../contexts/AuthContext';
import { extractCourseIdFromPurchasedItem } from '../utils/paymentUtils';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isConfirming, setIsConfirming] = useState(true);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get parameters from URL - primarily checkout sessions
  const sessionId = searchParams.get('session_id');

  console.log('Payment Success Debug:', {
    sessionId,
    searchParams: Object.fromEntries(searchParams.entries()),
  });

  const fetchCourseDetails = useCallback(async (courseId: string) => {
    try {
      setIsLoadingCourse(true);
      console.log('Fetching course details for:', courseId);
      const details = await getCourseDetailsForPayment(courseId);
      setCourseDetails(details);
    } catch (err: any) {
      console.error('Course details fetch error:', err);
      // Don't set error here, just log it - we can still show basic info
    } finally {
      setIsLoadingCourse(false);
    }
  }, []);

  const handleCheckoutConfirmation = useCallback(async () => {
    try {
      setIsConfirming(true);
      console.log('Confirming checkout session:', sessionId);
      const confirmationData = await confirmCheckoutSession(sessionId!);
      setConfirmation(confirmationData);

      // Try to extract course ID and fetch detailed course info with signed URLs
      if (confirmationData?.paymentDetails?.transactionId) {
        // First try to get course ID from the confirmation data
        const courseId = confirmationData.course?.id;
        if (courseId) {
          await fetchCourseDetails(courseId);
        }
      }
    } catch (err: any) {
      console.error('Checkout confirmation error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to confirm checkout session'
      );
    } finally {
      setIsConfirming(false);
    }
  }, [sessionId, fetchCourseDetails]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Handle checkout session
    if (sessionId) {
      handleCheckoutConfirmation();
    } else {
      setError(
        'Payment session information not found. Please check your payment status in your dashboard.'
      );
      setIsConfirming(false);
    }
  }, [sessionId, user, navigate, handleCheckoutConfirmation]);

  if (!user) {
    return null; // Will redirect to login
  }

  if (isConfirming) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6'></div>
          <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
            Confirming Your Payment
          </h2>
          <p className='text-gray-600 dark:text-gray-300'>
            Please wait while we process your enrollment...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <div className='text-center max-w-md mx-auto p-6'>
          <div className='bg-red-100 dark:bg-red-900/30 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center'>
            <CheckCircle className='h-10 w-10 text-red-600 dark:text-red-400' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
            Payment Confirmation Failed
          </h1>
          <p className='text-gray-600 dark:text-gray-300 mb-6'>{error}</p>
          <div className='space-y-3'>
            <Link
              to='/dashboard'
              className='block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 text-center'
            >
              Go to Dashboard
            </Link>
            <Link
              to='/courses'
              className='block border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-center'
            >
              Browse Courses
            </Link>
            <Link
              to='/payment/history'
              className='block border border-blue-600 text-blue-600 dark:text-blue-400 px-6 py-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-center'
            >
              View Payment History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!confirmation) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
            No payment information found
          </h2>
        </div>
      </div>
    );
  }

  // Safety check to ensure confirmation data exists
  if (!confirmation || !confirmation.course || !confirmation.paymentDetails) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-12'>
        <div className='container mx-auto px-4 max-w-4xl'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
              Payment Confirmation
            </h1>
            <p className='text-gray-600 dark:text-gray-300'>
              Loading payment details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-12'>
      <div className='container mx-auto px-4 max-w-4xl'>
        {/* Success Header */}
        <div className='text-center mb-12'>
          <div className='bg-green-100 dark:bg-green-900/30 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center'>
            <CheckCircle className='h-12 w-12 text-green-600 dark:text-green-400' />
          </div>
          <h1 className='text-4xl font-bold text-gray-900 dark:text-white mb-4'>
            Payment Successful!
          </h1>
          <p className='text-xl text-gray-600 dark:text-gray-300'>
            Welcome to your new course. Let's start learning!
          </p>
        </div>

        {/* Course Information */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8'>
          <div className='flex items-start space-x-6'>
            <div className='relative'>
              <img
                src={
                  courseDetails?.imageUrl ||
                  confirmation.course.imageUrl ||
                  'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=300'
                }
                alt={courseDetails?.title || confirmation.course.title}
                className='w-24 h-24 rounded-lg object-cover'
              />
              {isLoadingCourse && (
                <div className='absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center'>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                </div>
              )}
            </div>
            <div className='flex-1'>
              <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
                {courseDetails?.title || confirmation.course.title}
              </h2>
              <p className='text-gray-600 dark:text-gray-300 mb-4'>
                {courseDetails?.description || confirmation.course.description}
              </p>
              <div className='flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400'>
                <span>
                  {courseDetails?.sectionCount ||
                    confirmation.course.sectionCount}{' '}
                  sections
                </span>
                {courseDetails?.totalLessons && (
                  <>
                    <span>•</span>
                    <span>{courseDetails.totalLessons} lessons</span>
                  </>
                )}
                <span>•</span>
                <span>Lifetime access</span>
                <span>•</span>
                <span>Certificate included</span>
              </div>
            </div>
            <div className='text-right'>
              <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: confirmation.paymentDetails?.currency || 'USD',
                }).format(confirmation.paymentDetails?.amount || 0)}
              </div>
              <div className='text-sm text-gray-500 dark:text-gray-400'>
                Paid via {confirmation.paymentDetails?.gateway || 'Stripe'}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-8'>
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
            <h3 className='text-lg font-bold text-gray-900 dark:text-white mb-4'>
              Payment Details
            </h3>
            <div className='space-y-3'>
              <div className='flex justify-between'>
                <span className='text-gray-600 dark:text-gray-300'>
                  Transaction ID
                </span>
                <span className='font-mono text-sm text-gray-900 dark:text-white'>
                  {(
                    confirmation.paymentDetails?.transactionId ||
                    confirmation.paymentDetails?.paymentIntentId ||
                    confirmation.paymentDetails?.sessionId ||
                    'N/A'
                  ).slice(-8)}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600 dark:text-gray-300'>Amount</span>
                <span className='font-semibold text-gray-900 dark:text-white'>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: confirmation.paymentDetails?.currency || 'USD',
                  }).format(confirmation.paymentDetails?.amount || 0)}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600 dark:text-gray-300'>Status</span>
                <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'>
                  {confirmation.paymentDetails?.status || 'Completed'}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600 dark:text-gray-300'>Date</span>
                <span className='text-gray-900 dark:text-white'>
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
            <h3 className='text-lg font-bold text-gray-900 dark:text-white mb-4'>
              What's Next?
            </h3>
            <div className='space-y-4'>
              <div className='flex items-start space-x-3'>
                <div className='bg-blue-100 dark:bg-blue-900/30 p-1 rounded-full'>
                  <CheckCircle className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                </div>
                <div>
                  <p className='font-medium text-gray-900 dark:text-white'>
                    Start Learning
                  </p>
                  <p className='text-sm text-gray-600 dark:text-gray-300'>
                    Access your course content immediately
                  </p>
                </div>
              </div>
              <div className='flex items-start space-x-3'>
                <div className='bg-purple-100 dark:bg-purple-900/30 p-1 rounded-full'>
                  <Star className='h-4 w-4 text-purple-600 dark:text-purple-400' />
                </div>
                <div>
                  <p className='font-medium text-gray-900 dark:text-white'>
                    Track Progress
                  </p>
                  <p className='text-sm text-gray-600 dark:text-gray-300'>
                    Monitor your learning journey
                  </p>
                </div>
              </div>
              <div className='flex items-start space-x-3'>
                <div className='bg-green-100 dark:bg-green-900/30 p-1 rounded-full'>
                  <Download className='h-4 w-4 text-green-600 dark:text-green-400' />
                </div>
                <div>
                  <p className='font-medium text-gray-900 dark:text-white'>
                    Get Certificate
                  </p>
                  <p className='text-sm text-gray-600 dark:text-gray-300'>
                    Earn your completion certificate
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='text-center space-y-4'>
          <Link
            to={`/courses/${confirmation.course.id}`}
            className='inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl'
          >
            <span>Start Learning Now</span>
            <ArrowRight className='h-5 w-5' />
          </Link>

          <div className='flex justify-center space-x-4'>
            <Link
              to='/dashboard'
              className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium'
            >
              Go to Dashboard
            </Link>
            <span className='text-gray-400'>•</span>
            <Link
              to='/payment/history'
              className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium'
            >
              View Payment History
            </Link>
            <span className='text-gray-400'>•</span>
            <Link
              to='/courses'
              className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium'
            >
              Browse More Courses
            </Link>
          </div>
        </div>

        {/* Receipt Download */}
        <div className='mt-8 text-center'>
          <p className='text-sm text-gray-500 dark:text-gray-400 mb-2'>
            Need a receipt? We've sent one to your email address.
          </p>
          <button
            onClick={() => {
              // TODO: Implement receipt download
              console.log(
                'Download receipt for:',
                confirmation?.paymentDetails?.transactionId
              );
            }}
            className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium'
          >
            Download Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
