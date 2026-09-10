import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { formatCurrency } from '../../utils/currency';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ShoppingBag,
  Users,
  CalendarCheck,
  TrendingUp,
  Clock,
  Star,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Order, Reservation } from '../../types';

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

const statusColors: Record<string, string> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PREPARING: 'warning',
  READY: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiRequest('/admin/dashboard'),
    refetchInterval: 30_000,
  });

  const hasReviews = (data?.reviewCount ?? 0) > 0 && Number(data?.avgRating) > 0;

  const statCards = [
    {
      label: "Today's Revenue",
      value: data ? formatCurrency(data.todayRevenue) : '—',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Total Orders',
      value: data ? String(data.totalOrders) : '—',
      icon: ShoppingBag,
      color: 'text-terracotta',
      bg: 'bg-terracotta/10',
    },
    {
      label: 'Active Orders',
      value: data ? String(data.activeOrders) : '—',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Pending Bookings',
      value: data ? String(data.pendingReservations) : '—',
      icon: CalendarCheck,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Registered Customers',
      value: data ? String(data.totalCustomers) : '—',
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Customer Rating',
      value: hasReviews ? `${Number(data?.avgRating).toFixed(1)} ★` : 'No reviews yet',
      icon: Star,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-charcoal">Admin Overview</h1>
        <p className="text-stone-500 mt-1">Real-time operational metrics for Euroshub Kitchen.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                  {card.label}
                </p>
                <p className="text-2xl font-bold text-charcoal mt-1">
                  {isLoading ? <Skeleton className="h-8 w-20" /> : card.value}
                </p>
              </div>
              <div className={`${card.bg} ${card.color} p-2.5 rounded-xl`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-charcoal mb-4">Revenue (Last 7 Days, PKR)</h2>
        {isLoading ? (
          <Skeleton className="h-56 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data?.revenueByDay || []}
              margin={{ top: 4, right: 4, left: 16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#78716c' }} />
              <YAxis
                tick={{ fontSize: 11, fill: '#78716c' }}
                tickFormatter={(val) => `Rs. ${val}`}
              />
              <Tooltip
                formatter={(val: number) => [formatCurrency(val), 'Revenue']}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e7e5e4',
                  fontSize: '13px',
                }}
              />
              <Bar dataKey="revenue" fill="#C65D3A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-charcoal">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs font-semibold text-terracotta hover:underline">
              View All
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.recentOrders || []).map((order) => (
                <Link
                  key={order.id}
                  to={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 transition-colors group border border-transparent hover:border-stone-200"
                >
                  <div>
                    <p className="text-sm font-semibold text-charcoal group-hover:text-terracotta transition-colors">
                      #{order.orderNumber}
                    </p>
                    <p className="text-xs text-stone-500">
                      {order.customer?.name || 'Walk-in Diner'} • {order.type.replace('_', ' ')}
                      {order.tableNumber ? ` (Table ${order.tableNumber})` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-charcoal">
                      {formatCurrency(order.total)}
                    </span>
                    <Badge variant={statusColors[order.status] as any} size="sm">
                      {order.status}
                    </Badge>
                  </div>
                </Link>
              ))}
              {(data?.recentOrders || []).length === 0 && (
                <p className="text-sm text-stone-400 text-center py-6">No orders yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Recent Reservations */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-charcoal">Recent Bookings</h2>
            <Link to="/admin/reservations" className="text-xs font-semibold text-terracotta hover:underline">
              View All
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.recentReservations || []).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-charcoal">{r.customer?.name}</p>
                    <p className="text-xs text-stone-500">
                      {new Date(r.date).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' · '}Party of {r.partySize}
                    </p>
                  </div>
                  <Badge variant={statusColors[r.status] as any} size="sm">
                    {r.status}
                  </Badge>
                </div>
              ))}
              {(data?.recentReservations || []).length === 0 && (
                <p className="text-sm text-stone-400 text-center py-6">No reservations yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
