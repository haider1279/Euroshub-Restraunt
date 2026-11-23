import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import { Order, Reservation } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { formatDate, formatTime } from '../../utils/date';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ChangePasswordCard } from '../../components/auth/ChangePasswordCard';
import {
  ShoppingBag,
  Calendar,
  Clock,
  ArrowRight,
  User,
  Star,
  ChevronRight,
} from 'lucide-react';

export const AccountOverviewPage: React.FC = () => {
  const { user } = useAuth();

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

  const recentOrders = ordersData?.orders || [];
  const reservations = resData?.reservations || [];
  const upcomingReservations = reservations.filter(
    (r) => new Date(r.date).getTime() >= Date.now() && r.status !== 'CANCELLED'
  );

  return (
    <div className="space-y-8">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-terracotta/10 text-terracotta flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-charcoal-400 dark:text-charcoal-500 uppercase tracking-wider block font-medium">
              Total Orders
            </span>
            <span className="text-2xl font-serif font-bold text-charcoal dark:text-charcoal-100">
              {recentOrders.length > 0 ? `${recentOrders.length}+` : '0'}
            </span>
          </div>
        </Card>

        <Card className="p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-olive/10 text-olive flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-charcoal-400 dark:text-charcoal-500 uppercase tracking-wider block font-medium">
              Upcoming Bookings
            </span>
            <span className="text-2xl font-serif font-bold text-charcoal dark:text-charcoal-100">
              {upcomingReservations.length}
            </span>
          </div>
        </Card>

        <Card className="p-5 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-charcoal-400 dark:text-charcoal-500 uppercase tracking-wider block font-medium">
              Dining Status
            </span>
            <span className="text-sm font-bold text-charcoal dark:text-charcoal-100 flex items-center gap-1 mt-1">
              Euroshub Member
            </span>
          </div>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-serif font-bold text-charcoal dark:text-charcoal-100">Recent Dining Orders</h3>
          <Link
            to="/account/orders"
            className="text-xs font-semibold text-terracotta hover:underline inline-flex items-center gap-0.5"
          >
            All Orders <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isOrdersLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : recentOrders.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="w-6 h-6" />}
            title="No orders placed yet"
            description="When you order dinner or takeaway, your tickets and live tracking will appear here."
            actionLabel="Order From Kitchen"
            actionHref="/menu"
          />
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Card
                key={order.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-terracotta transition-bistro"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="font-mono font-bold text-sm text-charcoal dark:text-charcoal-100">
                      {order.orderNumber}
                    </span>
                    <Badge variant={order.status.toLowerCase() as any} dot>
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                    {formatDate(order.createdAt)}{' '}
                    • {order.type.replace('_', ' ')} • {order.items.length}{' '}
                    {order.items.length === 1 ? 'dish' : 'dishes'}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-bistro-border dark:border-charcoal-700">
                  <span className="font-bold text-base text-terracotta">
                    {formatCurrency(order.total)}
                  </span>
                  <Link to={`/account/orders/${order.id}`}>
                    <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Track
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Reservations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-serif font-bold text-charcoal dark:text-charcoal-100">Upcoming Table Bookings</h3>
          <Link
            to="/account/reservations"
            className="text-xs font-semibold text-terracotta hover:underline inline-flex items-center gap-0.5"
          >
            All Reservations <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isResLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : upcomingReservations.length === 0 ? (
          <div className="bg-white dark:bg-charcoal-850 p-6 rounded-xl border border-bistro-border dark:border-charcoal-700 text-center space-y-3">
            <Calendar className="w-8 h-8 text-charcoal-400 dark:text-charcoal-500 mx-auto" />
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400">You have no upcoming table bookings.</p>
            <Link to="/reservation">
              <Button variant="outline" size="sm">
                Reserve a Table Now
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingReservations.slice(0, 2).map((res) => (
              <Card key={res.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-charcoal dark:text-charcoal-100">
                      {formatDate(res.date)}
                    </span>
                    <Badge variant={res.status.toLowerCase() as any}>{res.status}</Badge>
                  </div>
                  <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                    {formatTime(res.date)}{' '}
                    • {res.partySize} Guests
                  </p>
                </div>
                <Link to="/account/reservations">
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Account Security & Password */}
      <ChangePasswordCard />
    </div>
  );
};
