import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { Review } from '../../types';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Star, MessageSquareQuote, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const CustomerReviewsPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customerMyReviews'],
    queryFn: () => apiRequest<{ reviews: Review[] }>('/customer/reviews'),
  });

  const reviews = data?.reviews || [];

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-bistro-border">
        <h2 className="text-xl font-serif font-bold text-charcoal">My Reviews</h2>
        <p className="text-xs text-charcoal-500 mt-0.5">
          Feedback and ratings you have shared for completed dining orders.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-sm mx-auto">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-xs text-red-700 mb-4 font-medium">Failed to load your reviews.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquareQuote className="w-7 h-7" />}
          title="No reviews written yet"
          description="Once your order is marked completed by the kitchen, you can rate and review your dishes directly from your order detail page."
          actionLabel="View My Orders"
          actionHref="/account/orders"
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <Card key={rev.id} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < rev.rating ? 'fill-current text-amber-500' : 'text-charcoal-200'
                      }`}
                    />
                  ))}
                  <span className="ml-2 font-bold text-xs text-charcoal">{rev.rating}/5</span>
                </div>
                <span className="text-[11px] text-charcoal-400">
                  {new Date(rev.createdAt).toLocaleDateString('en-US', {
                    dateStyle: 'medium',
                  })}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-charcoal-700 italic leading-relaxed">
                "{rev.comment}"
              </p>

              {rev.order && (
                <div className="pt-2 border-t border-bistro-border text-[11px] text-charcoal-500">
                  Associated Order: <span className="font-mono font-medium text-charcoal-700">{rev.order.orderNumber}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
