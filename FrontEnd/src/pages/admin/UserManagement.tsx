import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  type User,
  type UserFilters,
} from '../../services/admin';

const panelClass =
  'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';
const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-800';
const iconButtonClass =
  'rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100';

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
        setUsers((current) =>
          current.map((user) =>
            user.id === selectedUser.id ? response.data : user,
          ),
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
        setUsers((current) =>
          current.filter((user) => user.id !== selectedUser.id),
        );
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

  const getRoleColor = (role: string) =>
    role === 'ADMIN'
      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
      : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700';

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'GOOGLE':
        return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20';
      case 'EMAIL_OTP':
        return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20';
      default:
        return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700';
    }
  };

  const getVerificationTone = (isVerified: boolean) =>
    isVerified
      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20'
      : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700';

  if (error && !users.length) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-50 px-4 dark:bg-slate-950'>
        <div className='rounded-2xl border border-red-200 bg-white px-6 py-5 text-center shadow-sm dark:border-red-900/40 dark:bg-slate-900'>
          <h1 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
            Users unavailable
          </h1>
          <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>
            {error}
          </p>
          <button
            onClick={() => {
              setError(null);
              fetchUsers();
            }}
            className='mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        <div className={`${panelClass} overflow-hidden`}>
          <div className='border-b border-slate-200 p-5 dark:border-slate-800'>
            <div className='flex flex-col gap-4'>
              <div>
                <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                  Users
                </h2>
                <p className='mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100'>
                  {pagination?.totalUsers || 0} records
                </p>
              </div>

              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5'>
                <div className='sm:col-span-2'>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400' />
                    <input
                      type='text'
                      placeholder='Search users...'
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className={`${inputClass} pl-10 pr-4`}
                    />
                  </div>
                </div>

                <div>
                  <select
                    value={filters.role}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                    className={inputClass}
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
                    className={inputClass}
                  >
                    <option value=''>All Providers</option>
                    <option value='EMAIL_OTP'>Email OTP</option>
                    <option value='GOOGLE'>Google</option>
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
                    className={inputClass}
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
                Loading users...
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className='p-10 text-center'>
              <Users className='mx-auto mb-4 h-14 w-14 text-slate-300 dark:text-slate-700' />
              <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
                No users found
              </h3>
              <p className='mt-2 text-sm text-slate-500 dark:text-slate-400'>
                No users match your current filters.
              </p>
            </div>
          ) : (
            <>
              <div className='block sm:hidden'>
                <div className='divide-y divide-slate-200 dark:divide-slate-800'>
                  {users.map((user) => (
                    <div key={user.id} className='p-4'>
                      <div className='flex items-start justify-between gap-3'>
                        <div className='flex min-w-0 items-start gap-3'>
                          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900'>
                            {user.name.charAt(0)}
                          </div>
                          <div className='min-w-0'>
                            <p className='truncate text-sm font-medium text-slate-900 dark:text-slate-100'>
                              {user.name}
                            </p>
                            <p className='truncate text-sm text-slate-500 dark:text-slate-400'>
                              {user.email}
                            </p>
                            <div className='mt-2 flex flex-wrap gap-2'>
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getRoleColor(user.role)}`}>
                                {user.role}
                              </span>
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getProviderColor(user.provider)}`}>
                                {user.provider}
                              </span>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${getVerificationTone(user.isVerified)}`}>
                                {user.isVerified ? <UserCheck className='h-3.5 w-3.5' /> : <UserX className='h-3.5 w-3.5' />}
                                <span>{user.isVerified ? 'Verified' : 'Unverified'}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className='flex shrink-0 items-center gap-1'>
                          <button onClick={() => handleViewUserDetails(user)} className={iconButtonClass}>
                            <Eye className='h-4 w-4' />
                          </button>
                          <button onClick={() => handleEditUser(user)} className={iconButtonClass}>
                            <Edit className='h-4 w-4' />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
                            className={`${iconButtonClass} hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-300`}
                          >
                            <Trash2 className='h-4 w-4' />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='hidden sm:block overflow-x-auto'>
                <table className='min-w-full'>
                  <thead className='bg-slate-50 dark:bg-slate-950'>
                    <tr>
                      {['User', 'Role', 'Provider', 'Status', 'Enrollments', 'Joined'].map((label) => (
                        <th key={label} className='px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                          {label}
                        </th>
                      ))}
                      <th className='px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900'>
                    {users.map((user) => (
                      <tr key={user.id} className='transition-colors hover:bg-slate-50 dark:hover:bg-slate-950'>
                        <td className='px-6 py-4'>
                          <div className='flex items-center gap-3'>
                            <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900'>
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className='text-sm font-medium text-slate-900 dark:text-slate-100'>{user.name}</div>
                              <div className='mt-1 text-sm text-slate-500 dark:text-slate-400'>{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getRoleColor(user.role)}`}>{user.role}</span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getProviderColor(user.provider)}`}>{user.provider}</span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${getVerificationTone(user.isVerified)}`}>
                            {user.isVerified ? <UserCheck className='h-3.5 w-3.5' /> : <UserX className='h-3.5 w-3.5' />}
                            <span>{user.isVerified ? 'Verified' : 'Unverified'}</span>
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100'>
                          {user._count?.courses || 0}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400'>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-right'>
                          <div className='flex items-center justify-end gap-1'>
                            <button onClick={() => handleViewUserDetails(user)} className={iconButtonClass}>
                              <Eye className='h-4 w-4' />
                            </button>
                            <button onClick={() => handleEditUser(user)} className={iconButtonClass}>
                              <Edit className='h-4 w-4' />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteModal(true);
                              }}
                              className={`${iconButtonClass} hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-300`}
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

              {pagination && pagination.totalPages > 1 && (
                <div className='border-t border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-6'>
                  <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
                    <div className='text-sm text-slate-500 dark:text-slate-400'>
                      Showing {(pagination.currentPage - 1) * pagination.limit + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalUsers)} of {pagination.totalUsers} results
                    </div>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrevPage}
                        className='rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                      >
                        <ChevronLeft className='h-4 w-4' />
                      </button>
                      <div className='hidden items-center gap-1 sm:flex'>
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const page = i + 1;
                          const isActive = pagination.currentPage === page;
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                                isActive
                                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                        className='rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
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

      {showEditModal && selectedUser && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm'>
          <div className='w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900'>
            <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Edit user</h3>
            <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>Update access and verification details.</p>
            <div className='mt-6 space-y-4'>
              <div>
                <label className='mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300'>Name</label>
                <input type='text' value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className='mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300'>Email</label>
                <input type='email' value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className='mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300'>Role</label>
                <select value={editFormData.role} onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })} className={inputClass}>
                  <option value='USER'>User</option>
                  <option value='ADMIN'>Admin</option>
                </select>
              </div>
              <label className='flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'>
                <input
                  type='checkbox'
                  checked={editFormData.isVerified}
                  onChange={(e) => setEditFormData({ ...editFormData, isVerified: e.target.checked })}
                  className='h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-700'
                />
                <span>Email verified</span>
              </label>
            </div>
            <div className='mt-6 flex items-center justify-end gap-3'>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className='rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              >
                Cancel
              </button>
              <button onClick={handleUpdateUser} className='rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'>
                Update user
              </button>
            </div>
          </div>
        </div>
      )}

      {showUserDetailModal && selectedUser && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm'>
          <div className='max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex items-start gap-4'>
                <div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white dark:bg-slate-100 dark:text-slate-900'>
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className='text-xl font-semibold text-slate-900 dark:text-slate-100'>{selectedUser.name}</h3>
                  <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>{selectedUser.email}</p>
                  <div className='mt-3 flex flex-wrap gap-2'>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getRoleColor(selectedUser.role)}`}>{selectedUser.role}</span>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getProviderColor(selectedUser.provider)}`}>{selectedUser.provider}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUserDetailModal(false);
                  setSelectedUser(null);
                }}
                className='rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              >
                Close
              </button>
            </div>

            {selectedUser.stats && (
              <div className='mt-6 grid gap-4 sm:grid-cols-3'>
                <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950'>
                  <p className='text-sm text-slate-500 dark:text-slate-400'>Enrollments</p>
                  <p className='mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100'>{selectedUser.stats.totalEnrollments}</p>
                </div>
                <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950'>
                  <p className='text-sm text-slate-500 dark:text-slate-400'>Completed</p>
                  <p className='mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100'>{selectedUser.stats.completedCourses}</p>
                </div>
                <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950'>
                  <p className='text-sm text-slate-500 dark:text-slate-400'>Avg score</p>
                  <p className='mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100'>{Math.round(selectedUser.stats.averageTestScore)}</p>
                </div>
              </div>
            )}

            {selectedUser.courses && selectedUser.courses.length > 0 && (
              <div className='mt-6'>
                <h4 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>Recent enrollments</h4>
                <div className='mt-4 space-y-3'>
                  {selectedUser.courses.slice(0, 5).map((enrollment: any) => (
                    <div key={enrollment.id} className='flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950'>
                      <div>
                        <p className='text-sm font-medium text-slate-900 dark:text-slate-100'>{enrollment.course.title}</p>
                        <p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}</p>
                      </div>
                      <div className='text-right'>
                        <p className='text-sm font-medium text-slate-900 dark:text-slate-100'>{Math.round(enrollment.progress)}%</p>
                        <p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>{enrollment.completed ? 'Completed' : 'In Progress'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showDeleteModal && selectedUser && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm'>
          <div className='w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900'>
            <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Delete user</h3>
            <p className='mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400'>
              Delete <span className='font-medium'>{selectedUser.name}</span>. This action cannot be undone.
            </p>
            <div className='mt-6 flex items-center justify-end gap-3'>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className='rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              >
                Cancel
              </button>
              <button onClick={handleDeleteUser} className='rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700'>
                Delete user
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
