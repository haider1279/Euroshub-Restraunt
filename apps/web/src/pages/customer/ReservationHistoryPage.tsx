import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { Reservation } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Calendar, Clock, Users, Plus, AlertCircle } from 'lucide-react';

export const ReservationHistoryPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customerReservationsList'],
    queryFn: () => apiRequest<{ reservations: Reservation[] }>('/reservations'),
  });

  const reservations = data?.reservations || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-bistro-border gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-charcoal">Table Reservations</h2>
          <p className="text-xs text-charcoal-500 mt-0.5">
            View your upcoming and historical restaurant bookings.
          </p>
        </div>
        <Link to="/reservation">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            New Reservation
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-sm mx-auto">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-xs text-red-700 mb-4 font-medium">Failed to load reservations.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : reservations.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-7 h-7" />}
          title="No reservations found"
          description="You have not reserved a table with us yet. Reserve a table for lunch or dinner in seconds."
          actionLabel="Book a Table"
          actionHref="/reservation"
        />
      ) : (
        <div className="space-y-3">
          {reservations.map((res) => {
            const isUpcoming = new Date(res.date).getTime() >= Date.now();
            return (
              <Card
                key={res.id}
                className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isUpcoming ? 'border-terracotta-200 bg-white' : 'bg-charcoal-50/40'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="font-semibold text-sm text-charcoal">
                      {new Date(res.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <Badge variant={res.status.toLowerCase() as any} dot>
                      {res.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-charcoal-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-charcoal-400" />
                      {new Date(res.date).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-charcoal-400" />
                      {res.partySize} {res.partySize === 1 ? 'Guest' : 'Guests'}
                    </span>
                  </div>
                  {res.notes && (
                    <p className="text-xs text-charcoal-600 italic mt-2 bg-bistro-bg/70 p-2 rounded border border-bistro-border">
                      Note: "{res.notes}"
                    </p>
                  )}
                </div>

                <div className="text-right text-xs text-charcoal-400">
                  {isUpcoming ? (
                    <span className="text-olive font-semibold bg-olive-50 px-2 py-1 rounded border border-olive-200">
                      Upcoming Visit
                    </span>
                  ) : (
                    <span>Past Reservation</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
