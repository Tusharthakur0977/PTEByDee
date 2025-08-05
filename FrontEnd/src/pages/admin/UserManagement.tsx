import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Calendar,
  Award,
  BookOpen,
  Target,
} from 'lucide-react';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  type User,
  type UserFilters,
} from '../../services/admin';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: '',
    isVerified: false,
  });

  // Filters
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 10,
    search: '',
    role: '',
    provider: '',
    isVerified: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getAllUsers(filters);
      if (response.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
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

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await updateUser(selectedUser.id, editFormData);
      if (response.success) {
        setUsers(
          users.map((u) => (u.id === selectedUser.id ? response.data : u))
        );
        setShowEditModal(false);
        setSelectedUser(null);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await deleteUser(selectedUser.id);
      if (response.success) {
        setUsers(users.filter((u) => u.id !== selectedUser.id));
        setShowDeleteModal(false);
        setSelectedUser(null);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleViewUserDetails = async (user: User) => {
    try {
      const response = await getUserById(user.id);
      if (response.success) {
        setSelectedUser(response.data);
        setShowUserDetailModal(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch user details');
    }
  };

  const getRoleColor = (role: string) => {
    return role === 'ADMIN'
      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'GOOGLE':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'EMAIL_OTP':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
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
              fetchUsers();
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
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <div>
              <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white'>
                User Management
              </h1>
              <p className='text-gray-600 dark:text-gray-300 mt-1'>
                Manage platform users and their permissions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 py-8'>
        {/* Filters */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'>
            <div className='sm:col-span-2'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
                <input
                  type='text'
                  placeholder='Search users...'
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                />
              </div>
            </div>

            <div>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              >
                <option value=''>All Roles</option>
                <option value='USER'>User</option>
                <option value='ADMIN'>Admin</option>
              </select>
            </div>

            <div>
              <select
                value={filters.provider}
                onChange={(e) => handleFilterChange('provider', e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              >
                <option value=''>All Providers</option>
                <option value='EMAIL_OTP'>Email OTP</option>
                <option value='GOOGLE'>Google</option>
              </select>
            </div>

            <div>
              <select
                value={filters.sortBy + '-' + filters.sortOrder}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              >
                <option value='createdAt-desc'>Newest First</option>
                <option value='createdAt-asc'>Oldest First</option>
                <option value='name-asc'>Name A-Z</option>
                <option value='name-desc'>Name Z-A</option>
                <option value='email-asc'>Email A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden'>
          <div className='p-4 sm:p-6 border-b dark:border-gray-700'>
            <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
              Users ({pagination?.totalUsers || 0})
            </h2>
          </div>

          {isLoading ? (
            <div className='p-8 text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
              <p className='text-gray-600 dark:text-gray-300 mt-2'>
                Loading users...
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className='p-8 text-center'>
              <Users className='h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                No users found
              </h3>
              <p className='text-gray-600 dark:text-gray-300'>
                No users match your current filters
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className='block sm:hidden'>
                <div className='divide-y divide-gray-200 dark:divide-gray-700'>
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className='p-4'
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex items-start space-x-3'>
                          <div className='bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold'>
                            {user.name.charAt(0)}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <h3 className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                              {user.name}
                            </h3>
                            <p className='text-sm text-gray-500 dark:text-gray-400 truncate'>
                              {user.email}
                            </p>
                            <div className='flex flex-wrap gap-1 mt-2'>
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                                  user.role
                                )}`}
                              >
                                {user.role}
                              </span>
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getProviderColor(
                                  user.provider
                                )}`}
                              >
                                {user.provider}
                              </span>
                              {user.isVerified ? (
                                <span className='inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'>
                                  <UserCheck className='h-3 w-3 mr-1' />
                                  Verified
                                </span>
                              ) : (
                                <span className='inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'>
                                  <UserX className='h-3 w-3 mr-1' />
                                  Unverified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className='flex items-center space-x-1'>
                          <button
                            onClick={() => handleViewUserDetails(user)}
                            className='p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
                          >
                            <Eye className='h-4 w-4' />
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className='p-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300'
                          >
                            <Edit className='h-4 w-4' />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
                            className='p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300'
                          >
                            <Trash2 className='h-4 w-4' />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className='hidden sm:block overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-gray-50 dark:bg-gray-700'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        User
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Role
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Provider
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Status
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Enrollments
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Joined
                      </th>
                      <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className='hover:bg-gray-50 dark:hover:bg-gray-700'
                      >
                        <td className='px-6 py-4'>
                          <div className='flex items-center space-x-3'>
                            <div className='bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold'>
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className='text-sm font-medium text-gray-900 dark:text-white'>
                                {user.name}
                              </div>
                              <div className='text-sm text-gray-500 dark:text-gray-400'>
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                              user.role
                            )}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getProviderColor(
                              user.provider
                            )}`}
                          >
                            {user.provider}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          {user.isVerified ? (
                            <span className='inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'>
                              <UserCheck className='h-3 w-3 mr-1' />
                              Verified
                            </span>
                          ) : (
                            <span className='inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'>
                              <UserX className='h-3 w-3 mr-1' />
                              Unverified
                            </span>
                          )}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white'>
                          {user._count?.courses || 0}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                          <div className='flex items-center justify-end space-x-2'>
                            <button
                              onClick={() => handleViewUserDetails(user)}
                              className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
                            >
                              <Eye className='h-4 w-4' />
                            </button>
                            <button
                              onClick={() => handleEditUser(user)}
                              className='text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300'
                            >
                              <Edit className='h-4 w-4' />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteModal(true);
                              }}
                              className='text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300'
                            >
                              <Trash2 className='h-4 w-4' />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className='px-4 sm:px-6 py-4 border-t dark:border-gray-700'>
                  <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
                    <div className='text-sm text-gray-700 dark:text-gray-300'>
                      Showing{' '}
                      {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
                      {Math.min(
                        pagination.currentPage * pagination.limit,
                        pagination.totalUsers
                      )}{' '}
                      of {pagination.totalUsers} results
                    </div>
                    <div className='flex items-center space-x-2'>
                      <button
                        onClick={() =>
                          handlePageChange(pagination.currentPage - 1)
                        }
                        disabled={!pagination.hasPrevPage}
                        className='p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700'
                      >
                        <ChevronLeft className='h-4 w-4' />
                      </button>

                      <div className='hidden sm:flex items-center space-x-1'>
                        {Array.from(
                          { length: Math.min(5, pagination.totalPages) },
                          (_, i) => {
                            const page = i + 1;
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-2 rounded-lg text-sm ${
                                  pagination.currentPage === page
                                    ? 'bg-blue-600 text-white'
                                    : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          }
                        )}
                      </div>

                      <button
                        onClick={() =>
                          handlePageChange(pagination.currentPage + 1)
                        }
                        disabled={!pagination.hasNextPage}
                        className='p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700'
                      >
                        <ChevronRight className='h-4 w-4' />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full'>
            <h3 className='text-lg font-bold text-gray-900 dark:text-white mb-4'>
              Edit User
            </h3>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Name
                </label>
                <input
                  type='text'
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Email
                </label>
                <input
                  type='email'
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Role
                </label>
                <select
                  value={editFormData.role}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, role: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                >
                  <option value='USER'>User</option>
                  <option value='ADMIN'>Admin</option>
                </select>
              </div>
              <div className='flex items-center'>
                <input
                  type='checkbox'
                  checked={editFormData.isVerified}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      isVerified: e.target.checked,
                    })
                  }
                  className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <label className='ml-2 text-sm text-gray-700 dark:text-gray-300'>
                  Email Verified
                </label>
              </div>
            </div>
            <div className='flex items-center justify-end space-x-3 mt-6'>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className='px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200'
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {showUserDetailModal && selectedUser && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
                User Details
              </h3>
              <button
                onClick={() => {
                  setShowUserDetailModal(false);
                  setSelectedUser(null);
                }}
                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              >
                ×
              </button>
            </div>

            <div className='space-y-6'>
              {/* User Info */}
              <div className='flex items-start space-x-4'>
                <div className='bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold'>
                  {selectedUser.name.charAt(0)}
                </div>
                <div className='flex-1'>
                  <h4 className='text-lg font-semibold text-gray-900 dark:text-white'>
                    {selectedUser.name}
                  </h4>
                  <p className='text-gray-600 dark:text-gray-300'>
                    {selectedUser.email}
                  </p>
                  <div className='flex flex-wrap gap-2 mt-2'>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                        selectedUser.role
                      )}`}
                    >
                      {selectedUser.role}
                    </span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getProviderColor(
                        selectedUser.provider
                      )}`}
                    >
                      {selectedUser.provider}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              {selectedUser.stats && (
                <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
                  <div className='text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                    <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                      {selectedUser.stats.totalEnrollments}
                    </div>
                    <div className='text-sm text-gray-600 dark:text-gray-300'>
                      Enrollments
                    </div>
                  </div>
                  <div className='text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
                    <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
                      {selectedUser.stats.completedCourses}
                    </div>
                    <div className='text-sm text-gray-600 dark:text-gray-300'>
                      Completed
                    </div>
                  </div>
                  <div className='text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
                    <div className='text-2xl font-bold text-purple-600 dark:text-purple-400'>
                      {Math.round(selectedUser.stats.averageTestScore)}
                    </div>
                    <div className='text-sm text-gray-600 dark:text-gray-300'>
                      Avg Score
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Enrollments */}
              {selectedUser.courses && selectedUser.courses.length > 0 && (
                <div>
                  <h5 className='text-md font-semibold text-gray-900 dark:text-white mb-3'>
                    Recent Enrollments
                  </h5>
                  <div className='space-y-2'>
                    {selectedUser.courses.slice(0, 5).map((enrollment: any) => (
                      <div
                        key={enrollment.id}
                        className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'
                      >
                        <div>
                          <h6 className='text-sm font-medium text-gray-900 dark:text-white'>
                            {enrollment.course.title}
                          </h6>
                          <p className='text-xs text-gray-500 dark:text-gray-400'>
                            Enrolled{' '}
                            {new Date(
                              enrollment.enrolledAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className='text-right'>
                          <div className='text-sm font-medium text-gray-900 dark:text-white'>
                            {Math.round(enrollment.progress)}%
                          </div>
                          <div className='text-xs text-gray-500 dark:text-gray-400'>
                            {enrollment.completed ? 'Completed' : 'In Progress'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full'>
            <h3 className='text-lg font-bold text-gray-900 dark:text-white mb-4'>
              Confirm Delete
            </h3>
            <p className='text-gray-600 dark:text-gray-300 mb-6'>
              Are you sure you want to delete user "{selectedUser.name}"? This
              action cannot be undone.
            </p>
            <div className='flex items-center justify-end space-x-3'>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className='px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200'
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
