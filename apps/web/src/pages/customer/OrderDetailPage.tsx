import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { Order, Review } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Timeline } from '../../components/ui/Timeline';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { Skeleton } from '../../components/ui/Skeleton';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  Star,
  CheckCircle2,
  AlertCircle,
  Truck,
  Utensils,
  ShoppingBag,
} from 'lucide-react';

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
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-md mx-auto">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h3 className="font-serif font-bold text-red-900 mb-1">Order Not Found</h3>
        <p className="text-xs text-red-700 mb-4">
          This order does not exist or you do not have permission to view it.
        </p>
        <Link to="/account/orders">
          <Button variant="outline" size="sm">
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const isTerminal = order.status === 'COMPLETED' || order.status === 'CANCELLED';

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <div>
        <Link
          to="/account/orders"
          className="inline-flex items-center text-xs font-semibold text-charcoal-600 dark:text-charcoal-400 hover:text-terracotta transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to All Orders
        </Link>
      </div>

      {/* Header Info Banner */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-bistro-border dark:border-charcoal-700 gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-mono font-bold text-xl text-charcoal dark:text-charcoal-100">{order.orderNumber}</h2>
              <Badge variant={order.status.toLowerCase() as any} dot>
                {order.status}
              </Badge>
            </div>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">
              Placed on{' '}
              {new Date(order.createdAt).toLocaleString('en-US', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {!isTerminal && (
              <div className="flex items-center gap-1.5 text-xs text-olive dark:text-olive-400 font-medium bg-olive-50 dark:bg-olive-900/20 px-2.5 py-1 rounded-full border border-olive-200 dark:border-olive-800">
                <span className="w-2 h-2 rounded-full bg-olive animate-pulse" />
                <span>Live Kitchen Updates Polling</span>
              </div>
            )}
            {order.status === 'COMPLETED' && !order.review && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setReviewModalOpen(true)}
                leftIcon={<Star className="w-3.5 h-3.5 text-yellow-300 fill-current" />}
              >
                Leave a Review
              </Button>
            )}
          </div>
        </div>

        {/* Live Tracking Timeline */}
        <div className="pt-6">
          <Timeline currentStatus={order.status} />
        </div>
      </Card>

      {/* Order Details & Receipt */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Itemized list (7 cols) */}
        <div className="md:col-span-7 space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="font-serif font-bold text-base text-charcoal dark:text-charcoal-100 pb-3 border-b border-bistro-border dark:border-charcoal-700">
              Purchased Items Snapshot
            </h3>

            <div className="divide-y divide-bistro-border dark:divide-charcoal-700">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-charcoal dark:text-charcoal-100 text-sm">{item.quantity}×</span>{' '}
                    <span className="font-medium text-charcoal-800 dark:text-charcoal-200 text-sm ml-1.5">
                      {item.nameAtPurchase}
                    </span>
                    {item.variantNameAtPurchase && (
                      <span className="text-terracotta font-semibold text-xs ml-2 px-2 py-0.5 bg-terracotta/10 rounded">
                        {item.variantNameAtPurchase}
                      </span>
                    )}
                    <span className="block text-charcoal-400 dark:text-charcoal-500 text-[11px] mt-0.5">
                      {formatCurrency(item.priceAtPurchase)} each (Immutable price at checkout)
                    </span>
                  </div>
                  <span className="font-bold text-charcoal-900 dark:text-charcoal-100 text-sm">
                    {formatCurrency(Number(item.priceAtPurchase) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-bistro-border dark:border-charcoal-700 space-y-2 text-xs">
              <div className="flex justify-between text-charcoal-600 dark:text-charcoal-400">
                <span>Subtotal</span>
                <span className="font-semibold text-charcoal-900 dark:text-charcoal-100">{formatCurrency(order.subtotal)}</span>
              </div>
              {Number(order.deliveryFee) > 0 && (
                <div className="flex justify-between text-charcoal-600 dark:text-charcoal-400">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-charcoal-900 dark:text-charcoal-100">{formatCurrency(order.deliveryFee)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-bistro-border dark:border-charcoal-700 flex justify-between items-baseline text-sm">
                <span className="font-bold text-charcoal dark:text-charcoal-100">Total Amount (PKR)</span>
                <span className="text-xl font-serif font-bold text-terracotta">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </Card>

          {/* Customer review if already submitted */}
          {order.review && (
            <Card className="p-5 bg-terracotta-50/20 dark:bg-terracotta/10 border-terracotta-200 dark:border-terracotta/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-terracotta uppercase tracking-wider">
                  Your Review on this Order
                </span>
                <div className="flex text-amber-500">
                  {Array.from({ length: order.review.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-charcoal-700 dark:text-charcoal-300 italic">"{order.review.comment}"</p>
            </Card>
          )}
        </div>

        {/* Fulfillment Details (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <Card className="p-6 space-y-4 text-xs">
            <h3 className="font-serif font-bold text-base text-charcoal dark:text-charcoal-100 pb-3 border-b border-bistro-border dark:border-charcoal-700">
              Fulfillment Information
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-charcoal-400 dark:text-charcoal-500 block mb-0.5">Order Type:</span>
                <span className="font-semibold text-charcoal-900 dark:text-charcoal-200 capitalize flex items-center gap-1.5">
                  {order.type === 'DELIVERY' && <Truck className="w-4 h-4 text-terracotta" />}
                  {order.type === 'DINE_IN' && <Utensils className="w-4 h-4 text-terracotta" />}
                  {order.type === 'TAKEAWAY' && <ShoppingBag className="w-4 h-4 text-terracotta" />}
                  {order.type.replace('_', ' ')}
                </span>
              </div>

              {order.deliveryAddress && (
                <div>
                  <span className="text-charcoal-400 dark:text-charcoal-500 block mb-0.5">Delivery Address:</span>
                  <span className="font-medium text-charcoal-900 dark:text-charcoal-200">{order.deliveryAddress}</span>
                </div>
              )}

              {order.tableNumber && (
                <div>
                  <span className="text-charcoal-400 dark:text-charcoal-500 block mb-0.5">Table Assignment:</span>
                  <span className="font-bold text-terracotta text-sm">Table #{order.tableNumber}</span>
                </div>
              )}

              <div>
                <span className="text-charcoal-400 dark:text-charcoal-500 block mb-0.5">Contact Telephone:</span>
                <span className="font-medium text-charcoal-900 dark:text-charcoal-200">{order.contactPhone}</span>
              </div>

              <div>
                <span className="text-charcoal-400 dark:text-charcoal-500 block mb-0.5">Payment Method:</span>
                <span className="font-semibold text-charcoal-900 dark:text-charcoal-200">
                  {order.paymentMethod === 'PAY_AT_RESTAURANT' ? 'Pay at Counter / Table' : order.paymentMethod}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Review Your Dining Experience"
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 uppercase tracking-wider mb-2">
              Star Rating
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating ? 'text-amber-500 fill-current' : 'text-charcoal-200 dark:text-charcoal-700'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="Your Review & Comments *"
            placeholder="Share what you loved about the flavors, presentation, or kitchen service..."
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <div className="pt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReviewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={reviewSubmitting}>
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
