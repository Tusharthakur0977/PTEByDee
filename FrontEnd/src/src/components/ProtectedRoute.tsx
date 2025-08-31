import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  redirectTo = '/login',
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    // Save the attempted location for redirecting after login
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }

  if (requireAdmin && user && user.role !== 'ADMIN') {
    // User is authenticated but not an admin
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-red-600 mb-4'>
            Access Denied
          </h1>
          <p className='text-gray-600 mb-4'>
            You don't have permission to access this page.
          </p>
          <Link
            to='/dashboard'
            className='text-blue-600 hover:text-blue-800'
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!requireAuth && user) {
    // If user is logged in and trying to access auth pages, redirect to dashboard
    return (
      <Navigate
        to='/dashboard'
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
