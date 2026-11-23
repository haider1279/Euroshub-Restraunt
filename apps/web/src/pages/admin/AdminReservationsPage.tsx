import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '../../api/client';
import { Reservation, ReservationStatus } from '../../types';
import { StatusBadge, humanize } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { TableShell, THead, Th, Td, Tr, TableMessage, RowAction, Pager } from '../../components/ui/DataTable';
import { formatDate, formatTime } from '../../utils/date';

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

  const rows = data?.reservations || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-ink">Reservations</h1>
          <p className="tabular mt-1 text-sm text-muted">{data?.total ?? 0} total · refreshes every 30 seconds</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()} id="refresh-reservations-btn" leftIcon={<RefreshCcw className="h-4 w-4" />}>
          Refresh
        </Button>
      </div>

      <div className="max-w-[220px]">
        <Select
          aria-label="Filter by status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v: any) => { setStatus(typeof v === 'string' ? v : v?.target?.value || ''); setPage(1); }}
          id="reservation-status-filter"
        />
      </div>

      <TableShell>
        <THead>
          <tr>
            <Th>Guest</Th>
            <Th>When</Th>
            <Th className="text-right">Party</Th>
            <Th>Notes</Th>
            <Th>Status</Th>
            <Th>Move to</Th>
          </tr>
        </THead>
        <tbody>
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <tr key={i} className="border-b border-line">
                {[...Array(6)].map((_, j) => (
                  <Td key={j}>
                    <Skeleton className="h-5 w-full" />
                  </Td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <TableMessage colSpan={6}>{status ? 'No reservations with this status.' : 'No reservations yet.'}</TableMessage>
          ) : (
            rows.map((r) => (
              <Tr key={r.id}>
                <Td>
                  <div className="text-ink">{r.customer?.name}</div>
                  <div className="text-xs text-muted">{r.customer?.phone || r.customer?.email}</div>
                </Td>
                <Td className="tabular whitespace-nowrap">
                  <div className="text-ink">{formatDate(r.date)}</div>
                  <div className="text-xs text-muted">{formatTime(r.date)}</div>
                </Td>
                <Td className="tabular text-right">{r.partySize}</Td>
                <Td className="max-w-[260px] text-muted">
                  <span className="line-clamp-2">{r.notes || '—'}</span>
                </Td>
                <Td>
                  <StatusBadge status={r.status} size="sm" />
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1.5">
                    {NEXT_STATUSES[r.status].map((next) => (
                      <RowAction
                        key={next}
                        id={`reservation-${r.id}-${next}`}
                        tone={next === 'CANCELLED' ? 'danger' : 'default'}
                        onClick={() => updateStatus.mutate({ id: r.id, newStatus: next })}
                        disabled={updateStatus.isPending}
                      >
                        {next === 'CANCELLED' ? 'Cancel' : humanize(next)}
                      </RowAction>
                    ))}
                    {NEXT_STATUSES[r.status].length === 0 && <span className="text-xs text-muted">Closed</span>}
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </TableShell>

      <Pager page={page} pages={data?.pages || 1} onChange={setPage} />
    </div>
  );
}
