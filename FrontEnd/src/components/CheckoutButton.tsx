import React, { useState } from 'react';
import { CreditCard, Loader, ShoppingCart } from 'lucide-react';
import { createCheckoutSession } from '../services/payment';
import { useAuth } from '../contexts/AuthContext';

interface CheckoutButtonProps {
  courseId: string;
  courseTitle: string;
  price: number;
  currency: string;
  className?: string;
  disabled?: boolean;
  onError?: (error: string) => void;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  courseId,
  courseTitle,
  price,
  currency,
  className = '',
  disabled = false,
  onError,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      onError?.('Please log in to purchase this course');
      return;
    }

    try {
      setIsLoading(true);

      // Create checkout session
      const checkoutData = await createCheckoutSession(courseId);

      // Redirect to Stripe Checkout
      if (checkoutData.sessionUrl) {
        window.location.href = checkoutData.sessionUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      onError?.(
        error.response?.data?.message || 'Failed to start checkout process'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={disabled || isLoading || !user}
      className={`w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${className}`}
    >
      {isLoading ? (
        <>
          <Loader className='h-5 w-5 animate-spin' />
          <span>Processing...</span>
        </>
      ) : (
        <>
          <ShoppingCart className='h-5 w-5' />
          <span>
            Purchase for{' '}
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency.toUpperCase(),
            }).format(price)}
          </span>
        </>
      )}
    </button>
  );
};

export default CheckoutButton;
