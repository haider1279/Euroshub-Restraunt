import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { Order } from '../../types';
import { Skeleton, LoadingStatus } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { Pager } from '../../components/ui/DataTable';
import { OrderRow } from '../../components/account/OrderRow';

export const OrderHistoryPage: React.FC = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customerOrders', page],
    queryFn: () => apiRequest<{ orders: Order[]; pagination: any }>(`/orders?page=${page}&pageSize=10`),
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination;

  return (
    <div>
      <h2 className="font-serif text-2xl text-ink">Orders</h2>
      <p className="mt-1 text-sm text-muted">Every dine-in and takeaway order you’ve placed.</p>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            <LoadingStatus label="Loading orders" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState title="Couldn’t load your orders" onRetry={() => refetch()} />
        ) : orders.length === 0 ? (
          <EmptyState title="No orders yet" description="Your orders will appear here once you place one." actionLabel="Browse the menu" actionHref="/menu" />
        ) : (
          <>
            <ul className="space-y-3">
              {orders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </ul>
            {pagination && <Pager className="mt-6" page={pagination.page} pages={pagination.totalPages} onChange={setPage} />}
          </>
        )}
      </div>
    </div>
  );
};
