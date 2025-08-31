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
    sessionId: string;
    amount: number;
    currency: string;
    status: string;
    gateway: string;
    transactionId: string;
    paymentIntentId?: string; // Optional for backward compatibility
  };
}

export interface CourseDetailsForPayment {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  coursePreviewVideoUrl?: string;
  price: number;
  currency: string;
  isFree: boolean;
  createdAt: string;
  updatedAt: string;
  sectionCount: number;
  totalLessons: number;
  sections: Array<{
    id: string;
    title: string;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      order: number;
    }>;
  }>;
  enrollment: {
    id: string;
    progress: number;
    completed: boolean;
    enrolledAt: string;
    completedAt?: string;
  } | null;
  isEnrolled: boolean;
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
  try {
    const response = await api.post('/payment/confirm-checkout', { sessionId });
    return response.data.data;
  } catch (error: any) {
    console.error('Confirm checkout session error:', error);
    throw new Error(
      error.response?.data?.message ||
        'Failed to confirm payment. Please contact support if the issue persists.'
    );
  }
};

// Verify payment status by session ID
export const verifyPaymentStatus = async (sessionId: string) => {
  const response = await api.get(`/payment/verify-status/${sessionId}`);
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

// Get course details with signed URLs for payment success page
export const getCourseDetailsForPayment = async (
  courseId: string
): Promise<CourseDetailsForPayment> => {
  try {
    const response = await api.get(`/payment/course-details/${courseId}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Get course details for payment error:', error);
    throw new Error(
      error.response?.data?.message ||
        'Failed to get course details. Please try again.'
    );
  }
};

// Get Stripe publishable key
export const getStripePublishableKey = (): string => {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error('Stripe publishable key not configured');
  }
  return key;
};
