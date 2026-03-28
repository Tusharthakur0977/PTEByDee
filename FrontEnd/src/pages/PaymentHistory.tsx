import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  Receipt,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { PaymentHistory as PaymentHistoryType } from '../services/payment';
import { getPaymentHistory } from '../services/payment';
import { formatPurchasedItemForDisplay } from '../utils/paymentUtils';

const panelClass =
  'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';

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
      setError(null);
      const data = await getPaymentHistory(page, 10);
      setPaymentHistory(data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to fetch payment history',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20';
      case 'pending':
        return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20';
      case 'failed':
        return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20';
      default:
        return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700';
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-50 px-4 dark:bg-slate-950'>
        <div className='rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900'>
          <h1 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
            Authentication required
          </h1>
          <Link
            to='/login'
            className='mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950'>
        <div className='h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-50 px-4 dark:bg-slate-950'>
        <div className='rounded-2xl border border-red-200 bg-white px-6 py-5 text-center shadow-sm dark:border-red-900/40 dark:bg-slate-900'>
          <h1 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
            Payment history unavailable
          </h1>
          <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>
            {error}
          </p>
          <button
            onClick={() => fetchPaymentHistory(currentPage)}
            className='mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const successfulTransactions =
    paymentHistory?.transactions.filter((t) => t.paymentStatus === 'SUCCESS') ||
    [];
  const totalSpent = successfulTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  );
  const totalTransactions = paymentHistory?.pagination.totalTransactions || 0;

  const summaryCards = [
    {
      label: 'Total Spent',
      value: `$${totalSpent.toFixed(2)}`,
      meta: 'Successful payments only',
      icon: DollarSign,
    },
    {
      label: 'Successful Payments',
      value: `${successfulTransactions.length}`,
      meta: 'Completed transactions',
      icon: CreditCard,
    },
    {
      label: 'Total Transactions',
      value: `${totalTransactions}`,
      meta: 'Across all payment states',
      icon: Calendar,
    },
  ];

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        <div className='mb-6 grid gap-4 xl:grid-cols-[1.35fr_0.9fr]'>
          <div className='rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950'>
            <Link
              to='/dashboard'
              className='inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
            >
              <ArrowLeft className='h-4 w-4' />
              <span>Back to Dashboard</span>
            </Link>
            <div className='mt-6'>
              <p className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                Payment History
              </p>
              <h1 className='mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl'>
                Purchases and transactions
              </h1>
              <p className='mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400'>
                Review your course purchases, payment status, and transaction
                activity in one place.
              </p>
            </div>
          </div>

          <div className={`${panelClass} p-5`}>
            <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
              Quick Access
            </h2>
            <div className='mt-4 space-y-3'>
              <Link
                to='/courses'
                className='inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              >
                <span className='inline-flex items-center gap-2'>
                  <BookOpen className='h-4 w-4' />
                  Browse Courses
                </span>
                <ArrowLeft className='h-4 w-4 rotate-180' />
              </Link>
              <Link
                to='/dashboard'
                className='inline-flex w-full items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
              >
                <span className='inline-flex items-center gap-2'>
                  <Receipt className='h-4 w-4' />
                  Return to Dashboard
                </span>
                <ArrowLeft className='h-4 w-4' />
              </Link>
            </div>
          </div>
        </div>

        <div className='mb-6 grid gap-4 md:grid-cols-3'>
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className={`${panelClass} p-5`}
              >
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <p className='text-sm font-medium text-slate-500 dark:text-slate-400'>
                      {card.label}
                    </p>
                    <p className='mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100'>
                      {card.value}
                    </p>
                  </div>
                  <div className='rounded-xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200'>
                    <Icon className='h-5 w-5' />
                  </div>
                </div>
                <p className='mt-4 text-sm text-slate-500 dark:text-slate-400'>
                  {card.meta}
                </p>
              </div>
            );
          })}
        </div>

        <div className={`${panelClass} overflow-hidden`}>
          <div className='border-b border-slate-200 p-5 dark:border-slate-800'>
            <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
              Transactions
            </h2>
            <p className='mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100'>
              {totalTransactions} records
            </p>
          </div>

          {paymentHistory?.transactions.length === 0 ? (
            <div className='p-10 text-center'>
              <CreditCard className='mx-auto mb-4 h-14 w-14 text-slate-300 dark:text-slate-700' />
              <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
                No transactions yet
              </h3>
              <p className='mt-2 text-sm text-slate-500 dark:text-slate-400'>
                You have not made any course purchases yet.
              </p>
              <Link
                to='/courses'
                className='mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
              >
                Browse Courses
              </Link>
            </div>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <table className='min-w-full'>
                  <thead className='bg-slate-50 dark:bg-slate-950'>
                    <tr>
                      {['Course', 'Amount', 'Status', 'Date'].map((label) => (
                        <th
                          key={label}
                          className='px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'
                        >
                          {label}
                        </th>
                      ))}
                      <th className='px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900'>
                    {paymentHistory?.transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className='transition-colors hover:bg-slate-50 dark:hover:bg-slate-950'
                      >
                        <td className='px-6 py-4'>
                          <div>
                            <div className='text-sm font-medium text-slate-900 dark:text-slate-100'>
                              {formatPurchasedItemForDisplay(
                                transaction.purchasedItem || 'Course Purchase',
                              )}
                            </div>
                            <div className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
                              via {transaction.gateway}
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm font-medium text-slate-900 dark:text-slate-100'>
                            ${transaction.amount.toFixed(2)}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(
                              transaction.paymentStatus,
                            )}`}
                          >
                            {transaction.paymentStatus}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400'>
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-right'>
                          <div className='flex items-center justify-end gap-1'>
                            <button
                              onClick={() => {
                                console.log(
                                  'View transaction:',
                                  transaction.id,
                                );
                              }}
                              className='rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                            >
                              <Eye className='h-4 w-4' />
                            </button>
                            <button
                              onClick={() => {
                                console.log(
                                  'Download receipt for:',
                                  transaction.id,
                                );
                              }}
                              className='rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
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

              {paymentHistory && paymentHistory.pagination.totalPages > 1 && (
                <div className='border-t border-slate-200 px-6 py-4 dark:border-slate-800'>
                  <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
                    <div className='text-sm text-slate-500 dark:text-slate-400'>
                      Showing{' '}
                      {(paymentHistory.pagination.currentPage - 1) *
                        paymentHistory.pagination.limit +
                        1}{' '}
                      to{' '}
                      {Math.min(
                        paymentHistory.pagination.currentPage *
                          paymentHistory.pagination.limit,
                        paymentHistory.pagination.totalTransactions,
                      )}{' '}
                      of {paymentHistory.pagination.totalTransactions} results
                    </div>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={!paymentHistory.pagination.hasPrevPage}
                        className='rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                      >
                        Previous
                      </button>
                      <span className='px-2 py-2 text-sm text-slate-500 dark:text-slate-400'>
                        Page {paymentHistory.pagination.currentPage} of{' '}
                        {paymentHistory.pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={!paymentHistory.pagination.hasNextPage}
                        className='rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
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
