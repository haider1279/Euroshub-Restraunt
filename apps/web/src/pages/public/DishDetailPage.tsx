import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { MenuItem, ProductAddon, ProductVariant } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { useCart } from '../../context/CartContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton, LoadingStatus } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { FoodImage } from '../../components/ui/FoodImage';
import { SegmentedControl } from '../../components/ui/Tabs';
import { Checkbox } from '../../components/ui/Checkbox';
import { QuantityStepper } from '../../components/ui/QuantityStepper';
import { DishCard } from '../../components/menu/DishCard';

export const DishDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<ProductAddon[]>([]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dishDetail', id],
    queryFn: () => apiRequest<{ item: MenuItem; relatedItems: MenuItem[] }>(`/menu-items/${id}`),
    enabled: !!id,
  });

  const dish = data?.item;
  const related = data?.relatedItems || [];

  // When dish loads, select first AVAILABLE variant by default
  useEffect(() => {
    if (dish && dish.variants && dish.variants.length > 0) {
      const firstAvailable = dish.variants.find((v) => v.isAvailable !== false) || null;
      setSelectedVariant(firstAvailable);
    } else {
      setSelectedVariant(null);
    }
    setSelectedAddons([]);
    setQuantity(1);
  }, [dish]);

  if (isLoading) {
    return (
      <div className="container-content py-10 sm:py-14">
        <LoadingStatus label="Loading dish" />
        <Skeleton className="h-5 w-24" />
        <div className="mt-8 grid gap-10 md:grid-cols-2">
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !dish) {
    return (
      <div className="container-content py-16">
        <EmptyState
          title="This dish isn’t available"
          description="It may have been removed from the menu."
          actionLabel="Back to the menu"
          actionHref="/menu"
        />
      </div>
    );
  }

  const variants = (dish.variants || []).filter((v) => v.isAvailable !== false);
  const addons = (dish.addonLinks || []).map((l) => l.addon).filter((a) => a && a.isAvailable !== false);
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + Number(a.price), 0);
  const currentUnitPrice = (selectedVariant ? Number(selectedVariant.price) : Number(dish.price)) + addonsTotal;
  const totalPrice = currentUnitPrice * quantity;

  const toggleAddon = (addon: ProductAddon, checked: boolean) =>
    setSelectedAddons((prev) => (checked ? [...prev, addon] : prev.filter((a) => a.id !== addon.id)));

  const handleAdd = () => addItem(dish, selectedVariant, selectedAddons, quantity);
  const addLabel = dish.isAvailable ? `Add to cart · ${formatCurrency(totalPrice)}` : 'Sold out today';

  return (
    <div className="pb-28 md:pb-0">
      <div className="container-content py-8 sm:py-12">
        <Link to="/menu" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Menu
        </Link>

        <div className="mt-4 grid items-start gap-8 md:grid-cols-2 md:gap-12">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-line md:sticky md:top-24">
            <FoodImage src={dish.imageUrl} alt={dish.name} category={dish.category?.name} priority width={960} height={720} />
            {!dish.isAvailable && (
              <Badge variant="neutral" className="absolute left-4 top-4 bg-night/90">
                Sold out today
              </Badge>
            )}
          </div>

          <div>
            {dish.category?.name && <p className="eyebrow">{dish.category.name}</p>}
            <h1 className="mt-3 font-serif text-4xl text-ink">{dish.name}</h1>
            <p className="tabular mt-4 font-serif text-2xl text-ink">{formatCurrency(currentUnitPrice)}</p>
            {dish.description && <p className="mt-5 text-base text-muted">{dish.description}</p>}

            {variants.length > 0 && (
              <fieldset className="mt-8">
                <legend className="mb-3 text-sm font-medium text-ink">Size</legend>
                <SegmentedControl
                  label="Size"
                  value={selectedVariant?.id ?? null}
                  onChange={(vid) => setSelectedVariant(variants.find((v) => v.id === vid) || null)}
                  options={variants.map((v) => ({ value: v.id, label: v.name, hint: formatCurrency(v.price) }))}
                />
              </fieldset>
            )}

            {addons.length > 0 && (
              <fieldset className="mt-8">
                <legend className="mb-3 text-sm font-medium text-ink">
                  Add-ons <span className="font-normal text-muted">(optional)</span>
                </legend>
                <div className="grid gap-2">
                  {addons.map((addon) => (
                    <Checkbox
                      key={addon.id}
                      label={addon.name}
                      aside={`+ ${formatCurrency(addon.price)}`}
                      checked={selectedAddons.some((a) => a.id === addon.id)}
                      onChange={(e) => toggleAddon(addon, e.target.checked)}
                    />
                  ))}
                </div>
              </fieldset>
            )}

            {dish.ingredients && dish.ingredients.length > 0 && (
              <div className="mt-8">
                <h2 className="font-sans text-sm font-medium text-ink">Ingredients</h2>
                <p className="mt-2 text-sm text-muted">{dish.ingredients.join(', ')}</p>
              </div>
            )}

            {dish.tags && dish.tags.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tags">
                {dish.tags.map((t, idx) => (
                  <li key={idx}>
                    <Badge variant="neutral">{t}</Badge>
                  </li>
                ))}
              </ul>
            )}

            {/* Desktop add-to-cart */}
            <div className="mt-10 hidden items-center gap-3 border-t border-line pt-6 md:flex">
              <QuantityStepper
                value={quantity}
                label={`Quantity for ${dish.name}`}
                onDecrease={() => setQuantity(Math.max(1, quantity - 1))}
                onIncrease={() => setQuantity(quantity + 1)}
              />
              <Button size="lg" className="flex-1" disabled={!dish.isAvailable} onClick={handleAdd}>
                <span className="tabular">{addLabel}</span>
              </Button>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-24 border-t border-line pt-12" aria-labelledby="related-title">
            <h2 id="related-title" className="font-serif text-2xl text-ink">
              More {dish.category?.name ? dish.category.name.toLowerCase() : 'from the menu'}
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((rel) => (
                <DishCard key={rel.id} dish={rel} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile sticky add-to-cart bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas px-4 py-3 md:hidden" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-3">
          <QuantityStepper
            value={quantity}
            label={`Quantity for ${dish.name}`}
            onDecrease={() => setQuantity(Math.max(1, quantity - 1))}
            onIncrease={() => setQuantity(quantity + 1)}
          />
          <Button className="flex-1" disabled={!dish.isAvailable} onClick={handleAdd}>
            <span className="tabular">{addLabel}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
