import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
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
      await fetchStatus();
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
      <div
        className={`rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${className}`}
      >
        <div className='flex animate-pulse items-center space-x-3'>
          <div className='h-4 w-4 rounded-full bg-slate-300 dark:bg-slate-700' />
          <div className='h-4 w-32 rounded bg-slate-300 dark:bg-slate-700' />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${className}`}
      >
        <div className='flex items-center space-x-3'>
          <XCircle className='h-5 w-5 text-slate-500 dark:text-slate-400' />
          <span className='text-slate-700 dark:text-slate-300'>{error}</span>
        </div>
      </div>
    );
  }

  const hasIssues = status?.issues?.length > 0;

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center space-x-3'>
          {hasIssues ? (
            <AlertTriangle className='h-5 w-5 text-amber-500 dark:text-amber-400' />
          ) : (
            <CheckCircle className='h-5 w-5 text-emerald-500 dark:text-emerald-400' />
          )}
          <div>
            <h4 className='font-medium text-slate-900 dark:text-slate-100'>
              Stripe Products Status
            </h4>
            <p className='text-sm text-slate-600 dark:text-slate-400'>
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
            className='inline-flex items-center space-x-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
          >
            {isSyncing ? (
              <>
                <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-white dark:border-slate-900' />
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
          <h5 className='text-sm font-medium text-slate-900 dark:text-slate-100'>
            Courses needing attention:
          </h5>
          <div className='space-y-1'>
            {status.issues.slice(0, 5).map((issue: any, index: number) => (
              <div
                key={index}
                className='text-xs text-slate-600 dark:text-slate-400'
              >
                - {issue.title}: {issue.issue}
              </div>
            ))}
            {status.issues.length > 5 && (
              <div className='text-xs text-slate-500 dark:text-slate-500'>
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
