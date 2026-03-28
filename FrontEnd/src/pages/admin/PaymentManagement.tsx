import {
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Eye,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getAllTransactions, getPaymentStats } from '../../services/admin';

interface Transaction {
  id: string;
  amount: number;
  paymentStatus: string;
  gateway: string;
  transactionId?: string;
  orderId?: string;
  purchasedItem?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface PaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  averageOrderValue: number;
  revenueThisMonth: number;
  transactionsThisMonth: number;
}

const panelClass =
  'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';

const PaymentManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    gateway: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [transactionsResponse, statsResponse] = await Promise.all([
        getAllTransactions(filters),
        getPaymentStats(),
      ]);

      if (transactionsResponse.success) {
        setTransactions(transactionsResponse.data.transactions);
        setPagination(transactionsResponse.data.pagination);
      }

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch payment data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value,
    }));
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusTone = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return {
          icon: CheckCircle,
          className:
            'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
        };
      case 'pending':
        return {
          icon: Clock,
          className:
            'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
        };
      case 'failed':
        return {
          icon: XCircle,
          className:
            'bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
        };
      default:
        return {
          icon: CreditCard,
          className:
            'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
        };
    }
  };

  if (error && !stats && !transactions.length) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4'>
        <div className='rounded-2xl border border-red-200 bg-white px-6 py-5 text-center shadow-sm dark:border-red-900/40 dark:bg-slate-900'>
          <h1 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
            Payments unavailable
          </h1>
          <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>
            {error}
          </p>
          <button
            onClick={() => {
              setError(null);
              fetchData();
            }}
            className='mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const successRate =
    stats && stats.totalTransactions > 0
      ? Math.round((stats.successfulTransactions / stats.totalTransactions) * 100)
      : 0;

  const statCards = stats
    ? [
        {
          label: 'Revenue',
          value: formatCurrency(stats.totalRevenue),
          meta: `${formatCurrency(stats.revenueThisMonth)} this month`,
          icon: TrendingUp,
        },
        {
          label: 'Transactions',
          value: `${stats.totalTransactions}`,
          meta: `${stats.transactionsThisMonth} this month`,
          icon: CreditCard,
        },
        {
          label: 'Success Rate',
          value: `${successRate}%`,
          meta: `${stats.successfulTransactions} successful`,
          icon: CheckCircle,
        },
        {
          label: 'Avg Order Value',
          value: formatCurrency(stats.averageOrderValue),
          meta: `${stats.pendingTransactions} pending / ${stats.failedTransactions} failed`,
          icon: Users,
        },
      ]
    : [];

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        {stats && (
          <div className='mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            {statCards.map((card) => {
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
        )}

        <div className={`${panelClass} overflow-hidden`}>
          <div className='border-b border-slate-200 p-5 dark:border-slate-800'>
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
                <div>
                  <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                    Transactions
                  </h2>
                  <p className='mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100'>
                    {pagination?.totalTransactions || 0} records
                  </p>
                </div>
                <button
                  onClick={fetchData}
                  className='inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                >
                  <RefreshCw className='h-4 w-4' />
                  <span>Refresh</span>
                </button>
              </div>

              <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5'>
                <div className='md:col-span-2'>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400' />
                    <input
                      type='text'
                      placeholder='Search transactions...'
                      value={filters.search}
                      onChange={(e) =>
                        handleFilterChange('search', e.target.value)
                      }
                      className='w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-800'
                    />
                  </div>
                </div>

                <div>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      handleFilterChange('status', e.target.value)
                    }
                    className='w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-800'
                  >
                    <option value=''>All Status</option>
                    <option value='SUCCESS'>Success</option>
                    <option value='PENDING'>Pending</option>
                    <option value='FAILED'>Failed</option>
                  </select>
                </div>

                <div>
                  <select
                    value={filters.gateway}
                    onChange={(e) =>
                      handleFilterChange('gateway', e.target.value)
                    }
                    className='w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-800'
                  >
                    <option value=''>All Gateways</option>
                    <option value='Stripe'>Stripe</option>
                  </select>
                </div>

                <div>
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-');
                      handleFilterChange('sortBy', sortBy);
                      handleFilterChange('sortOrder', sortOrder);
                    }}
                    className='w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-800'
                  >
                    <option value='createdAt-desc'>Newest First</option>
                    <option value='createdAt-asc'>Oldest First</option>
                    <option value='amount-desc'>Amount High-Low</option>
                    <option value='amount-asc'>Amount Low-High</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className='border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300'>
              {error}
            </div>
          )}

          {isLoading ? (
            <div className='p-10 text-center'>
              <div className='mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100' />
              <p className='mt-3 text-sm text-slate-500 dark:text-slate-400'>
                Loading transactions...
              </p>
            </div>
          ) : transactions.length === 0 ? (
            <div className='p-10 text-center'>
              <CreditCard className='mx-auto mb-4 h-14 w-14 text-slate-300 dark:text-slate-700' />
              <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
                No transactions found
              </h3>
              <p className='mt-2 text-sm text-slate-500 dark:text-slate-400'>
                No transactions match your current filters.
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='min-w-full'>
                <thead className='bg-slate-50 dark:bg-slate-950'>
                  <tr>
                    <th className='px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                      Transaction
                    </th>
                    <th className='px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                      User
                    </th>
                    <th className='px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                      Amount
                    </th>
                    <th className='px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                      Status
                    </th>
                    <th className='px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                      Gateway
                    </th>
                    <th className='px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                      Date
                    </th>
                    <th className='px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900'>
                  {transactions.map((transaction) => {
                    const statusTone = getStatusTone(transaction.paymentStatus);
                    const StatusIcon = statusTone.icon;

                    return (
                      <tr
                        key={transaction.id}
                        className='transition-colors hover:bg-slate-50 dark:hover:bg-slate-950'
                      >
                        <td className='px-6 py-4'>
                          <div>
                            <div className='text-sm font-medium text-slate-900 dark:text-slate-100'>
                              {transaction.purchasedItem || 'Course Purchase'}
                            </div>
                            <div className='mt-1 text-xs font-mono text-slate-500 dark:text-slate-400'>
                              {transaction.transactionId?.slice(-8) || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div>
                            <div className='text-sm font-medium text-slate-900 dark:text-slate-100'>
                              {transaction.user.name}
                            </div>
                            <div className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
                              {transaction.user.email}
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm font-semibold text-slate-900 dark:text-slate-100'>
                            {formatCurrency(transaction.amount)}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusTone.className}`}
                          >
                            <StatusIcon className='h-3.5 w-3.5' />
                            <span>{transaction.paymentStatus}</span>
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300'>
                          {transaction.gateway}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400'>
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-right'>
                          <div className='flex items-center justify-end gap-1'>
                            <button className='rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'>
                              <Eye className='h-4 w-4' />
                            </button>
                            <button className='rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'>
                              <Download className='h-4 w-4' />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentManagement;
