import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { Order } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ShoppingBag, ArrowRight, ChevronLeft, ChevronRight, Calendar, AlertCircle } from 'lucide-react';

export const OrderHistoryPage: React.FC = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customerOrders', page],
    queryFn: () => apiRequest<{ orders: Order[]; pagination: any }>(`/orders?page=${page}&pageSize=10`),
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-bistro-border">
        <h2 className="text-xl font-serif font-bold text-charcoal">Order History</h2>
        <p className="text-xs text-charcoal-500 mt-0.5">
          View all your previous dine-in, takeaway, and delivery meals.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-sm mx-auto">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-xs text-red-700 mb-4 font-medium">Failed to load order history.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-7 h-7" />}
          title="No previous orders"
          description="You haven't placed any orders yet. Discover our artisanal menu to place your first order."
          actionLabel="Explore Menu"
          actionHref="/menu"
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-terracotta transition-bistro"
            >
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="font-mono font-bold text-sm text-charcoal">
                    {order.orderNumber}
                  </span>
                  <Badge variant={order.status.toLowerCase() as any} dot>
                    {order.status}
                  </Badge>
                </div>
                <p className="text-xs text-charcoal-500">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })}
                </p>
                <div className="text-xs text-charcoal-600 mt-2">
                  <span className="font-medium capitalize">{order.type.replace('_', ' ')}</span>
                  <span className="text-charcoal-300 mx-2">•</span>
                  <span>{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-bistro-border">
                <div className="text-right">
                  <span className="text-[10px] text-charcoal-400 uppercase tracking-wider block">Total</span>
                  <span className="font-serif font-bold text-lg text-terracotta">
                    {formatCurrency(order.total)}
                  </span>
                </div>

                <Link to={`/account/orders/${order.id}`}>
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Track
                  </Button>
                </Link>
              </div>
            </Card>
          ))}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-between items-center pt-4 border-t border-bistro-border text-xs text-charcoal-600">
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage(page - 1)}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
