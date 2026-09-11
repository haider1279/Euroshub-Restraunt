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
import { FoodImage } from '../../components/ui/FoodImage';
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

  // When dish loads, select first AVAILABLE variant by default
  useEffect(() => {
    if (dish && dish.variants && dish.variants.length > 0) {
      const firstAvailable = dish.variants.find((v) => v.isAvailable !== false) || null;
      setSelectedVariant(firstAvailable);
    } else {
      setSelectedVariant(null);
    }
  }, [dish]);

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
        <h2 className="text-xl font-serif font-bold text-charcoal dark:text-charcoal-100 mb-2">Item Not Found</h2>
        <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-6">
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
          className="inline-flex items-center text-xs font-semibold text-charcoal-600 dark:text-charcoal-300 hover:text-terracotta dark:hover:text-terracotta transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Full Menu
        </Link>
      </div>

      {/* Main Dish Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start bg-white dark:bg-charcoal-850 p-6 sm:p-8 rounded-2xl border border-bistro-border dark:border-charcoal-700 shadow-soft">
        {/* Dish Hero Image */}
        <div className="md:col-span-6 relative rounded-xl overflow-hidden bg-charcoal-100 dark:bg-charcoal-800 h-72 sm:h-96 shadow-md">
          <FoodImage
            src={dish.imageUrl}
            alt={dish.name}
            category={dish.category?.name}
            className="w-full h-full object-cover"
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
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal dark:text-charcoal-100 leading-tight">
              {dish.name}
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
            {dish.description}
          </p>

          {/* Variant Selector — only shows enabled variants */}
          {dish.variants && dish.variants.filter((v) => v.isAvailable !== false).length > 0 && (
            <div className="space-y-2 pt-2 border-t border-bistro-border dark:border-charcoal-700">
              <label className="block text-xs font-bold text-charcoal dark:text-charcoal-200">
                Choose an Option:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {dish.variants
                  .filter((v) => v.isAvailable !== false)
                  .map((v) => (
                  <button
                    key={v.id || v.name}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      selectedVariant?.name === v.name
                        ? 'border-terracotta bg-terracotta/10 text-terracotta font-bold shadow-sm'
                        : 'border-bistro-border dark:border-charcoal-700 hover:bg-bistro-bg dark:hover:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-200'
                    }`}
                  >
                    <div className="text-xs font-semibold">{v.name}</div>
                    <div className="text-[11px] text-charcoal-500 dark:text-charcoal-400 font-medium mt-0.5">
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
                  className="bg-bistro-bg dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 text-xs px-2.5 py-1 rounded-md border border-bistro-border dark:border-charcoal-700 font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Ingredients */}
          {dish.ingredients && dish.ingredients.length > 0 && (
            <div className="bg-bistro-bg/70 dark:bg-charcoal-800/70 p-4 rounded-xl border border-bistro-border dark:border-charcoal-700 space-y-2">
              <h4 className="text-xs font-bold text-charcoal dark:text-charcoal-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-terracotta" /> Fresh Ingredients
              </h4>
              <ul className="grid grid-cols-2 gap-2 text-xs text-charcoal-700 dark:text-charcoal-300">
                {dish.ingredients.map((ing, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 flex-shrink-0" />
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ordering Controls */}
          <div className="pt-4 border-t border-bistro-border dark:border-charcoal-700 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-bistro-border dark:border-charcoal-700 rounded-lg bg-bistro-bg dark:bg-charcoal-800 p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1.5 text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-charcoal-100 rounded transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-5 font-bold text-sm text-charcoal dark:text-charcoal-100">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1.5 text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-charcoal-100 rounded transition-colors"
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
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-charcoal dark:text-charcoal-100">
            More From {dish.category?.name || 'Our Menu'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((rel) => (
              <Link key={rel.id} to={`/menu/${rel.id}`} className="group">
                <Card hoverEffect className="p-0 overflow-hidden h-full flex flex-col">
                  <div className="h-36 overflow-hidden bg-charcoal-100 dark:bg-charcoal-800">
                    <FoodImage
                      src={rel.imageUrl}
                      alt={rel.name}
                      category={rel.category?.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <h3 className="font-serif font-bold text-sm text-charcoal dark:text-charcoal-100 group-hover:text-terracotta transition-colors line-clamp-1">
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
