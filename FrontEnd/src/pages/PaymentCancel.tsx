import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, RotateCcw } from 'lucide-react';

const PaymentCancel: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-12'>
      <div className='container mx-auto px-4 max-w-2xl'>
        {/* Cancel Header */}
        <div className='text-center mb-12'>
          <div className='bg-red-100 dark:bg-red-900/30 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center'>
            <XCircle className='h-12 w-12 text-red-600 dark:text-red-400' />
          </div>
          <h1 className='text-4xl font-bold text-gray-900 dark:text-white mb-4'>
            Payment Cancelled
          </h1>
          <p className='text-xl text-gray-600 dark:text-gray-300'>
            Your payment was cancelled. No charges were made.
          </p>
        </div>

        {/* Information Card */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8'>
          <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
            What happened?
          </h2>
          <div className='space-y-3 text-gray-600 dark:text-gray-300'>
            <p>• You cancelled the payment process before completion</p>
            <p>• No payment was processed and no charges were made</p>
            <p>• You can try again anytime or explore our free courses</p>
          </div>

          {sessionId && (
            <div className='mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg'>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                Session ID: {sessionId}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className='text-center space-y-4'>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link
              to='/courses'
              className='inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl'
            >
              <RotateCcw className='h-5 w-5' />
              <span>Try Another Course</span>
            </Link>

            <Link
              to='/dashboard'
              className='inline-flex items-center space-x-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200'
            >
              <ArrowLeft className='h-5 w-5' />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          <div className='flex justify-center space-x-4 text-sm'>
            <Link
              to='/courses?isFree=true'
              className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium'
            >
              Browse Free Courses
            </Link>
            <span className='text-gray-400'>•</span>
            <Link
              to='/portal'
              className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium'
            >
              Take Practice Test
            </Link>
          </div>
        </div>

        {/* Help Section */}
        <div className='mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-center'>
          <h3 className='text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2'>
            Need Help?
          </h3>
          <p className='text-blue-800 dark:text-blue-200 mb-4'>
            If you experienced any issues during checkout, our support team is
            here to help.
          </p>
          <a
            href='mailto:support@ptebydee.com'
            className='inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200'
          >
            <span>Contact Support</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
