import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { Review } from '../../types';
import { Skeleton, LoadingStatus } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/date';

export const CustomerReviewsPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customerMyReviews'],
    queryFn: () => apiRequest<{ reviews: Review[] }>('/customer/reviews'),
  });

  const reviews = data?.reviews || [];

  return (
    <div>
      <h2 className="font-serif text-2xl text-ink">Reviews</h2>
      <p className="mt-1 text-sm text-muted">Reviews you’ve left on completed orders.</p>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            <LoadingStatus label="Loading reviews" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState title="Couldn’t load your reviews" onRetry={() => refetch()} />
        ) : reviews.length === 0 ? (
          <EmptyState
            title="No reviews yet"
            description="Once an order is completed, you can review it from the order page."
            actionLabel="See my orders"
            actionHref="/account/orders"
          />
        ) : (
          <ul className="space-y-3">
            {reviews.map((rev) => (
              <li key={rev.id} className="rounded-lg border border-line bg-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-0.5 text-warning" aria-label={`${rev.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={i < rev.rating ? 'h-4 w-4 fill-current' : 'h-4 w-4 text-ink/15'} aria-hidden="true" />
                    ))}
                  </span>
                  <span className="text-sm text-muted">{formatDate(rev.createdAt)}</span>
                </div>
                <p className="mt-3 text-base text-ink">{rev.comment}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
                  {rev.order && <span className="tabular font-mono">{rev.order.orderNumber}</span>}
                  {rev.isHidden && <Badge variant="neutral" size="sm">Hidden by the restaurant</Badge>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
