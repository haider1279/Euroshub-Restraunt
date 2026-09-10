import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { Reservation, ReservationStatus } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { RefreshCcw, CalendarCheck, Users, Phone, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'COMPLETED', label: 'Completed' },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CANCELLED: 'danger',
  COMPLETED: 'info',
};

const NEXT_STATUSES: Record<ReservationStatus, ReservationStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  CANCELLED: [],
  COMPLETED: [],
};

export default function AdminReservationsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery<{ reservations: Reservation[]; total: number; pages: number }>({
    queryKey: ['admin-reservations', status, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (status) params.set('status', status);
      return apiRequest(`/admin/reservations?${params}`);
    },
    refetchInterval: 30_000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) =>
      apiRequest(`/admin/reservations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
      toast.success('Reservation status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal">Reservations</h1>
          <p className="text-stone-500 mt-1">{data?.total ?? 0} reservations total</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()} id="refresh-reservations-btn">
          <RefreshCcw className="w-4 h-4 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v: any) => { setStatus(typeof v === 'string' ? v : v?.target?.value || ''); setPage(1); }}
          className="w-44"
          id="reservation-status-filter"
        />
      </div>

      {/* Reservations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isLoading
          ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)
          : (data?.reservations || []).map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-charcoal">{r.customer?.name}</p>
                    <p className="text-xs text-stone-400">{r.customer?.email}</p>
                  </div>
                  <Badge variant={STATUS_BADGE[r.status] as any} size="sm">{r.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1.5 text-stone-600">
                    <CalendarCheck className="w-3.5 h-3.5 text-terracotta flex-shrink-0" />
                    <span>{new Date(r.date).toLocaleDateString('en-GB', {
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                    })}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-600">
                    <Users className="w-3.5 h-3.5 text-terracotta flex-shrink-0" />
                    <span>Party of {r.partySize}</span>
                  </div>
                  {r.customer?.phone && (
                    <div className="flex items-center gap-1.5 text-stone-500 text-xs">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      {r.customer.phone}
                    </div>
                  )}
                  {r.notes && (
                    <div className="flex items-start gap-1.5 text-stone-500 text-xs col-span-2">
                      <MessageSquare className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span className="italic">"{r.notes}"</span>
                    </div>
                  )}
                </div>
                {NEXT_STATUSES[r.status].length > 0 && (
                  <div className="flex gap-2 pt-1 border-t border-stone-100">
                    {NEXT_STATUSES[r.status].map((next) => (
                      <button
                        key={next}
                        id={`reservation-${r.id}-${next}`}
                        onClick={() => updateStatus.mutate({ id: r.id, newStatus: next })}
                        disabled={updateStatus.isPending}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                          next === 'CANCELLED'
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-terracotta/10 text-terracotta hover:bg-terracotta hover:text-white'
                        }`}
                      >
                        → {next}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
      </div>

      {(data?.reservations || []).length === 0 && !isLoading && (
        <div className="text-center py-12 text-stone-400">No reservations found.</div>
      )}

      {/* Pagination */}
      {(data?.pages || 1) > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} id="prev-page-btn">
            Previous
          </Button>
          <span className="text-sm text-stone-500">Page {page} of {data?.pages}</span>
          <Button variant="secondary" size="sm" disabled={page === data?.pages} onClick={() => setPage(p => p + 1)} id="next-page-btn">
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
