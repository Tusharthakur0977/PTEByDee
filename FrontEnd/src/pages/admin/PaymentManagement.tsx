import {
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
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

const PaymentManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <CheckCircle className='h-4 w-4' />;
      case 'pending':
        return <Clock className='h-4 w-4' />;
      case 'failed':
        return <XCircle className='h-4 w-4' />;
      default:
        return <CreditCard className='h-4 w-4' />;
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

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-red-600 mb-4'>Error</h1>
          <p className='text-gray-600 mb-4'>{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchData();
            }}
            className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Header */}
      <div className='bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700'>
        <div className='container mx-auto px-4 py-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                Payment Management
              </h1>
              <p className='text-gray-600 dark:text-gray-300 mt-1'>
                Monitor transactions, revenue, and payment analytics
              </p>
            </div>
            <button
              onClick={fetchData}
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2'
            >
              <RefreshCw className='h-4 w-4' />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 py-8'>
        {/* Payment Statistics */}
        {stats && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    Total Revenue
                  </p>
                  <p className='text-3xl font-bold text-gray-900 dark:text-white'>
                    ${stats.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <div className='bg-green-100 dark:bg-green-900/30 p-3 rounded-full'>
                  <DollarSign className='h-6 w-6 text-green-600 dark:text-green-400' />
                </div>
              </div>
              <div className='mt-4 text-sm text-green-600 dark:text-green-400'>
                ${stats.revenueThisMonth.toFixed(2)} this month
              </div>
            </div>

            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    Total Transactions
                  </p>
                  <p className='text-3xl font-bold text-gray-900 dark:text-white'>
                    {stats.totalTransactions}
                  </p>
                </div>
                <div className='bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full'>
                  <CreditCard className='h-6 w-6 text-blue-600 dark:text-blue-400' />
                </div>
              </div>
              <div className='mt-4 text-sm text-blue-600 dark:text-blue-400'>
                {stats.transactionsThisMonth} this month
              </div>
            </div>

            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    Success Rate
                  </p>
                  <p className='text-3xl font-bold text-gray-900 dark:text-white'>
                    {Math.round(
                      (stats.successfulTransactions / stats.totalTransactions) *
                        100
                    )}
                    %
                  </p>
                </div>
                <div className='bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full'>
                  <TrendingUp className='h-6 w-6 text-purple-600 dark:text-purple-400' />
                </div>
              </div>
              <div className='mt-4 text-sm text-gray-600 dark:text-gray-400'>
                {stats.successfulTransactions} successful
              </div>
            </div>

            <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    Avg Order Value
                  </p>
                  <p className='text-3xl font-bold text-gray-900 dark:text-white'>
                    ${stats.averageOrderValue.toFixed(2)}
                  </p>
                </div>
                <div className='bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full'>
                  <Users className='h-6 w-6 text-orange-600 dark:text-orange-400' />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
            <div className='md:col-span-2'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
                <input
                  type='text'
                  placeholder='Search transactions...'
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                />
              </div>
            </div>

            <div>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
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
                onChange={(e) => handleFilterChange('gateway', e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
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
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              >
                <option value='createdAt-desc'>Newest First</option>
                <option value='createdAt-asc'>Oldest First</option>
                <option value='amount-desc'>Amount High-Low</option>
                <option value='amount-asc'>Amount Low-High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden'>
          <div className='p-6 border-b dark:border-gray-700'>
            <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
              Transactions ({pagination?.totalTransactions || 0})
            </h2>
          </div>

          {isLoading ? (
            <div className='p-8 text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
              <p className='text-gray-600 dark:text-gray-300 mt-2'>
                Loading transactions...
              </p>
            </div>
          ) : transactions.length === 0 ? (
            <div className='p-8 text-center'>
              <CreditCard className='h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                No transactions found
              </h3>
              <p className='text-gray-600 dark:text-gray-300'>
                No transactions match your current filters
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50 dark:bg-gray-700'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                      Transaction
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                      User
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                      Amount
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                      Status
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                      Gateway
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                      Date
                    </th>
                    <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className='hover:bg-gray-50 dark:hover:bg-gray-700'
                    >
                      <td className='px-6 py-4'>
                        <div>
                          <div className='text-sm font-medium text-gray-900 dark:text-white'>
                            {transaction.purchasedItem || 'Course Purchase'}
                          </div>
                          <div className='text-sm text-gray-500 dark:text-gray-400 font-mono'>
                            {transaction.transactionId?.slice(-8) || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div>
                          <div className='text-sm font-medium text-gray-900 dark:text-white'>
                            {transaction.user.name}
                          </div>
                          <div className='text-sm text-gray-500 dark:text-gray-400'>
                            {transaction.user.email}
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
                          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            transaction.paymentStatus
                          )}`}
                        >
                          {getStatusIcon(transaction.paymentStatus)}
                          <span className='ml-1'>
                            {transaction.paymentStatus}
                          </span>
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                        {transaction.gateway}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                        <div className='flex items-center justify-end space-x-2'>
                          <button className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'>
                            <Eye className='h-4 w-4' />
                          </button>
                          <button className='text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'>
                            <Download className='h-4 w-4' />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
