import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Download, Star } from 'lucide-react';
import { confirmPayment, confirmCheckoutSession } from '../services/payment';
import { useAuth } from '../contexts/AuthContext';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isConfirming, setIsConfirming] = useState(true);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Get parameters from URL - support both checkout sessions and payment intents
  const sessionId = searchParams.get('session_id');
  const paymentIntentId = searchParams.get('payment_intent');
  const paymentIntentClientSecret = searchParams.get(
    'payment_intent_client_secret'
  );

  console.log('Payment Success Debug:', {
    sessionId,
    paymentIntentId,
    paymentIntentClientSecret,
    searchParams: Object.fromEntries(searchParams.entries()),
  });

  const handleCheckoutConfirmation = useCallback(async () => {
    try {
      setIsConfirming(true);
      console.log('Confirming checkout session:', sessionId);
      const confirmationData = await confirmCheckoutSession(sessionId!);
      setConfirmation(confirmationData);
    } catch (err: any) {
      console.error('Checkout confirmation error:', err);
      setError(
        err.response?.data?.message || 'Failed to confirm checkout session'
      );
    } finally {
      setIsConfirming(false);
    }
  }, [sessionId]);

  const handlePaymentConfirmation = useCallback(async () => {
    try {
      setIsConfirming(true);
      console.log('Confirming payment intent:', paymentIntentId);
      const confirmationData = await confirmPayment(paymentIntentId!);
      setConfirmation(confirmationData);
    } catch (err: any) {
      console.error('Payment confirmation error:', err);
      setError(err.response?.data?.message || 'Failed to confirm payment');
    } finally {
      setIsConfirming(false);
    }
  }, [paymentIntentId]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Handle checkout session (preferred method)
    if (sessionId) {
      handleCheckoutConfirmation();
    }
    // Handle payment intent (legacy method)
    else if (paymentIntentId) {
      handlePaymentConfirmation();
    } else {
      setError('Payment information not found');
      setIsConfirming(false);
    }
  }, [
    sessionId,
    paymentIntentId,
    user,
    navigate,
    handleCheckoutConfirmation,
    handlePaymentConfirmation,
  ]);

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
              className='block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700'
            >
              Go to Dashboard
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
            <img
              src={
                confirmation.course.imageUrl ||
                'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=300'
              }
              alt={confirmation.course.title}
              className='w-24 h-24 rounded-lg object-cover'
            />
            <div className='flex-1'>
              <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
                {confirmation.course.title}
              </h2>
              <p className='text-gray-600 dark:text-gray-300 mb-4'>
                {confirmation.course.description}
              </p>
              <div className='flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400'>
                <span>{confirmation.course.sectionCount} sections</span>
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
                  currency: confirmation.paymentDetails.currency,
                }).format(confirmation.paymentDetails.amount)}
              </div>
              <div className='text-sm text-gray-500 dark:text-gray-400'>
                Paid via {confirmation.paymentDetails.gateway || 'Stripe'}
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
                  {confirmation.paymentDetails.paymentIntentId.slice(-8)}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600 dark:text-gray-300'>Amount</span>
                <span className='font-semibold text-gray-900 dark:text-white'>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: confirmation.paymentDetails.currency,
                  }).format(confirmation.paymentDetails.amount)}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600 dark:text-gray-300'>Status</span>
                <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'>
                  {confirmation.paymentDetails.status}
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
          </div>
        </div>

        {/* Receipt Download */}
        <div className='mt-8 text-center'>
          <p className='text-sm text-gray-500 dark:text-gray-400 mb-2'>
            Need a receipt? We've sent one to your email address.
          </p>
          <button className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium'>
            Download Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
