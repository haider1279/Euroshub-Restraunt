import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { Reservation } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { ButtonLink } from '../../components/ui/Button';
import { Skeleton, LoadingStatus } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { formatDate, formatTime } from '../../utils/date';
import { cn } from '../../utils/cn';

export const ReservationHistoryPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customerReservationsList'],
    queryFn: () => apiRequest<{ reservations: Reservation[] }>('/reservations'),
  });

  const reservations = data?.reservations || [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-ink">Reservations</h2>
          <p className="mt-1 text-sm text-muted">Upcoming and past table bookings.</p>
        </div>
        <ButtonLink to="/reservation" size="sm" variant="secondary">
          New booking
        </ButtonLink>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            <LoadingStatus label="Loading reservations" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState title="Couldn’t load your reservations" onRetry={() => refetch()} />
        ) : reservations.length === 0 ? (
          <EmptyState title="No bookings yet" description="Book a table and it will show up here." actionLabel="Book a table" actionHref="/reservation" />
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
            {reservations.map((res) => {
              const isUpcoming = new Date(res.date).getTime() >= Date.now();
              return (
                <li key={res.id} className={cn('p-4 sm:px-5', !isUpcoming && 'opacity-70')}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base text-ink">
                        {formatDate(res.date)} · {formatTime(res.date)}
                      </p>
                      <p className="tabular mt-0.5 text-sm text-muted">
                        {res.partySize} {res.partySize === 1 ? 'guest' : 'guests'}
                        {res.tableNumber ? ` · Table ${res.tableNumber}` : ''}
                        {isUpcoming ? '' : ' · Past'}
                      </p>
                    </div>
                    <StatusBadge status={res.status} size="sm" />
                  </div>
                  {res.notes && <p className="mt-3 border-l-2 border-line-strong pl-3 text-sm text-muted">{res.notes}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
