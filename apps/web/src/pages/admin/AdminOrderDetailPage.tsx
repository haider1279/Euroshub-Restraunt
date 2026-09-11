import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { Order, OrderStatus } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { ArrowLeft, Phone, MapPin, UtensilsCrossed, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, formatLongDateTime } from '../../utils/date';

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PREPARING: 'warning',
  READY: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ order: Order }>({
    queryKey: ['admin-order', id],
    queryFn: () => apiRequest<{ order: Order }>(`/admin/orders/${id}`),
    enabled: !!id,
  });
  const order = data?.order;

  const updateStatus = useMutation({
    mutationFn: (newStatus: string) =>
      apiRequest(`/admin/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated successfully');
    },
    onError: () => toast.error('Failed to update status'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!order) return <div className="text-stone-500">Order not found.</div>;

  const nextStatuses = NEXT_STATUSES[order.status];

  return (
    <div className="max-w-3xl space-y-6">
      <button
        onClick={() => navigate('/admin/orders')}
        className="flex items-center gap-2 text-stone-500 hover:text-terracotta transition-colors text-sm"
        id="back-to-orders-btn"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal">#{order.orderNumber}</h1>
          <p className="text-stone-500 mt-1">
            {formatLongDateTime(order.createdAt)}
          </p>
        </div>
        <Badge variant={STATUS_BADGE[order.status] as any} size="lg">{order.status}</Badge>
      </div>

      {/* Status Actions */}
      {nextStatuses.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-amber-800 mb-3">Update Order Status</p>
          <div className="flex gap-2 flex-wrap">
            {nextStatuses.map((next) => (
              <Button
                key={next}
                id={`update-status-${next}`}
                variant={next === 'CANCELLED' ? 'danger' : 'primary'}
                size="sm"
                onClick={() => updateStatus.mutate(next)}
                isLoading={updateStatus.isPending}
              >
                Mark as {next}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Customer & Order Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Customer</h2>
          <p className="font-semibold text-charcoal">{order.customer?.name}</p>
          <p className="text-sm text-stone-500">{order.customer?.email}</p>
          {order.contactPhone && (
            <div className="flex items-center gap-1.5 mt-2 text-sm text-stone-500">
              <Phone className="w-3.5 h-3.5" /> {order.contactPhone}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Order Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Type</span>
              <Badge variant="secondary" size="sm">{order.type.replace('_', ' ')}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Payment</span>
              <span className="font-medium">{order.paymentMethod.replace(/_/g, ' ')}</span>
            </div>
            {order.tableNumber && (
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Table</span>
                <span className="font-medium flex items-center gap-1">
                  <UtensilsCrossed className="w-3.5 h-3.5" /> {order.tableNumber}
                </span>
              </div>
            )}
            {order.deliveryAddress && (
              <div className="flex items-start gap-1.5 mt-1 text-stone-500">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{order.deliveryAddress}</span>
              </div>
            )}
            {order.deliveryNotes && (
              <p className="text-xs italic text-stone-400 mt-1">"{order.deliveryNotes}"</p>
            )}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-100">
          <h2 className="font-semibold text-charcoal">Order Items</h2>
        </div>
        <div className="divide-y divide-stone-100">
          {order.items.map((item) => (
            <div key={item.id} className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-terracotta/10 rounded-lg flex items-center justify-center text-terracotta font-bold text-sm">
                  {item.quantity}
                </div>
                <div>
                  <p className="font-medium text-charcoal">
                    {item.nameAtPurchase}
                    {item.variantNameAtPurchase && (
                      <span className="text-terracotta font-semibold text-xs ml-2 px-2 py-0.5 bg-terracotta/10 rounded">
                        {item.variantNameAtPurchase}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-stone-400">
                    {formatCurrency(item.priceAtPurchase)} each (Snapshot)
                  </p>
                </div>
              </div>
              <p className="font-semibold text-charcoal">
                {formatCurrency(Number(item.priceAtPurchase) * item.quantity)}
              </p>
            </div>
          ))}
        </div>
        <div className="border-t border-stone-200 p-5 space-y-2 bg-stone-50/50">
          <div className="flex justify-between text-sm text-stone-500">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {Number(order.deliveryFee) > 0 && (
            <div className="flex justify-between text-sm text-stone-500">
              <span>Delivery Fee</span>
              <span>{formatCurrency(order.deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-charcoal text-base pt-2 border-t border-stone-200">
            <span>Total</span>
            <span className="text-terracotta font-bold">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
