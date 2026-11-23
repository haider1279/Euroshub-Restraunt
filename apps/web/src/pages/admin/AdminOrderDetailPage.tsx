import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '../../api/client';
import { Order, OrderStatus } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { formatLongDateTime } from '../../utils/date';
import { StatusBadge, humanize } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Timeline } from '../../components/ui/Timeline';
import { TableShell, THead, Th, Td, Tr } from '../../components/ui/DataTable';

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
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!order) {
    return <EmptyState title="Order not found" description="It may have been removed." actionLabel="Back to orders" actionHref="/admin/orders" />;
  }

  const nextStatuses = NEXT_STATUSES[order.status];
  const addonNames = (snapshot: unknown): string[] =>
    Array.isArray(snapshot) ? (snapshot.map((a: { name?: string }) => a?.name).filter(Boolean) as string[]) : [];

  return (
    <div className="max-w-4xl space-y-6">
      <button
        type="button"
        onClick={() => navigate('/admin/orders')}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted hover:text-ink"
        id="back-to-orders-btn"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Orders
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="tabular font-mono text-2xl text-ink">#{order.orderNumber}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-muted">{formatLongDateTime(order.createdAt)}</p>
        </div>
        {nextStatuses.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Move order to">
            {nextStatuses.map((next) => (
              <Button
                key={next}
                id={`update-status-${next}`}
                variant={next === 'CANCELLED' ? 'danger' : 'primary'}
                size="sm"
                onClick={() => updateStatus.mutate(next)}
                isLoading={updateStatus.isPending}
              >
                {next === 'CANCELLED' ? 'Cancel order' : `Mark ${humanize(next).toLowerCase()}`}
              </Button>
            ))}
          </div>
        )}
      </div>

      <section className="rounded-lg border border-line bg-surface p-5 sm:p-6" aria-label="Order progress">
        <Timeline currentStatus={order.status} />
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-line bg-surface p-5">
          <h2 className="text-xs uppercase tracking-[0.08em] text-muted">Customer</h2>
          <p className="mt-3 text-ink">{order.customer?.name}</p>
          <p className="text-sm text-muted">{order.customer?.email}</p>
          {order.contactPhone && (
            <a href={`tel:${order.contactPhone}`} className="mt-2 inline-flex min-h-11 items-center text-sm text-ink underline-offset-4 hover:underline sm:min-h-0">
              {order.contactPhone}
            </a>
          )}
        </section>

        <section className="rounded-lg border border-line bg-surface p-5">
          <h2 className="text-xs uppercase tracking-[0.08em] text-muted">Order</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Type</dt>
              <dd className="text-ink">{humanize(order.type)}</dd>
            </div>
            {order.tableNumber && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Table</dt>
                <dd className="tabular text-ink">{order.tableNumber}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Payment</dt>
              <dd className="text-ink">{order.paymentMethod === 'PAY_AT_RESTAURANT' ? 'Pay at restaurant' : humanize(order.paymentMethod)}</dd>
            </div>
            {order.deliveryAddress && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Address</dt>
                <dd className="text-right text-ink">{order.deliveryAddress}</dd>
              </div>
            )}
          </dl>
          {order.deliveryNotes && <p className="mt-3 border-l-2 border-line-strong pl-3 text-sm text-muted">{order.deliveryNotes}</p>}
        </section>
      </div>

      <TableShell
        footer={
          <dl className="space-y-2 border-t border-line bg-deep px-4 py-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular text-ink">{formatCurrency(order.subtotal)}</dd>
            </div>
            {Number(order.deliveryFee) > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Delivery fee</dt>
                <dd className="tabular text-ink">{formatCurrency(order.deliveryFee)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-2 text-base">
              <dt className="text-ink">Total</dt>
              <dd className="tabular text-ink">{formatCurrency(order.total)}</dd>
            </div>
          </dl>
        }
      >
        <THead>
          <tr>
            <Th className="w-16">Qty</Th>
            <Th>Item</Th>
            <Th className="text-right">Each</Th>
            <Th className="text-right">Line total</Th>
          </tr>
        </THead>
        <tbody>
          {order.items.map((item) => {
            const extras = addonNames(item.addonsSnapshot);
            return (
              <Tr key={item.id}>
                <Td className="tabular">{item.quantity}</Td>
                <Td>
                  <p className="text-ink">{item.nameAtPurchase}</p>
                  {(item.variantNameAtPurchase || extras.length > 0) && (
                    <p className="text-sm text-muted">
                      {[item.variantNameAtPurchase, ...extras.map((n) => `+ ${n}`)].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </Td>
                <Td className="tabular text-right text-muted">{formatCurrency(item.priceAtPurchase)}</Td>
                <Td className="tabular text-right">{formatCurrency(Number(item.priceAtPurchase) * item.quantity)}</Td>
              </Tr>
            );
          })}
        </tbody>
      </TableShell>
    </div>
  );
}
