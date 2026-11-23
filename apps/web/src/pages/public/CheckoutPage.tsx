import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { apiRequest, api } from '../../api/client';
import { Order, OrderType, RestaurantTable } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { checkRestaurantStatus } from '../../utils/hours';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { toast } from 'sonner';
import {
  Utensils,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

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
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-serif font-bold text-charcoal mb-2">Your Cart is Empty</h2>
        <p className="text-xs text-charcoal-500 mb-6">
          Please add items to your cart before proceeding to checkout.
        </p>
        <Link to="/menu">
          <Button variant="primary">Browse Menu</Button>
        </Link>
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Checkout Header */}
      <div className="border-b border-bistro-border pb-6">
        <h1 className="text-2xl sm:text-4xl font-serif font-bold text-charcoal tracking-tight">
          Checkout
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
          Complete your order details. Dine-in and Takeaway available daily at Kohistan Tower, Saddar.
        </p>
      </div>

      {!restaurantStatus.isOpen && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-900 dark:text-amber-200 text-xs">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-bold">{restaurantStatus.formattedMessage}</p>
            <p className="mt-0.5 text-charcoal-600 dark:text-charcoal-400">
              Orders cannot be placed while the restaurant is closed. Please check back during opening hours.
            </p>
          </div>
        </div>
      )}

      {apiError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 text-xs">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Order Placement Error</p>
            <p className="mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Order Type Selector (Dine-In or Takeaway ONLY) */}
            <Card className="p-6 space-y-4">
              <h2 className="font-serif font-bold text-base text-charcoal flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-terracotta text-white flex items-center justify-center text-xs font-sans font-bold">
                  1
                </span>
                Select Order Type
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOrderType('DINE_IN')}
                  className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                    orderType === 'DINE_IN'
                      ? 'border-terracotta bg-terracotta-50/60 text-terracotta font-semibold shadow-sm'
                      : 'border-bistro-border hover:bg-bistro-bg text-charcoal-700'
                  }`}
                >
                  <Utensils className="w-5 h-5" />
                  <span className="text-sm">Dine-In</span>
                  <span className="text-[11px] text-charcoal-400 font-normal">Eat at restaurant table</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType('TAKEAWAY')}
                  className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                    orderType === 'TAKEAWAY'
                      ? 'border-terracotta bg-terracotta-50/60 text-terracotta font-semibold shadow-sm'
                      : 'border-bistro-border hover:bg-bistro-bg text-charcoal-700'
                  }`}
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span className="text-sm">Takeaway</span>
                  <span className="text-[11px] text-charcoal-400 font-normal">Pick up at counter</span>
                </button>
              </div>

              {/* Dine-in Table Selection (01–100) */}
              {orderType === 'DINE_IN' && (
                <div className="pt-3 border-t border-bistro-border space-y-2">
                  <label className="block text-xs font-semibold text-charcoal">
                    Select Your Table Number (01–100)
                  </label>
                  {loadingTables ? (
                    <p className="text-xs text-charcoal-400">Loading active tables...</p>
                  ) : (
                    <select
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-white border border-bistro-border rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta"
                    >
                      {tables.map((t) => (
                        <option key={t.id || t.tableNumber} value={t.tableNumber}>
                          Table {t.tableNumber} {t.capacity ? `(${t.capacity} seats)` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-[11px] text-charcoal-400 italic">
                    Choose the table where you are seated at Kohistan Tower.
                  </p>
                </div>
              )}
            </Card>

            {/* Step 2: Contact Details */}
            <Card className="p-6 space-y-4">
              <h2 className="font-serif font-bold text-base text-charcoal flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-terracotta text-white flex items-center justify-center text-xs font-sans font-bold">
                  2
                </span>
                Contact Information
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Contact Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    placeholder="0300 1234567"
                    {...register('contactPhone')}
                    error={errors.contactPhone?.message}
                  />
                  <p className="text-[11px] text-charcoal-400 mt-1">
                    We will use this phone number to update you about your order status.
                  </p>
                </div>
              </div>
            </Card>

            {/* Step 3: Payment Method (Fixed to Pay at Restaurant) */}
            <Card className="p-6 space-y-3">
              <h2 className="font-serif font-bold text-base text-charcoal flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-terracotta text-white flex items-center justify-center text-xs font-sans font-bold">
                  3
                </span>
                Payment Method
              </h2>

              <div className="p-4 rounded-xl border border-emerald-500 bg-emerald-50/50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-charcoal">Pay at Restaurant</p>
                    <p className="text-[11px] text-charcoal-500">
                      Pay with Cash or Card at our counter upon dining or pickup.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>
            </Card>
          </div>

          {/* Sidebar Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="font-serif font-bold text-base text-charcoal pb-3 border-b border-bistro-border">
                Your Order Items ({items.length})
              </h3>

              {/* Items List */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {items.map((i) => {
                  const linePrice = (i.unitPrice || Number(i.menuItem.price)) * i.quantity;
                  return (
                    <div key={i.id} className="flex justify-between items-start text-xs gap-2">
                      <div>
                        <p className="font-bold text-charcoal">
                          {i.quantity}x {i.menuItem.name}
                        </p>
                        {i.variant && (
                          <p className="text-[11px] text-terracotta font-medium">
                            Variant: {i.variant.name}
                          </p>
                        )}
                      </div>
                      <span className="font-semibold text-charcoal-800">
                        {formatCurrency(linePrice)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="pt-3 border-t border-bistro-border space-y-2 text-xs">
                <div className="flex justify-between text-charcoal-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-charcoal-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-charcoal-600">
                  <span>Order Type</span>
                  <span className="font-semibold text-charcoal-900">
                    {orderType === 'DINE_IN' ? `Dine-In (Table ${selectedTable})` : 'Takeaway (Counter)'}
                  </span>
                </div>
                <div className="pt-2 border-t border-bistro-border flex justify-between items-baseline">
                  <span className="text-sm font-bold text-charcoal">Total Amount (PKR)</span>
                  <span className="text-xl font-serif font-bold text-terracotta">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
                disabled={!restaurantStatus.isOpen || isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {!restaurantStatus.isOpen ? restaurantStatus.formattedMessage : `Place Order (${formatCurrency(subtotal)})`}
              </Button>

              <div className="bg-bistro-bg p-3 rounded-lg border border-bistro-border text-[11px] text-charcoal-600 space-y-1">
                <p className="flex items-center gap-1.5 font-semibold text-charcoal-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Authorized Fast-Food Kitchen
                </p>
                <p>
                  Euroshub Kitchen — Kohistan Tower, Saddar, Rawalpindi. Daily 9:00 AM – 12:00 AM (Midnight).
                </p>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};
