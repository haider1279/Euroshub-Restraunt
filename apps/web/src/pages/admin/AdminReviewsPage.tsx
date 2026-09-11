import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { Review } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Star, Eye, EyeOff, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '../../utils/date';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`}
        />
      ))}
    </div>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal">Reviews</h1>
          <p className="text-stone-500 mt-1">{data?.total ?? 0} reviews total</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHidden(!showHidden)}
            className={`text-sm px-4 py-2 rounded-xl border font-medium transition-colors ${
              showHidden
                ? 'bg-stone-700 text-white border-stone-700'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
            id="toggle-hidden-reviews-btn"
          >
            {showHidden ? <Eye className="w-4 h-4 inline mr-1" /> : <EyeOff className="w-4 h-4 inline mr-1" />}
            {showHidden ? 'Showing All' : 'Show Hidden'}
          </button>
          <Button variant="secondary" size="sm" onClick={() => refetch()} id="refresh-reviews-btn">
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading
          ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
          : (data?.reviews || []).map((review) => (
              <div
                key={review.id}
                className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${
                  review.isHidden ? 'border-stone-200 opacity-60' : 'border-stone-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold text-charcoal">{review.customer?.name}</p>
                      <StarRating rating={review.rating} />
                      {review.isHidden && <Badge variant="secondary" size="sm">Hidden</Badge>}
                    </div>
                    <p className="text-sm text-stone-600 mb-2 leading-relaxed">"{review.comment}"</p>
                    <div className="flex gap-3 text-xs text-stone-400">
                      <span>{formatDate(review.createdAt)}</span>
                      {review.order && (
                        <span>· Order #{review.order.orderNumber}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleHide.mutate({ id: review.id, isHidden: !review.isHidden })}
                    disabled={toggleHide.isPending}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                      review.isHidden
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                    id={`toggle-review-${review.id}`}
                  >
                    {review.isHidden ? (
                      <><Eye className="w-3.5 h-3.5" /> Unhide</>
                    ) : (
                      <><EyeOff className="w-3.5 h-3.5" /> Hide</>
                    )}
                  </button>
                </div>
              </div>
            ))}
      </div>

      {(data?.reviews || []).length === 0 && !isLoading && (
        <div className="text-center py-12 text-stone-400">No reviews found.</div>
      )}

      {(data?.pages || 1) > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} id="prev-page-btn">
            Previous
          </Button>
          <span className="text-sm text-stone-500">Page {page} of {data?.pages}</span>
          <Button variant="secondary" size="sm" disabled={page === data?.pages} onClick={() => setPage(p => p + 1)} id="next-page-btn">
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
