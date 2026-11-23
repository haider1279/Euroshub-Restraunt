import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Star } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { Order } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { formatLongDateTime } from '../../utils/date';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { StatusBadge, humanize } from '../../components/ui/Badge';
import { Timeline } from '../../components/ui/Timeline';
import { Dialog } from '../../components/ui/Dialog';
import { Textarea } from '../../components/ui/Textarea';
import { Skeleton, LoadingStatus } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { toast } from 'sonner';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // TanStack Query with live polling every 6 seconds until order reaches terminal state
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customerOrderDetail', id],
    queryFn: () => apiRequest<{ order: Order }>(`/orders/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.order?.status;
      if (status === 'COMPLETED' || status === 'CANCELLED') {
        return false; // Stop polling on terminal states
      }
      return 6000; // Poll every 6 seconds while pending/preparing/ready
    },
  });

  const order = data?.order;

  // Review submission mutation
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (comment.trim().length < 5) {
      toast.error('Comment must be at least 5 characters long.');
      return;
    }

    setReviewSubmitting(true);
    try {
      await apiRequest('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          orderId: order.id,
          rating,
          comment,
        }),
      });

      toast.success('Thank you! Your dining review has been submitted.');
      setReviewModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['customerOrderDetail', id] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingStatus label="Loading order" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <EmptyState
        title="Order not found"
        description="It may not exist, or it belongs to another account."
        actionLabel="Back to orders"
        actionHref="/account/orders"
      />
    );
  }

  const isTerminal = order.status === 'COMPLETED' || order.status === 'CANCELLED';
  const addonNames = (snapshot: unknown): string[] =>
    Array.isArray(snapshot) ? (snapshot.map((a: { name?: string }) => a?.name).filter(Boolean) as string[]) : [];

  return (
    <div className="space-y-8">
      <Link to="/account/orders" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Orders
      </Link>

      <section aria-labelledby="order-title" className="rounded-lg border border-line bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="order-title" className="tabular font-mono text-xl text-ink">
                {order.orderNumber}
              </h2>
              <StatusBadge status={order.status} />
            </div>
            <p className="mt-1.5 text-sm text-muted">{formatLongDateTime(order.createdAt)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {!isTerminal && <p className="text-sm text-muted">Updates automatically</p>}
            {order.status === 'COMPLETED' && !order.review && (
              <Button size="sm" onClick={() => setReviewModalOpen(true)}>
                Leave a review
              </Button>
            )}
          </div>
        </div>
        <div className="pt-6" aria-live="polite">
          <Timeline currentStatus={order.status} />
        </div>
      </section>

      <div className="grid items-start gap-6 md:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="receipt-title" className="rounded-lg border border-line bg-surface p-5 sm:p-6">
          <h2 id="receipt-title" className="font-serif text-xl text-ink">
            Items
          </h2>
          <ul className="mt-4 divide-y divide-line">
            {order.items.map((item) => {
              const extras = addonNames(item.addonsSnapshot);
              return (
                <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-ink">
                      <span className="tabular text-muted">{item.quantity}×</span> {item.nameAtPurchase}
                    </p>
                    {(item.variantNameAtPurchase || extras.length > 0) && (
                      <p className="mt-0.5 text-muted">
                        {[item.variantNameAtPurchase, ...extras.map((n) => `+ ${n}`)].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <p className="tabular mt-0.5 text-muted">{formatCurrency(item.priceAtPurchase)} each</p>
                  </div>
                  <span className="tabular shrink-0 text-ink">{formatCurrency(Number(item.priceAtPurchase) * item.quantity)}</span>
                </li>
              );
            })}
          </ul>
          <dl className="mt-2 space-y-2 border-t border-line pt-4 text-sm">
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
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <dt className="text-base text-ink">Total</dt>
              <dd className="tabular font-serif text-2xl text-ink">{formatCurrency(order.total)}</dd>
            </div>
          </dl>
        </section>

        <div className="space-y-6">
          <section aria-labelledby="details-title" className="rounded-lg border border-line bg-surface p-5 sm:p-6">
            <h2 id="details-title" className="font-serif text-xl text-ink">
              Details
            </h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-muted">Type</dt>
                <dd className="mt-0.5 text-ink">{humanize(order.type)}</dd>
              </div>
              {order.tableNumber && (
                <div>
                  <dt className="text-muted">Table</dt>
                  <dd className="tabular mt-0.5 text-ink">{order.tableNumber}</dd>
                </div>
              )}
              {order.deliveryAddress && (
                <div>
                  <dt className="text-muted">Delivery address</dt>
                  <dd className="mt-0.5 text-ink">{order.deliveryAddress}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted">Phone</dt>
                <dd className="mt-0.5 text-ink">{order.contactPhone}</dd>
              </div>
              <div>
                <dt className="text-muted">Payment</dt>
                <dd className="mt-0.5 text-ink">
                  {order.paymentMethod === 'PAY_AT_RESTAURANT' ? 'Pay at the restaurant' : order.paymentMethod}
                </dd>
              </div>
            </dl>
          </section>

          {order.review && (
            <section aria-labelledby="your-review" className="rounded-lg border border-line bg-surface p-5 sm:p-6">
              <h2 id="your-review" className="font-serif text-xl text-ink">
                Your review
              </h2>
              <span className="mt-3 inline-flex gap-0.5 text-warning" aria-label={`${order.review.rating} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={i < order.review!.rating ? 'h-4 w-4 fill-current' : 'h-4 w-4 text-ink/15'} aria-hidden="true" />
                ))}
              </span>
              <p className="mt-2 text-sm text-ink">{order.review.comment}</p>
            </section>
          )}
        </div>
      </div>

      <Dialog isOpen={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title="Review your order">
        <form onSubmit={handleReviewSubmit} className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-muted">Rating</legend>
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  role="radio"
                  aria-checked={rating === star}
                  aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
                  onClick={() => setRating(star)}
                  className="pressable inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-ink/[0.06]"
                >
                  <Star className={cn('h-6 w-6', star <= rating ? 'fill-current text-warning' : 'text-ink/20')} aria-hidden="true" />
                </button>
              ))}
            </div>
          </fieldset>

          <Textarea label="Comment" helperText="At least 5 characters." rows={4} value={comment} onChange={(e) => setComment(e.target.value)} />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={reviewSubmitting}>
              Submit review
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
