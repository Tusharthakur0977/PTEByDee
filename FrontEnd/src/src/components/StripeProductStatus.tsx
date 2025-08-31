import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '../services/api';

interface StripeProductStatusProps {
  className?: string;
}

const StripeProductStatus: React.FC<StripeProductStatusProps> = ({
  className = '',
}) => {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/admin/stripe/verify-products');
      setStatus(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setError(null);
      const response = await api.post('/admin/stripe/sync-products');

      // Refresh status after sync
      await fetchStatus();

      // Show success message
      alert(
        `Sync completed! ${response.data.data.synced} courses synced successfully.`
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sync products');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className='animate-pulse flex items-center space-x-3'>
          <div className='w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full'></div>
          <div className='h-4 bg-gray-300 dark:bg-gray-600 rounded w-32'></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}
      >
        <div className='flex items-center space-x-3'>
          <XCircle className='h-5 w-5 text-red-600 dark:text-red-400' />
          <span className='text-red-700 dark:text-red-400'>{error}</span>
        </div>
      </div>
    );
  }

  const hasIssues = status?.issues?.length > 0;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border ${
        hasIssues
          ? 'border-yellow-200 dark:border-yellow-800'
          : 'border-green-200 dark:border-green-800'
      } p-4 ${className}`}
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          {hasIssues ? (
            <AlertTriangle className='h-5 w-5 text-yellow-600 dark:text-yellow-400' />
          ) : (
            <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />
          )}
          <div>
            <h4 className='font-medium text-gray-900 dark:text-white'>
              Stripe Products Status
            </h4>
            <p className='text-sm text-gray-600 dark:text-gray-300'>
              {hasIssues
                ? `${status.issues.length} courses need Stripe products`
                : `All ${status.totalPaidCourses} paid courses have Stripe products`}
            </p>
          </div>
        </div>

        {hasIssues && (
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50'
          >
            {isSyncing ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <RefreshCw className='h-4 w-4' />
                <span>Sync Products</span>
              </>
            )}
          </button>
        )}
      </div>

      {hasIssues && (
        <div className='mt-4 space-y-2'>
          <h5 className='text-sm font-medium text-gray-900 dark:text-white'>
            Courses needing attention:
          </h5>
          <div className='space-y-1'>
            {status.issues.slice(0, 5).map((issue: any, index: number) => (
              <div
                key={index}
                className='text-xs text-gray-600 dark:text-gray-400'
              >
                • {issue.title}: {issue.issue}
              </div>
            ))}
            {status.issues.length > 5 && (
              <div className='text-xs text-gray-500 dark:text-gray-500'>
                ... and {status.issues.length - 5} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StripeProductStatus;
