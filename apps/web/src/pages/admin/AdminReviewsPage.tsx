import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Eye, EyeOff, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '../../api/client';
import { Review } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { RowAction, Pager } from '../../components/ui/DataTable';
import { formatDate } from '../../utils/date';
import { cn } from '../../utils/cn';

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5 text-warning" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={s <= rating ? 'h-3.5 w-3.5 fill-current' : 'h-3.5 w-3.5 text-ink/15'} aria-hidden="true" />
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [showHidden, setShowHidden] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery<{ reviews: Review[]; total: number; pages: number }>({
    queryKey: ['admin-reviews', showHidden, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (showHidden) params.set('showHidden', 'true');
      return apiRequest(`/admin/reviews?${params}`);
    },
  });

  const toggleHide = useMutation({
    mutationFn: ({ id, isHidden }: { id: string; isHidden: boolean }) =>
      apiRequest(`/admin/reviews/${id}/visibility`, {
        method: 'PATCH',
        body: JSON.stringify({ isHidden }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review visibility updated');
    },
    onError: () => toast.error('Failed to update visibility'),
  });

  const reviews = data?.reviews || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-ink">Reviews</h1>
          <p className="tabular mt-1 text-sm text-muted">{data?.total ?? 0} total</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowHidden(!showHidden)}
            aria-pressed={showHidden}
            id="toggle-hidden-reviews-btn"
            leftIcon={showHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          >
            {showHidden ? 'Including hidden' : 'Show hidden'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => refetch()} id="refresh-reviews-btn" aria-label="Refresh reviews">
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState title="No reviews" description={showHidden ? 'There are no reviews yet.' : 'No visible reviews. Try including hidden ones.'} />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
          {reviews.map((review) => (
            <li key={review.id} className={cn('flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5', review.isHidden && 'bg-deep')}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-ink">{review.customer?.name}</p>
                  <StarRating rating={review.rating} />
                  {review.isHidden && <Badge variant="neutral" size="sm">Hidden</Badge>}
                </div>
                <p className={cn('mt-2 text-sm', review.isHidden ? 'text-muted' : 'text-ink')}>{review.comment}</p>
                <p className="tabular mt-2 text-xs text-muted">
                  {formatDate(review.createdAt)}
                  {review.order && <> · Order #{review.order.orderNumber}</>}
                </p>
              </div>
              <RowAction
                onClick={() => toggleHide.mutate({ id: review.id, isHidden: !review.isHidden })}
                disabled={toggleHide.isPending}
                tone={review.isHidden ? 'accent' : 'default'}
                id={`toggle-review-${review.id}`}
                className="self-start"
              >
                {review.isHidden ? <Eye className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
                {review.isHidden ? 'Show' : 'Hide'}
              </RowAction>
            </li>
          ))}
        </ul>
      )}

      <Pager page={page} pages={data?.pages || 1} onChange={setPage} />
    </div>
  );
}
