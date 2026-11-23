import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency } from '../../utils/currency';
import { ButtonLink, Button } from '../../components/ui/Button';
import { EmptyState, Notice } from '../../components/ui/EmptyState';
import { FoodImage } from '../../components/ui/FoodImage';
import { QuantityStepper } from '../../components/ui/QuantityStepper';

export const CartPage: React.FC = () => {
  const { items, subtotal, deliveryFee, updateQuantity, removeItem, clearCart } = useCart();
  const { settings } = useRestaurant();

  const hasUnavailableItems = items.some((i) => !i.menuItem.isAvailable);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="container-content py-16 sm:py-24">
        <h1 className="font-serif text-4xl text-ink">Your cart</h1>
        <EmptyState
          className="mt-8 max-w-lg"
          title="Nothing here yet"
          description="Add a few dishes from the menu and they’ll show up here."
          actionLabel="Browse the menu"
          actionHref="/menu"
        />
      </div>
    );
  }

  return (
    <div className="container-content pb-24 pt-10 sm:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-serif text-4xl text-ink">Your cart</h1>
          <p className="tabular mt-2 text-sm text-muted">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={clearCart}>
          Clear cart
        </Button>
      </div>

      {hasUnavailableItems && (
        <Notice tone="warning" icon={<AlertTriangle />} title="Some items are sold out" className="mt-6">
          Remove them to continue to checkout.
        </Notice>
      )}

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1fr_360px]">
        <section aria-label="Items in your cart">
          <ul className="divide-y divide-line border-b border-line">
            {items.map((item) => {
              const { id, menuItem, variant, addons, quantity } = item;
              const unitPrice = item.unitPrice || Number(menuItem.price);
              const lineTotal = unitPrice * quantity;

              return (
                <li key={id} className="flex gap-4 py-5 first:pt-0">
                  <Link to={`/menu/${menuItem.id}`} className="h-20 w-20 shrink-0 overflow-hidden rounded sm:h-24 sm:w-24" tabIndex={-1} aria-hidden="true">
                    <FoodImage src={menuItem.imageUrl} alt="" category={menuItem.category?.name} width={192} height={192} />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="font-sans text-base font-medium text-ink">
                        <Link to={`/menu/${menuItem.id}`} className="hover:underline">
                          {menuItem.name}
                        </Link>
                      </h2>
                      <p className="mt-0.5 text-sm text-muted">
                        {[variant?.name, ...(addons || []).map((a) => `+ ${a.name}`)].filter(Boolean).join(' · ') || 'Regular'}
                      </p>
                      <p className="tabular mt-1 text-sm text-muted">{formatCurrency(unitPrice)} each</p>
                      {!menuItem.isAvailable && <p className="mt-1 text-sm text-warning">Sold out. Remove to continue.</p>}
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <QuantityStepper
                        size="sm"
                        value={quantity}
                        removeAtOne
                        label={`Quantity for ${menuItem.name}`}
                        onDecrease={() => updateQuantity(id, quantity - 1)}
                        onIncrease={() => updateQuantity(id, quantity + 1)}
                      />
                      <div className="flex items-center gap-1 sm:flex-col sm:items-end sm:gap-0">
                        <p className="tabular text-base text-ink">{formatCurrency(lineTotal)}</p>
                        <button
                          type="button"
                          onClick={() => removeItem(id)}
                          className="inline-flex min-h-11 items-center px-2 text-sm text-muted underline-offset-4 hover:text-danger hover:underline sm:min-h-9 sm:px-0"
                        >
                          Remove<span className="sr-only"> {menuItem.name}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <Link to="/menu" className="mt-4 inline-flex min-h-11 items-center text-sm text-muted hover:text-ink">
            Add more dishes
          </Link>
        </section>

        <aside aria-labelledby="summary-title" className="rounded-lg border border-line bg-surface p-6 lg:sticky lg:top-24">
          <h2 id="summary-title" className="font-serif text-xl text-ink">
            Summary
          </h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular text-ink">{formatCurrency(subtotal)}</dd>
            </div>
            {settings.deliveryEnabled && (
              <div className="flex justify-between">
                <dt className="text-muted">Delivery fee</dt>
                <dd className="tabular text-ink">{formatCurrency(deliveryFee)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-line pt-4">
              <dt className="text-base text-ink">Total</dt>
              <dd className="tabular font-serif text-2xl text-ink">{formatCurrency(subtotal)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-sm text-muted">Pay at the restaurant. Prices are confirmed when you place the order.</p>
          <ButtonLink to="/checkout" size="lg" className="mt-6 w-full" disabled={hasUnavailableItems}>
            Go to checkout
          </ButtonLink>
        </aside>
      </div>
    </div>
  );
};
