import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { MenuItem, ProductVariant } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useCart } from '../../context/CartContext';
import {
  ArrowLeft,
  Plus,
  Minus,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const DishDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dishDetail', id],
    queryFn: () => apiRequest<{ item: MenuItem; relatedItems: MenuItem[] }>(`/menu-items/${id}`),
    enabled: !!id,
  });

  const dish = data?.item;
  const related = data?.relatedItems || [];

  // When dish loads, select first variant by default if variants exist
  useEffect(() => {
    if (dish && dish.variants && dish.variants.length > 0) {
      setSelectedVariant(dish.variants[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [dish]);

  const fallbackImage =
    'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=800&q=80';

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-80 w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !dish) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-serif font-bold text-charcoal mb-2">Item Not Found</h2>
        <p className="text-xs text-charcoal-500 mb-6">
          The menu item you are looking for may have been removed or does not exist.
        </p>
        <Link to="/menu">
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Menu
          </Button>
        </Link>
      </div>
    );
  }

  const currentUnitPrice = selectedVariant ? Number(selectedVariant.price) : Number(dish.price);
  const totalPrice = currentUnitPrice * quantity;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Back to Menu Link */}
      <div>
        <Link
          to="/menu"
          className="inline-flex items-center text-xs font-semibold text-charcoal-600 hover:text-terracotta transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Full Menu
        </Link>
      </div>

      {/* Main Dish Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start bg-white p-6 sm:p-8 rounded-2xl border border-bistro-border shadow-soft">
        {/* Dish Hero Image */}
        <div className="md:col-span-6 relative rounded-xl overflow-hidden bg-charcoal-100 h-72 sm:h-96 shadow-md">
          <img
            src={dish.imageUrl || fallbackImage}
            alt={dish.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackImage;
            }}
          />
          <div className="absolute top-4 left-4 flex flex-col gap-1.5">
            {dish.isChefSpecial && <Badge variant="terracotta">Chef Special</Badge>}
            {dish.isFeatured && <Badge variant="olive">Featured</Badge>}
          </div>
          {!dish.isAvailable && (
            <div className="absolute inset-0 bg-charcoal-900/60 backdrop-blur-sm flex items-center justify-center">
              <span className="bg-red-600 text-white font-bold text-sm px-4 py-1.5 rounded-lg shadow-lg">
                Sold Out Today
              </span>
            </div>
          )}
        </div>

        {/* Dish Info & Ordering */}
        <div className="md:col-span-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-terracotta uppercase tracking-wider">
                {dish.category?.name || 'Fast-Food'}
              </span>
              <span className="text-2xl font-serif font-bold text-terracotta">
                {formatCurrency(currentUnitPrice)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal leading-tight">
              {dish.name}
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed">
            {dish.description}
          </p>

          {/* Variant Selector */}
          {dish.variants && dish.variants.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-bistro-border">
              <label className="block text-xs font-bold text-charcoal">
                Select Size / Serving:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {dish.variants.map((v) => (
                  <button
                    key={v.id || v.name}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      selectedVariant?.name === v.name
                        ? 'border-terracotta bg-terracotta-50/70 text-terracotta font-bold shadow-sm'
                        : 'border-bistro-border hover:bg-bistro-bg text-charcoal-700'
                    }`}
                  >
                    <div className="text-xs">{v.name}</div>
                    <div className="text-[11px] text-charcoal-500 font-medium">
                      {formatCurrency(v.price)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {dish.tags && dish.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {dish.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="bg-bistro-bg text-charcoal-700 text-xs px-2.5 py-1 rounded-md border border-bistro-border font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Ingredients */}
          {dish.ingredients && dish.ingredients.length > 0 && (
            <div className="bg-bistro-bg/70 p-4 rounded-xl border border-bistro-border space-y-2">
              <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-terracotta" /> Fresh Ingredients
              </h4>
              <ul className="grid grid-cols-2 gap-2 text-xs text-charcoal-700">
                {dish.ingredients.map((ing, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ordering Controls */}
          <div className="pt-4 border-t border-bistro-border space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-bistro-border rounded-lg bg-bistro-bg p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1.5 text-charcoal-600 hover:text-charcoal-900 rounded transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-5 font-bold text-sm text-charcoal">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1.5 text-charcoal-600 hover:text-charcoal-900 rounded transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={!dish.isAvailable}
                onClick={() => addItem(dish, selectedVariant, [], quantity)}
                leftIcon={<ShoppingBag className="w-5 h-5" />}
              >
                {dish.isAvailable
                  ? `Add to Cart • ${formatCurrency(totalPrice)}`
                  : 'Currently Unavailable'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Related Dishes From Same Category */}
      {related.length > 0 && (
        <div className="space-y-6 pt-6">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-charcoal">
            More From {dish.category?.name || 'Our Menu'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((rel) => (
              <Link key={rel.id} to={`/menu/${rel.id}`} className="group">
                <Card hoverEffect className="p-0 overflow-hidden h-full flex flex-col">
                  <div className="h-36 overflow-hidden bg-charcoal-100">
                    <img
                      src={rel.imageUrl || fallbackImage}
                      alt={rel.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = fallbackImage;
                      }}
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <h3 className="font-serif font-bold text-sm text-charcoal group-hover:text-terracotta transition-colors line-clamp-1">
                      {rel.name}
                    </h3>
                    <p className="text-xs font-bold text-terracotta mt-1">
                      {rel.variants && rel.variants.length > 1
                        ? `From ${formatCurrency(rel.variants[0].price)}`
                        : formatCurrency(rel.price)}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
