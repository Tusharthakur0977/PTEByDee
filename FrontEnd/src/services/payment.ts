import api from './api';

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  transactionId: string;
  amount: number;
  currency: string;
  course: {
    id: string;
    title: string;
    price: number;
  };
}

export interface CheckoutSession {
  sessionId: string;
  sessionUrl: string;
  transactionId: string;
  course: {
    id: string;
    title: string;
    price: number;
    currency: string;
  };
}

export interface PaymentConfirmation {
  enrollment: {
    id: string;
    progress: number;
    completed: boolean;
    enrolledAt: string;
    completedAt?: string;
  };
  course: {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    sectionCount: number;
  };
  paymentDetails: {
    paymentIntentId: string;
    amount: number;
    currency: string;
    status: string;
  };
}

export interface Transaction {
  id: string;
  amount: number;
  paymentStatus: string;
  gateway: string;
  transactionId?: string;
  orderId?: string;
  purchasedItem?: string;
  createdAt: string;
}

export interface PaymentHistory {
  transactions: Transaction[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTransactions: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

// Create checkout session for course purchase (NEW PREFERRED METHOD)
export const createCheckoutSession = async (
  courseId: string
): Promise<CheckoutSession> => {
  const response = await api.post('/payment/create-checkout-session', {
    courseId,
  });
  return response.data.data;
};

// Confirm checkout session after successful payment (NEW PREFERRED METHOD)
export const confirmCheckoutSession = async (
  sessionId: string
): Promise<PaymentConfirmation> => {
  const response = await api.post('/payment/confirm-checkout', { sessionId });
  return response.data.data;
};

// Create payment intent for course purchase
export const createPaymentIntent = async (
  courseId: string
): Promise<PaymentIntent> => {
  const response = await api.post('/payment/create-intent', { courseId });
  return response.data.data;
};

// Confirm payment after successful Stripe payment
export const confirmPayment = async (
  paymentIntentId: string
): Promise<PaymentConfirmation> => {
  const response = await api.post('/payment/confirm', { paymentIntentId });
  return response.data.data;
};

// Get user's payment history
export const getPaymentHistory = async (
  page: number = 1,
  limit: number = 10
): Promise<PaymentHistory> => {
  const response = await api.get(
    `/payment/history?page=${page}&limit=${limit}`
  );
  return response.data.data;
};

// Get Stripe publishable key
export const getStripePublishableKey = (): string => {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error('Stripe publishable key not configured');
  }
  return key;
};
