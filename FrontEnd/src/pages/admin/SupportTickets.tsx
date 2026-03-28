import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LifeBuoy,
  Mail,
  Search,
} from 'lucide-react';
import {
  getAllSupportTickets,
  getSupportTicketById,
  updateSupportTicketStatus,
  type SupportTicket,
  type SupportTicketFilters,
  type SupportTicketStatus,
} from '../../services/admin';

const statusOptions: SupportTicketStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
];

const panelClass =
  'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';
const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-800';
const statusPillClass: Record<SupportTicketStatus, string> = {
  OPEN: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
  RESOLVED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
  CLOSED: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
};

const SupportTickets: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    ticketId: string;
    ticketNumber: string;
    currentStatus: SupportTicketStatus;
    nextStatus: SupportTicketStatus;
  } | null>(null);

  const [filters, setFilters] = useState<SupportTicketFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getAllSupportTickets(filters);
      if (response.success) {
        setTickets(response.data.tickets);
        setPagination(response.data.pagination);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch support tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleViewDetails = async (ticket: SupportTicket) => {
    try {
      const response = await getSupportTicketById(ticket.id);
      if (response.success) {
        setSelectedTicket(response.data);
        setShowDetailModal(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch support ticket details');
    }
  };

  const handleStatusUpdate = async (ticketId: string, status: SupportTicketStatus) => {
    try {
      setUpdatingTicketId(ticketId);
      const response = await updateSupportTicketStatus(ticketId, status);
      if (response.success) {
        setTickets((current) => current.map((ticket) => (ticket.id === ticketId ? response.data : ticket)));
        setSelectedTicket((current) => (current && current.id === ticketId ? response.data : current));
        await fetchTickets();
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update support ticket status');
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const openStatusConfirmation = (ticket: SupportTicket, nextStatus: SupportTicketStatus) => {
    if (ticket.status === nextStatus) return;
    setPendingStatusChange({
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      currentStatus: ticket.status,
      nextStatus,
    });
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    await handleStatusUpdate(pendingStatusChange.ticketId, pendingStatusChange.nextStatus);
    setPendingStatusChange(null);
  };

  if (error && !tickets.length) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-50 px-4 dark:bg-slate-950'>
        <div className='rounded-2xl border border-red-200 bg-white px-6 py-5 text-center shadow-sm dark:border-red-900/40 dark:bg-slate-900'>
          <h1 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Support queue unavailable</h1>
          <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchTickets();
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
      <div className='mx-auto max-w-7xl overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8'>
        <div className={`${panelClass} overflow-hidden`}>
          <div className='border-b border-slate-200 p-5 dark:border-slate-800'>
            <div className='flex flex-col gap-4'>
              <div>
                <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>Support tickets</h2>
                <p className='mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100'>{pagination?.totalTickets || 0} records</p>
              </div>

              <div className='grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,220px)_minmax(0,220px)]'>
                <div>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400' />
                    <input type='text' placeholder='Search by ticket, name, email, or subject' value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} className={`${inputClass} pl-10 pr-4`} />
                  </div>
                </div>
                <div>
                  <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className={inputClass}>
                    <option value=''>All Statuses</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-');
                      setFilters((prev) => ({ ...prev, sortBy, sortOrder: sortOrder as 'asc' | 'desc', page: 1 }));
                    }}
                    className={inputClass}
                  >
                    <option value='createdAt-desc'>Newest First</option>
                    <option value='createdAt-asc'>Oldest First</option>
                    <option value='updatedAt-desc'>Recently Updated</option>
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
              <p className='mt-3 text-sm text-slate-500 dark:text-slate-400'>Loading support tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className='p-10 text-center'>
              <LifeBuoy className='mx-auto mb-4 h-14 w-14 text-slate-300 dark:text-slate-700' />
              <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>No support tickets found</h3>
              <p className='mt-2 text-sm text-slate-500 dark:text-slate-400'>No tickets match your current filters.</p>
            </div>
          ) : (
            <>
              <div className='block lg:hidden divide-y divide-slate-200 dark:divide-slate-800'>
                {tickets.map((ticket) => (
                  <div key={ticket.id} className='p-4 space-y-3'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0 flex-1'>
                        <p className='break-all text-sm font-semibold text-slate-900 dark:text-slate-100'>{ticket.ticketNumber}</p>
                        <h3 className='mt-1 break-words font-medium text-slate-900 dark:text-slate-100'>{ticket.subject}</h3>
                        <p className='mt-1 break-all text-sm text-slate-500 dark:text-slate-400'>{ticket.name} | {ticket.email}</p>
                      </div>
                      <button onClick={() => handleViewDetails(ticket)} className='rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'>View details</button>
                    </div>
                    <div className='flex items-start justify-between gap-3'>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusPillClass[ticket.status]}`}>{ticket.status.replace('_', ' ')}</span>
                      <select
                        value={ticket.status}
                        onChange={(e) => openStatusConfirmation(ticket, e.target.value as SupportTicketStatus)}
                        disabled={updatingTicketId === ticket.id || ticket.status === 'CLOSED'}
                        className={`${inputClass} min-w-0 max-w-[170px] flex-shrink`}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>{status.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className='hidden lg:block overflow-x-auto'>
                <table className='min-w-full table-fixed'>
                  <thead className='bg-slate-50 dark:bg-slate-950'>
                    <tr>
                      {['Ticket', 'User', 'Subject', 'Status', 'Created'].map((label) => (
                        <th key={label} className='px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>{label}</th>
                      ))}
                      <th className='px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900'>
                    {tickets.map((ticket) => (
                      <tr key={ticket.id} className='transition-colors hover:bg-slate-50 dark:hover:bg-slate-950'>
                        <td className='px-6 py-4 align-top'>
                          <div>
                            <div className='break-all text-sm font-semibold text-slate-900 dark:text-slate-100'>{ticket.ticketNumber}</div>
                            <div className='mt-1 text-sm text-slate-500 dark:text-slate-400'>{ticket.user ? 'Linked account' : 'Guest submission'}</div>
                          </div>
                        </td>
                        <td className='px-6 py-4 align-top'>
                          <div className='break-words text-sm font-medium text-slate-900 dark:text-slate-100'>{ticket.name}</div>
                          <div className='mt-1 break-all text-sm text-slate-500 dark:text-slate-400'>{ticket.email}</div>
                        </td>
                        <td className='px-6 py-4 align-top'>
                          <div className='max-w-[260px] break-words text-sm text-slate-900 dark:text-slate-100'>{ticket.subject}</div>
                        </td>
                        <td className='px-6 py-4 align-top'>
                          <div className='flex min-w-0 flex-col items-start gap-2 xl:flex-row xl:items-center'>
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusPillClass[ticket.status]}`}>{ticket.status.replace('_', ' ')}</span>
                            <select
                              value={ticket.status}
                              onChange={(e) => openStatusConfirmation(ticket, e.target.value as SupportTicketStatus)}
                              disabled={updatingTicketId === ticket.id || ticket.status === 'CLOSED'}
                              className='min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60 xl:w-[150px] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-800'
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>{status.replace('_', ' ')}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className='px-6 py-4 align-top text-sm text-slate-500 dark:text-slate-400'>{new Date(ticket.createdAt).toLocaleString()}</td>
                        <td className='px-6 py-4 align-top text-right'>
                          <button onClick={() => handleViewDetails(ticket)} className='rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'>View details</button>
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
                      Showing {(pagination.currentPage - 1) * pagination.limit + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalTickets)} of {pagination.totalTickets} results
                    </div>
                    <div className='flex items-center gap-2'>
                      <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={!pagination.hasPrevPage} className='rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'>
                        <ChevronLeft className='h-4 w-4' />
                      </button>
                      <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={!pagination.hasNextPage} className='rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'>
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

      {showDetailModal && selectedTicket && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm'>
          <div className='max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h3 className='text-xl font-semibold text-slate-900 dark:text-slate-100'>{selectedTicket.ticketNumber}</h3>
                <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>Support ticket details</p>
              </div>
              <button onClick={() => { setShowDetailModal(false); setSelectedTicket(null); }} className='rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'>Close</button>
            </div>

            <div className='mt-6 grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950'>
                <p className='text-sm text-slate-500 dark:text-slate-400'>Name</p>
                <p className='mt-2 font-medium text-slate-900 dark:text-slate-100'>{selectedTicket.name}</p>
              </div>
              <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950'>
                <p className='text-sm text-slate-500 dark:text-slate-400'>Email</p>
                <div className='mt-2 flex items-center gap-2'>
                  <Mail className='h-4 w-4 text-slate-500 dark:text-slate-400' />
                  <a href={`mailto:${selectedTicket.email}`} className='font-medium text-slate-900 hover:underline dark:text-slate-100'>
                    {selectedTicket.email}
                  </a>
                </div>
              </div>
              <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950'>
                <p className='text-sm text-slate-500 dark:text-slate-400'>Status</p>
                <div className='mt-2 flex items-center gap-3'>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusPillClass[selectedTicket.status]}`}>{selectedTicket.status.replace('_', ' ')}</span>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => openStatusConfirmation(selectedTicket, e.target.value as SupportTicketStatus)}
                    disabled={updatingTicketId === selectedTicket.id || selectedTicket.status === 'CLOSED'}
                    className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-800'
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950'>
                <p className='text-sm text-slate-500 dark:text-slate-400'>Submitted</p>
                <p className='mt-2 font-medium text-slate-900 dark:text-slate-100'>{new Date(selectedTicket.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className='mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950'>
              <p className='text-sm text-slate-500 dark:text-slate-400'>Subject</p>
              <p className='mt-2 font-medium text-slate-900 dark:text-slate-100'>{selectedTicket.subject}</p>
            </div>

            <div className='mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950'>
              <p className='text-sm text-slate-500 dark:text-slate-400'>Message</p>
              <p className='mt-3 whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300'>{selectedTicket.message}</p>
            </div>

            {selectedTicket.user && (
              <div className='mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950'>
                <p className='text-sm text-slate-500 dark:text-slate-400'>Linked user account</p>
                <p className='mt-2 font-medium text-slate-900 dark:text-slate-100'>{selectedTicket.user.name}</p>
                <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>{selectedTicket.user.email}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {pendingStatusChange && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm'>
          <div className='w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900'>
            <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>Confirm status change</h3>
            <p className='mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400'>
              Change ticket <span className='font-medium text-slate-900 dark:text-slate-100'>{pendingStatusChange.ticketNumber}</span> from <span className='font-medium text-slate-900 dark:text-slate-100'>{pendingStatusChange.currentStatus.replace('_', ' ')}</span> to <span className='font-medium text-slate-900 dark:text-slate-100'>{pendingStatusChange.nextStatus.replace('_', ' ')}</span>?
            </p>
            {(pendingStatusChange.nextStatus === 'RESOLVED' || pendingStatusChange.nextStatus === 'CLOSED') && (
              <p className='mt-3 text-sm text-slate-500 dark:text-slate-400'>The user will receive an email update for this status change.</p>
            )}
            <div className='mt-6 flex items-center justify-end gap-3'>
              <button onClick={() => setPendingStatusChange(null)} className='rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'>Cancel</button>
              <button
                onClick={confirmStatusChange}
                disabled={updatingTicketId === pendingStatusChange.ticketId}
                className='inline-flex min-w-[110px] items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
              >
                {updatingTicketId === pendingStatusChange.ticketId ? (
                  <span className='flex items-center gap-2'>
                    <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-400/40 dark:border-t-slate-900'></span>
                    <span>Saving...</span>
                  </span>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
