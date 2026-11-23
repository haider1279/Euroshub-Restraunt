import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import { Order, Reservation } from '../../types';
import { formatDate, formatTime } from '../../utils/date';
import { StatusBadge } from '../../components/ui/Badge';
import { Skeleton, LoadingStatus } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { SectionHeader } from '../../components/ui/Section';
import { ChangePasswordCard } from '../../components/auth/ChangePasswordCard';
import { OrderRow } from '../../components/account/OrderRow';

/** /account/settings: profile details and password. */
const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-8">
      <section aria-labelledby="profile-title" className="rounded-lg border border-line bg-surface p-5 sm:p-6">
        <h2 id="profile-title" className="font-serif text-xl text-ink">
          Profile
        </h2>
        <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Name</dt>
            <dd className="mt-1 text-ink">{user?.name}</dd>
          </div>
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="mt-1 break-all text-ink">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-muted">Phone</dt>
            <dd className="mt-1 text-ink">{user?.phone || 'Not added'}</dd>
          </div>
        </dl>
      </section>
      <ChangePasswordCard />
    </div>
  );
};

export const AccountOverviewPage: React.FC = () => {
  const location = useLocation();

  // Fetch recent customer orders
  const { data: ordersData, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['customerRecentOrders'],
    queryFn: () => apiRequest<{ orders: Order[] }>('/orders?pageSize=3'),
  });

  // Fetch customer reservations
  const { data: resData, isLoading: isResLoading } = useQuery({
    queryKey: ['customerReservations'],
    queryFn: () => apiRequest<{ reservations: Reservation[] }>('/reservations'),
  });

  if (location.pathname === '/account/settings') return <AccountSettings />;

  const recentOrders = ordersData?.orders || [];
  const reservations = resData?.reservations || [];
  const upcomingReservations = reservations.filter(
    (r) => new Date(r.date).getTime() >= Date.now() && r.status !== 'CANCELLED'
  );

  return (
    <div className="space-y-14">
      <section aria-labelledby="recent-orders">
        <SectionHeader id="recent-orders" title="Recent orders" action={{ label: 'All orders', to: '/account/orders' }} />
        <div className="mt-5">
          {isOrdersLoading ? (
            <div className="space-y-3">
              <LoadingStatus label="Loading orders" />
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-28 w-full rounded-lg" />
            </div>
          ) : recentOrders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              description="When you place an order, you can follow it here."
              actionLabel="Browse the menu"
              actionHref="/menu"
            />
          ) : (
            <ul className="space-y-3">
              {recentOrders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="upcoming-res">
        <SectionHeader id="upcoming-res" title="Upcoming bookings" action={{ label: 'All reservations', to: '/account/reservations' }} />
        <div className="mt-5">
          {isResLoading ? (
            <Skeleton className="h-20 w-full rounded-lg" />
          ) : upcomingReservations.length === 0 ? (
            <EmptyState compact title="No upcoming bookings" actionLabel="Book a table" actionHref="/reservation" />
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
              {upcomingReservations.slice(0, 2).map((res) => (
                <li key={res.id} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5">
                  <div>
                    <p className="text-base text-ink">
                      {formatDate(res.date)} · {formatTime(res.date)}
                    </p>
                    <p className="tabular mt-0.5 text-sm text-muted">
                      {res.partySize} {res.partySize === 1 ? 'guest' : 'guests'}
                    </p>
                  </div>
                  <StatusBadge status={res.status} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <p className="text-sm text-muted">
        Need to change your password?{' '}
        <Link to="/account/settings" className="inline-flex min-h-11 items-center text-ink underline underline-offset-4">
          Go to settings
        </Link>
      </p>
    </div>
  );
};
