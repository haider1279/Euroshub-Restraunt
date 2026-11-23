import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { formatCurrency } from '../../utils/currency';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatusBadge, humanize } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/EmptyState';
import { Order, Reservation } from '../../types';
import { formatDate, formatTime } from '../../utils/date';

interface DashboardStats {
  todayRevenue: number;
  totalOrders: number;
  activeOrders: number;
  pendingReservations: number;
  totalCustomers: number;
  reviewCount?: number;
  avgRating: number;
  revenueByDay: { date: string; revenue: number; orders: number }[];
  recentOrders: Order[];
  recentReservations: Reservation[];
}

// Chart colors read from the design tokens (Recharts needs literal values).
const CHART = {
  bar: 'rgb(61 245 166 / 0.75)',
  grid: 'rgb(238 246 243 / 0.08)',
  tick: 'rgb(238 246 243 / 0.66)',
  tooltipBg: '#102230',
  tooltipBorder: 'rgb(238 246 243 / 0.16)',
};

const compactRupees = (val: number) =>
  val >= 1000 ? `Rs ${(val / 1000).toFixed(val >= 10000 ? 0 : 1)}k` : `Rs ${val}`;

const Panel: React.FC<{ title: string; action?: { label: string; to: string }; children: React.ReactNode }> = ({ title, action, children }) => (
  <section className="rounded-lg border border-line bg-surface">
    <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
      <h2 className="font-sans text-sm font-medium text-ink">{title}</h2>
      {action && (
        <Link to={action.to} className="inline-flex min-h-11 items-center text-sm text-muted hover:text-ink sm:min-h-0">
          {action.label}
        </Link>
      )}
    </div>
    {children}
  </section>
);

export default function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery<DashboardStats>({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiRequest('/admin/dashboard'),
    refetchInterval: 30_000,
  });

  const hasReviews = (data?.reviewCount ?? 0) > 0 && Number(data?.avgRating) > 0;

  const stats = [
    { label: 'Revenue today', value: data ? formatCurrency(data.todayRevenue) : '—' },
    { label: 'Active orders', value: data ? String(data.activeOrders) : '—' },
    { label: 'Total orders', value: data ? String(data.totalOrders) : '—' },
    { label: 'Pending bookings', value: data ? String(data.pendingReservations) : '—' },
    { label: 'Customers', value: data ? String(data.totalCustomers) : '—' },
    {
      label: 'Average rating',
      value: hasReviews ? `${Number(data?.avgRating).toFixed(1)} / 5` : 'No reviews',
      hint: hasReviews ? `${data?.reviewCount} reviews` : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-ink">Overview</h1>
          <p className="mt-1 text-sm text-muted">Refreshes every 30 seconds.</p>
        </div>
      </div>

      {isError && <ErrorState title="Couldn’t load the dashboard" onRetry={() => refetch()} />}

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface p-4 sm:p-5">
            <dt className="text-xs uppercase tracking-[0.08em] text-muted">{s.label}</dt>
            <dd className="tabular mt-2 text-xl text-ink">{isLoading ? <Skeleton className="h-7 w-20" /> : s.value}</dd>
            {s.hint && <dd className="mt-0.5 text-xs text-muted">{s.hint}</dd>}
          </div>
        ))}
      </dl>

      <Panel title="Revenue, last 7 days">
        <div className="p-4 sm:p-5">
          {isLoading ? (
            <Skeleton className="h-56 w-full" />
          ) : (data?.revenueByDay || []).length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">No revenue recorded in the last 7 days.</p>
          ) : (
            <div role="img" aria-label="Bar chart of revenue for the last 7 days">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data?.revenueByDay || []} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={CHART.grid} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: CHART.tick }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 12, fill: CHART.tick }}
                    tickFormatter={compactRupees}
                    axisLine={false}
                    tickLine={false}
                    width={64}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgb(238 246 243 / 0.04)' }}
                    formatter={(val: number) => [formatCurrency(val), 'Revenue']}
                    contentStyle={{
                      background: CHART.tooltipBg,
                      border: `1px solid ${CHART.tooltipBorder}`,
                      borderRadius: 8,
                      fontSize: 13,
                      color: '#EEF6F3',
                    }}
                    labelStyle={{ color: CHART.tick }}
                    itemStyle={{ color: '#EEF6F3' }}
                  />
                  <Bar dataKey="revenue" fill={CHART.bar} radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Recent orders" action={{ label: 'All orders', to: '/admin/orders' }}>
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (data?.recentOrders || []).length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {(data?.recentOrders || []).map((order) => (
                <li key={order.id}>
                  <Link to={`/admin/orders/${order.id}`} className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-ink/[0.03]">
                    <div className="min-w-0">
                      <p className="tabular font-mono text-sm text-ink">#{order.orderNumber}</p>
                      <p className="truncate text-sm text-muted">
                        {order.customer?.name || 'Walk-in'} · {humanize(order.type)}
                        {order.tableNumber ? ` · Table ${order.tableNumber}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="tabular text-sm text-ink">{formatCurrency(order.total)}</span>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent bookings" action={{ label: 'All bookings', to: '/admin/reservations' }}>
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (data?.recentReservations || []).length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">No bookings yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {(data?.recentReservations || []).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">{r.customer?.name}</p>
                    <p className="tabular text-sm text-muted">
                      {formatDate(r.date)} · {formatTime(r.date)} · {r.partySize} {r.partySize === 1 ? 'guest' : 'guests'}
                    </p>
                  </div>
                  <StatusBadge status={r.status} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
