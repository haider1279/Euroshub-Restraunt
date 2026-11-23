import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { apiRequest, api } from '../../api/client';
import { Order, OrderType, RestaurantTable } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { checkRestaurantStatus } from '../../utils/hours';
import { closedStatusLine } from '../../utils/openingHours';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { SegmentedControl } from '../../components/ui/Tabs';
import { EmptyState, Notice } from '../../components/ui/EmptyState';

const checkoutFormSchema = z.object({
  contactPhone: z.string().min(6, 'Please provide a valid contact phone number (e.g. 0300 1234567)'),
  tableNumber: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const { settings } = useRestaurant();

  const restaurantStatus = checkRestaurantStatus(
    new Date(),
    settings.openingHours as any,
    settings.timezone || 'Asia/Karachi'
  );

  // Order type limited to Dine-In and Takeaway ONLY (Delivery gated off)
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loadingTables, setLoadingTables] = useState<boolean>(true);
  const [selectedTable, setSelectedTable] = useState<string>('01');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Payment is strictly Pay at Restaurant
  const paymentMethod = 'PAY_AT_RESTAURANT';

  // Fetch active tables 01–100 for Dine-In selection
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await api.get('/tables');
        if (res.data?.tables) {
          setTables(res.data.tables);
          if (res.data.tables.length > 0) {
            setSelectedTable(res.data.tables[0].tableNumber);
          }
        }
      } catch (err) {
        console.warn('Failed to load tables, falling back to 01-100 defaults:', err);
        // Fallback default 100 tables
        const defaultTables: RestaurantTable[] = Array.from({ length: 100 }, (_, i) => {
          const num = i + 1 < 10 ? `0${i + 1}` : `${i + 1}`;
          return { id: num, tableNumber: num, isActive: true, capacity: 4 };
        });
        setTables(defaultTables);
      } finally {
        setLoadingTables(false);
      }
    };
    fetchTables();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      contactPhone: user?.phone || '',
      tableNumber: '01',
    },
  });

  if (items.length === 0) {
    return (
      <div className="container-content py-16 sm:py-24">
        <h1 className="font-serif text-4xl text-ink">Checkout</h1>
        <EmptyState
          className="mt-8 max-w-lg"
          title="Your cart is empty"
          description="Add dishes from the menu before checking out."
          actionLabel="Browse the menu"
          actionHref="/menu"
        />
      </div>
    );
  }

  const onSubmit = async (data: CheckoutFormData) => {
    if (!isAuthenticated) {
      toast.error('Please sign in or create an account to place an order.');
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }

    if (orderType === 'DINE_IN' && !selectedTable) {
      setApiError('Please select a table number for your dine-in order.');
      return;
    }

    setApiError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        type: orderType,
        items: items.map((i) => ({
          menuItemId: i.menuItem.id,
          variantId: i.variant?.id || undefined,
          addonIds: i.addons && i.addons.length > 0 ? i.addons.map((a) => a.id) : undefined,
          quantity: i.quantity,
        })),
        contactPhone: data.contactPhone,
        tableNumber: orderType === 'DINE_IN' ? selectedTable : undefined,
        paymentMethod,
      };

      const res = await api.post<{ order: Order }>('/orders', payload);

      toast.success(`Order #${res.order.orderNumber} placed successfully!`);
      clearCart();
      navigate(`/order-confirmation/${res.order.id}`);
    } catch (err: any) {
      const msg =
        err.message || 'Failed to place your order. Please check details and try again.';
      setApiError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closedLine = closedStatusLine(restaurantStatus);

  return (
    <div className="container-content pb-24 pt-10 sm:pt-14">
      <div className="border-b border-line pb-6">
        <h1 className="font-serif text-4xl text-ink">Checkout</h1>
        <p className="mt-2 text-sm text-muted">Dine-in or takeaway. You pay at the restaurant.</p>
      </div>

      <div className="mt-6 space-y-3">
        {!restaurantStatus.isOpen && (
          <Notice tone="warning" icon={<Clock />} title={closedLine || 'Closed now'}>
            Orders can be placed during opening hours.
          </Notice>
        )}
        {apiError && (
          <Notice tone="danger" icon={<AlertCircle />} title="Your order wasn’t placed">
            {apiError}
          </Notice>
        )}
        {!isAuthenticated && (
          <Notice tone="neutral">
            You’ll be asked to{' '}
            <Link to="/login" state={{ from: { pathname: '/checkout' } }} className="inline-flex min-h-11 items-center text-ink underline underline-offset-4">
              sign in
            </Link>{' '}
            before the order is placed.
          </Notice>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid items-start gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10">
          <section aria-labelledby="type-title">
            <h2 id="type-title" className="font-serif text-xl text-ink">
              How are you eating?
            </h2>
            <SegmentedControl<OrderType>
              className="mt-4"
              label="Order type"
              value={orderType}
              onChange={setOrderType}
              options={[
                { value: 'DINE_IN', label: 'Dine-in', hint: 'At a table' },
                { value: 'TAKEAWAY', label: 'Takeaway', hint: 'Pick up at the counter' },
              ]}
            />
            {orderType === 'DINE_IN' && (
              <div className="mt-5 max-w-xs">
                {loadingTables ? (
                  <p className="text-sm text-muted" role="status">
                    Loading tables…
                  </p>
                ) : (
                  <Select
                    label="Your table"
                    helperText="The number on your table."
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    options={tables.map((t) => ({
                      value: t.tableNumber,
                      label: `Table ${t.tableNumber}${t.capacity ? ` · ${t.capacity} seats` : ''}`,
                    }))}
                  />
                )}
              </div>
            )}
          </section>

          <section aria-labelledby="contact-title" className="border-t border-line pt-10">
            <h2 id="contact-title" className="font-serif text-xl text-ink">
              Contact
            </h2>
            <div className="mt-4 max-w-sm">
              <Input
                type="tel"
                label="Phone number"
                autoComplete="tel"
                placeholder="0300 1234567"
                helperText="Only used for updates about this order."
                required
                {...register('contactPhone')}
                error={errors.contactPhone?.message}
              />
            </div>
          </section>

          <section aria-labelledby="payment-title" className="border-t border-line pt-10">
            <h2 id="payment-title" className="font-serif text-xl text-ink">
              Payment
            </h2>
            <div className="mt-4 rounded border border-line bg-surface p-4">
              <p className="text-sm font-medium text-ink">Pay at the restaurant</p>
              <p className="mt-1 text-sm text-muted">Cash or card at the counter when you eat or pick up. Nothing is charged online.</p>
            </div>
          </section>
        </div>

        <aside aria-labelledby="checkout-summary" className="rounded-lg border border-line bg-surface p-6 lg:sticky lg:top-24">
          <h2 id="checkout-summary" className="font-serif text-xl text-ink">
            Your order
          </h2>
          <ul className="mt-5 max-h-80 space-y-4 overflow-y-auto pr-1">
            {items.map((i) => {
              const linePrice = (i.unitPrice || Number(i.menuItem.price)) * i.quantity;
              const details = [i.variant?.name, ...(i.addons || []).map((a) => `+ ${a.name}`)].filter(Boolean).join(' · ');
              return (
                <li key={i.id} className="flex justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-ink">
                      <span className="tabular text-muted">{i.quantity}×</span> {i.menuItem.name}
                    </p>
                    {details && <p className="mt-0.5 text-muted">{details}</p>}
                  </div>
                  <span className="tabular shrink-0 text-ink">{formatCurrency(linePrice)}</span>
                </li>
              );
            })}
          </ul>

          <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular text-ink">{formatCurrency(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Order type</dt>
              <dd className="text-right text-ink">{orderType === 'DINE_IN' ? `Dine-in · Table ${selectedTable}` : 'Takeaway'}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-4">
              <dt className="text-base text-ink">Total</dt>
              <dd className="tabular font-serif text-2xl text-ink">{formatCurrency(subtotal)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-sm text-muted">Pay at the restaurant</p>

          <Button type="submit" size="lg" className="mt-6 w-full" isLoading={isSubmitting} disabled={!restaurantStatus.isOpen || isSubmitting}>
            <span className="tabular">
              {!restaurantStatus.isOpen ? closedLine || 'Closed now' : `Place order · ${formatCurrency(subtotal)}`}
            </span>
          </Button>
        </aside>
      </form>
    </div>
  );
};
