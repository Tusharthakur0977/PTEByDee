import {
  ArrowLeft,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  Eye,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { PaymentHistory as PaymentHistoryType } from '../services/payment';
import { getPaymentHistory } from '../services/payment';
import { formatPurchasedItemForDisplay } from '../utils/paymentUtils';

const PaymentHistory: React.FC = () => {
  const { user } = useAuth();
  const [paymentHistory, setPaymentHistory] =
    useState<PaymentHistoryType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user) {
      fetchPaymentHistory(currentPage);
    }
  }, [user, currentPage]);

  const fetchPaymentHistory = async (page: number) => {
    try {
      setIsLoading(true);
      const data = await getPaymentHistory(page, 10);
      setPaymentHistory(data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to fetch payment history'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
            Authentication Required
          </h1>
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
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-red-600 mb-4'>Error</h1>
          <p className='text-gray-600 mb-4'>{error}</p>
          <button
            onClick={() => fetchPaymentHistory(currentPage)}
            className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-8'>
      <div className='container mx-auto px-4 max-w-6xl'>
        {/* Header */}
        <div className='mb-8'>
          <Link
            to='/dashboard'
            className='inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4'
          >
            <ArrowLeft className='h-4 w-4' />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
            Payment History
          </h1>
          <p className='text-gray-600 dark:text-gray-300'>
            View all your course purchases and transaction details
          </p>
        </div>

        {/* Summary Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Total Spent
                </p>
                <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                  $
                  {paymentHistory?.transactions
                    .filter((t) => t.paymentStatus === 'SUCCESS')
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toFixed(2) || '0.00'}
                </p>
              </div>
              <div className='bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full'>
                <DollarSign className='h-6 w-6 text-blue-600 dark:text-blue-400' />
              </div>
            </div>
          </div>

          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Successful Payments
                </p>
                <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                  {paymentHistory?.transactions.filter(
                    (t) => t.paymentStatus === 'SUCCESS'
                  ).length || 0}
                </p>
              </div>
              <div className='bg-green-100 dark:bg-green-900/30 p-3 rounded-full'>
                <CreditCard className='h-6 w-6 text-green-600 dark:text-green-400' />
              </div>
            </div>
          </div>

          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Total Transactions
                </p>
                <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                  {paymentHistory?.pagination.totalTransactions || 0}
                </p>
              </div>
              <div className='bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full'>
                <Calendar className='h-6 w-6 text-purple-600 dark:text-purple-400' />
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden'>
          <div className='p-6 border-b dark:border-gray-700'>
            <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
              Transaction History
            </h2>
          </div>

          {paymentHistory?.transactions.length === 0 ? (
            <div className='p-8 text-center'>
              <CreditCard className='h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                No transactions yet
              </h3>
              <p className='text-gray-600 dark:text-gray-300 mb-6'>
                You haven't made any course purchases yet.
              </p>
              <Link
                to='/courses'
                className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700'
              >
                Browse Courses
              </Link>
            </div>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-gray-50 dark:bg-gray-700'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Course
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Amount
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Status
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Date
                      </th>
                      {/* <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Transaction ID
                      </th> */}
                      <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                    {paymentHistory?.transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className='hover:bg-gray-50 dark:hover:bg-gray-700'
                      >
                        <td className='px-6 py-4'>
                          <div>
                            <div className='text-sm font-medium text-gray-900 dark:text-white'>
                              {formatPurchasedItemForDisplay(
                                transaction.purchasedItem || 'Course Purchase'
                              )}
                            </div>
                            <div className='text-sm text-gray-500 dark:text-gray-400'>
                              via {transaction.gateway}
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm font-medium text-gray-900 dark:text-white'>
                            ${transaction.amount.toFixed(2)}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              transaction.paymentStatus
                            )}`}
                          >
                            {transaction.paymentStatus}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                          {formatDate(transaction.createdAt)}
                        </td>
                        {/* <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm font-mono text-gray-900 dark:text-white'>
                            {transaction.transactionId?.slice(-8) || 'N/A'}
                          </div>
                        </td> */}
                        <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                          <div className='flex items-center justify-end space-x-2'>
                            <button
                              onClick={() => {
                                // Show transaction details modal
                                console.log(
                                  'View transaction:',
                                  transaction.id
                                );
                              }}
                              className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
                            >
                              <Eye className='h-4 w-4' />
                            </button>
                            <button
                              onClick={() => {
                                // Download receipt
                                console.log(
                                  'Download receipt for:',
                                  transaction.id
                                );
                              }}
                              className='text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                            >
                              <Download className='h-4 w-4' />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {paymentHistory && paymentHistory.pagination.totalPages > 1 && (
                <div className='px-6 py-4 border-t dark:border-gray-700'>
                  <div className='flex items-center justify-between'>
                    <div className='text-sm text-gray-700 dark:text-gray-300'>
                      Showing{' '}
                      {(paymentHistory.pagination.currentPage - 1) *
                        paymentHistory.pagination.limit +
                        1}{' '}
                      to{' '}
                      {Math.min(
                        paymentHistory.pagination.currentPage *
                          paymentHistory.pagination.limit,
                        paymentHistory.pagination.totalTransactions
                      )}{' '}
                      of {paymentHistory.pagination.totalTransactions} results
                    </div>
                    <div className='flex items-center space-x-2'>
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={!paymentHistory.pagination.hasPrevPage}
                        className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700'
                      >
                        Previous
                      </button>
                      <span className='px-4 py-2 text-gray-600 dark:text-gray-300'>
                        Page {paymentHistory.pagination.currentPage} of{' '}
                        {paymentHistory.pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={!paymentHistory.pagination.hasNextPage}
                        className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700'
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
