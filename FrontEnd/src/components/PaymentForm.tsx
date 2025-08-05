import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from '@stripe/react-stripe-js';
import { CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  courseTitle: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  clientSecret,
  amount,
  currency,
  courseTitle,
  onSuccess,
  onError,
  isLoading: externalLoading = false,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setMessage(error.message || 'An error occurred during payment.');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setMessage('Payment successful!');
        onSuccess(paymentIntent.id);
      } else {
        setMessage('Payment processing...');
      }
    } catch (err: any) {
      setMessage('An unexpected error occurred.');
      onError(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isProcessing || externalLoading;

  return (
    <div className='max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
      {/* Header */}
      <div className='text-center mb-6'>
        <div className='bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center'>
          <CreditCard className='h-8 w-8 text-blue-600 dark:text-blue-400' />
        </div>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
          Complete Your Purchase
        </h2>
        <p className='text-gray-600 dark:text-gray-300'>{courseTitle}</p>
        <div className='text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2'>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
          }).format(amount)}
        </div>
      </div>

      {/* Security Notice */}
      <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6'>
        <div className='flex items-center space-x-2'>
          <Lock className='h-5 w-5 text-green-600 dark:text-green-400' />
          <span className='text-sm font-medium text-green-800 dark:text-green-300'>
            Secure Payment
          </span>
        </div>
        <p className='text-sm text-green-700 dark:text-green-400 mt-1'>
          Your payment information is encrypted and secure. Powered by Stripe.
        </p>
      </div>

      {/* Payment Form */}
      <form
        onSubmit={handleSubmit}
        className='space-y-6'
      >
        {/* Payment Element */}
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
            Payment Information
          </label>
          <div className='border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700'>
            <PaymentElement
              options={{
                layout: 'tabs',
              }}
            />
          </div>
        </div>

        {/* Address Element */}
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
            Billing Address
          </label>
          <div className='border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700'>
            <AddressElement
              options={{
                mode: 'billing',
              }}
            />
          </div>
        </div>

        {/* Error/Success Message */}
        {message && (
          <div
            className={`flex items-center space-x-2 p-3 rounded-lg text-sm ${
              message.includes('successful')
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
            }`}
          >
            {message.includes('successful') ? (
              <CheckCircle className='h-4 w-4' />
            ) : (
              <AlertCircle className='h-4 w-4' />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type='submit'
          disabled={!stripe || !elements || isLoading}
          className='w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2'
        >
          {isLoading ? (
            <>
              <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Lock className='h-5 w-5' />
              <span>
                Pay{' '}
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: currency.toUpperCase(),
                }).format(amount)}
              </span>
            </>
          )}
        </button>
      </form>

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
  );
};

export default PaymentForm;
