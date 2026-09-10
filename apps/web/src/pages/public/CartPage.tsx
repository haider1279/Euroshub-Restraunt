import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency } from '../../utils/currency';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const { items, subtotal, deliveryFee, total, updateQuantity, removeItem, clearCart } = useCart();
  const { settings } = useRestaurant();

  const hasUnavailableItems = items.some((i) => !i.menuItem.isAvailable);

  const fallbackImage =
    'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=800&q=80';

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8" />}
          title="Your cart is empty"
          description="You have not added any fast-food items to your cart yet. Explore our freshly prepared pizzas, burgers, and sandwiches to get started."
          actionLabel="Explore Our Menu"
          actionHref="/menu"
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Title & Clear Action */}
      <div className="flex items-center justify-between pb-6 border-b border-bistro-border">
        <div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-charcoal tracking-tight">
            Your Cart
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
            Review your order before proceeding to checkout.
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-charcoal-500 hover:text-red-600 transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear All Items
        </button>
      </div>

      {/* Unavailable item warning banner */}
      {hasUnavailableItems && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3 text-amber-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">One or more items in your cart are currently unavailable</p>
            <p className="mt-0.5 text-amber-800">
              Please remove marked items to proceed to checkout.
            </p>
          </div>
        </div>
      )}

      {/* Cart Grid: Items list (8 cols) + Summary Card (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => {
            const { id, menuItem, variant, quantity } = item;
            const unitPrice = item.unitPrice || Number(menuItem.price);
            const lineTotal = unitPrice * quantity;

            return (
              <Card key={id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4">
                {/* Thumbnail */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-charcoal-100 flex-shrink-0">
                  <img
                    src={menuItem.imageUrl || fallbackImage}
                    alt={menuItem.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackImage;
                    }}
                  />
                  {!menuItem.isAvailable && (
                    <div className="absolute inset-0 bg-charcoal-900/70 flex items-center justify-center p-1 text-center">
                      <span className="text-[10px] font-bold text-white bg-red-600 px-1 py-0.5 rounded">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 text-center sm:text-left min-w-0">
                  <h3 className="font-serif font-bold text-base text-charcoal truncate">
                    {menuItem.name}
                    {variant && (
                      <span className="text-xs font-sans font-medium text-terracotta ml-2 px-2 py-0.5 bg-terracotta/10 rounded">
                        {variant.name}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-charcoal-500 mt-0.5 font-medium">
                    {formatCurrency(unitPrice)} each
                  </p>
                  {!menuItem.isAvailable && (
                    <p className="text-xs text-red-600 font-semibold mt-1">
                      Item is sold out. Please remove to continue.
                    </p>
                  )}
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-bistro-border rounded-md bg-bistro-bg p-0.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(id, quantity - 1)}
                      className="p-1 text-charcoal-600 hover:text-charcoal-900 rounded transition-colors"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 font-semibold text-xs text-charcoal">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(id, quantity + 1)}
                      className="p-1 text-charcoal-600 hover:text-charcoal-900 rounded transition-colors"
                      title="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right min-w-[80px]">
                    <span className="font-bold text-charcoal text-sm">
                      {formatCurrency(lineTotal)}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(id)}
                    className="text-charcoal-400 hover:text-red-600 transition-colors p-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}

          <div className="pt-2">
            <Link
              to="/menu"
              className="inline-flex items-center text-xs font-semibold text-terracotta hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Add more items from menu
            </Link>
          </div>
        </div>

        {/* Order Summary Sidebar Card */}
        <div className="lg:col-span-4">
          <Card className="p-6 space-y-6">
            <h3 className="font-serif font-bold text-lg text-charcoal pb-3 border-b border-bistro-border">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-charcoal-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-charcoal-900">{formatCurrency(subtotal)}</span>
              </div>
              {settings.deliveryEnabled && (
                <div className="flex justify-between text-charcoal-600">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-charcoal-900">{formatCurrency(deliveryFee)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-bistro-border flex justify-between items-baseline">
                <span className="text-sm font-bold text-charcoal">Subtotal (PKR)</span>
                <span className="text-xl font-serif font-bold text-terracotta">
                  {formatCurrency(subtotal)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link to="/checkout">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={hasUnavailableItems}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Proceed to Checkout
                </Button>
              </Link>
            </div>

            <div className="bg-bistro-bg p-3.5 rounded-lg border border-bistro-border text-[11px] text-charcoal-600 space-y-1">
              <p className="flex items-center gap-1.5 font-semibold text-charcoal-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Server-Verified Prices
              </p>
              <p>Prices and variants are re-verified by the restaurant API at checkout.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
