import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { Order } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['orderConfirmation', orderId],
    queryFn: () => apiRequest<{ order: Order }>(`/orders/${orderId}`),
    enabled: !!orderId,
  });

  const order = data?.order;

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 space-y-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-8">
      {/* Success Celebration Banner */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm animate-bounce-short">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
          Order Placed Successfully
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-charcoal">
          Thank You For Your Order!
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-500 max-w-md mx-auto leading-relaxed">
          Your order has been received by Euroshub Kitchen and is being prepared according to our standard state flow.
        </p>
      </div>

      {/* Order Reference Box */}
      {order && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-bistro-border gap-2">
            <div>
              <span className="text-[11px] text-charcoal-400 uppercase tracking-wider block">
                Order Reference Number
              </span>
              <span className="font-mono font-bold text-lg text-terracotta">
                {order.orderNumber}
              </span>
            </div>
            <div className="sm:text-right">
              <span className="text-[11px] text-charcoal-400 uppercase tracking-wider block">
                Order Type
              </span>
              <span className="text-xs font-bold text-charcoal-800 uppercase bg-bistro-bg px-2.5 py-1 rounded border border-bistro-border">
                {order.type === 'DINE_IN'
                  ? `Dine-In (Table ${order.tableNumber || 'Assigned'})`
                  : 'Takeaway'}
              </span>
            </div>
          </div>

          {/* Itemized list */}
          <div className="space-y-2.5 text-xs">
            <h4 className="font-serif font-bold text-charcoal text-sm">Items Ordered</h4>
            <div className="divide-y divide-bistro-border">
              {order.items.map((it) => (
                <div key={it.id} className="py-2 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-charcoal">{it.quantity}×</span>{' '}
                    <span>{it.nameAtPurchase}</span>
                    {it.variantNameAtPurchase && (
                      <span className="text-terracotta font-medium text-[11px] ml-1.5">
                        ({it.variantNameAtPurchase})
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-charcoal-700">
                    {formatCurrency(Number(it.priceAtPurchase) * it.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-bistro-border flex justify-between items-baseline text-sm">
            <span className="font-bold text-charcoal">Total (Pay at Restaurant)</span>
            <span className="text-xl font-serif font-bold text-terracotta">
              {formatCurrency(order.total)}
            </span>
          </div>

          {/* Track Order CTA */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link to={`/account/orders/${order.id}`} className="flex-1">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Track Order Live Timeline
              </Button>
            </Link>
            <Link to="/menu" className="flex-1">
              <Button variant="outline" size="lg" className="w-full">
                Back to Menu
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
};
