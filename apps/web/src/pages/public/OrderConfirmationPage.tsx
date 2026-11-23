import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { Order } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { formatDateTime } from '../../utils/date';
import { ButtonLink } from '../../components/ui/Button';
import { Skeleton, LoadingStatus } from '../../components/ui/Skeleton';
import { Notice } from '../../components/ui/EmptyState';

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['orderConfirmation', orderId],
    queryFn: () => apiRequest<{ order: Order }>(`/orders/${orderId}`),
    enabled: !!orderId,
  });

  const order = data?.order;

  if (isLoading) {
    return (
      <div className="container-content max-w-2xl py-16">
        <LoadingStatus label="Loading your order" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-8 h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="container-content max-w-2xl pb-24 pt-12 sm:pt-16">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent" aria-hidden="true">
        <Check className="h-5 w-5" />
      </span>
      <p className="eyebrow mt-6">Order placed</p>
      <h1 className="mt-3 font-serif text-4xl text-ink">Thanks. The kitchen has your order.</h1>
      <p className="mt-4 text-base text-muted">You’ll pay at the restaurant. You can follow its status from your account.</p>

      {isError || !order ? (
        <Notice tone="neutral" className="mt-10">
          We couldn’t load the order details right now. You can find this order in your account.
        </Notice>
      ) : (
        <section aria-labelledby="order-summary" className="mt-10 rounded-lg border border-line bg-surface p-6">
          <div className="flex flex-wrap justify-between gap-4 border-b border-line pb-5">
            <div>
              <p className="text-sm text-muted">Order number</p>
              <h2 id="order-summary" className="tabular mt-1 font-mono text-lg text-ink">
                {order.orderNumber}
              </h2>
            </div>
            <div className="sm:text-right">
              <p className="text-sm text-muted">{formatDateTime(order.createdAt)}</p>
              <p className="mt-1 text-sm text-ink">
                {order.type === 'DINE_IN' ? `Dine-in · Table ${order.tableNumber || 'to be assigned'}` : 'Takeaway'}
              </p>
            </div>
          </div>

          <ul className="divide-y divide-line">
            {order.items.map((it) => (
              <li key={it.id} className="flex justify-between gap-4 py-3 text-sm">
                <span className="text-ink">
                  <span className="tabular text-muted">{it.quantity}×</span> {it.nameAtPurchase}
                  {it.variantNameAtPurchase && <span className="text-muted"> · {it.variantNameAtPurchase}</span>}
                </span>
                <span className="tabular shrink-0 text-ink">{formatCurrency(Number(it.priceAtPurchase) * it.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-base text-ink">Total · pay at the restaurant</span>
            <span className="tabular font-serif text-2xl text-ink">{formatCurrency(order.total)}</span>
          </div>
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {order && <ButtonLink to={`/account/orders/${order.id}`}>Track this order</ButtonLink>}
        <ButtonLink to="/menu" variant="secondary">
          Back to the menu
        </ButtonLink>
      </div>
    </div>
  );
};
