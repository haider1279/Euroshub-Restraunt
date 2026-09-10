import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { MenuItem, MenuCategory, ProductVariant } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DishCardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { useCart } from '../../context/CartContext';
import {
  Search,
  Plus,
  Minus,
  UtensilsCrossed,
  Filter,
  AlertCircle,
  Eye,
} from 'lucide-react';

export const MenuPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCart();

  // Active Category Filter
  const activeCategory = searchParams.get('category') || 'ALL';
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('DEFAULT');

  // Quick Dish Detail Modal State
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  // Fetch Categories
  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest<{ categories: MenuCategory[] }>('/menu-categories'),
  });

  // Fetch Menu Items with variants
  const {
    data: menuData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => apiRequest<{ items: MenuItem[] }>('/menu-items?isAvailable=true&pageSize=100'),
  });

  const rawItems = menuData?.items || [];

  const filteredItems = useMemo(() => {
    let result = [...rawItems];

    // Category filter
    if (activeCategory !== 'ALL') {
      result = result.filter((item) => item.categoryId === activeCategory);
    }

    // Search filter (name & description)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (item) => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === 'PRICE_ASC') {
      result.sort((a, b) => {
        const pA = a.variants && a.variants.length > 0 ? Number(a.variants[0].price) : Number(a.price);
        const pB = b.variants && b.variants.length > 0 ? Number(b.variants[0].price) : Number(b.price);
        return pA - pB;
      });
    } else if (sortBy === 'PRICE_DESC') {
      result.sort((a, b) => {
        const pA = a.variants && a.variants.length > 0 ? Number(a.variants[a.variants.length - 1].price) : Number(a.price);
        const pB = b.variants && b.variants.length > 0 ? Number(b.variants[b.variants.length - 1].price) : Number(b.price);
        return pB - pA;
      });
    }

    return result;
  }, [rawItems, activeCategory, searchTerm, sortBy]);

  const handleCategorySelect = (catId: string) => {
    if (catId === 'ALL') {
      searchParams.delete('category');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: catId });
    }
  };

  const openDishModal = (dish: MenuItem) => {
    setSelectedDish(dish);
    setSelectedVariant(dish.variants && dish.variants.length > 0 ? dish.variants[0] : null);
    setModalQuantity(1);
  };

  const fallbackImage =
    'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-charcoal tracking-tight">
          Our Fast-Food Menu
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed">
          Pizzas loaded with cheese, gourmet beef and chicken burgers, toasted club sandwiches, and crispy sides.
          Prepared fresh daily at Kohistan Tower, Saddar, Rawalpindi.
        </p>
      </div>

      {/* Category Pills Navigation */}
      <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-2 gap-2 no-scrollbar">
        <button
          onClick={() => handleCategorySelect('ALL')}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-bistro ${
            activeCategory === 'ALL'
              ? 'bg-terracotta text-white shadow-md'
              : 'bg-white text-charcoal-700 hover:bg-bistro-bg border border-bistro-border'
          }`}
        >
          All Items ({rawItems.length})
        </button>
        {catData?.categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategorySelect(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-bistro ${
              activeCategory === cat.id
                ? 'bg-terracotta text-white shadow-md'
                : 'bg-white text-charcoal-700 hover:bg-bistro-bg border border-bistro-border'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-bistro-border shadow-soft flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="w-full md:w-80">
          <Input
            placeholder="Search pizza, burger, fries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-charcoal-400" />}
          />
        </div>

        {/* Sorting Dropdown */}
        <div className="w-full md:w-56">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full text-xs px-3 py-2.5 bg-bistro-bg rounded-md border border-bistro-border text-charcoal font-medium focus:outline-none focus:ring-1 focus:ring-terracotta"
          >
            <option value="DEFAULT">Sort By: Recommended</option>
            <option value="PRICE_ASC">Price: Low to High</option>
            <option value="PRICE_DESC">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Dishes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <DishCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h3 className="font-serif font-bold text-red-900 mb-1">Failed to load menu items</h3>
          <p className="text-xs text-red-700 mb-4">Please verify your connection and try again.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed className="w-7 h-7" />}
          title="No menu items match your criteria"
          description="Try modifying your keyword search or selecting a different category."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchTerm('');
            handleCategorySelect('ALL');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((dish) => {
            const hasVariants = dish.variants && dish.variants.length > 0;
            const minPrice = hasVariants ? dish.variants![0].price : dish.price;
            const maxPrice = hasVariants ? dish.variants![dish.variants!.length - 1].price : dish.price;
            const hasMultiplePrices = hasVariants && dish.variants!.length > 1;

            return (
              <Card key={dish.id} hoverEffect className="flex flex-col h-full overflow-hidden p-0">
                {/* Dish Thumbnail */}
                <div
                  className="relative h-48 sm:h-52 overflow-hidden bg-charcoal-100 cursor-pointer group"
                  onClick={() => openDishModal(dish)}
                >
                  <img
                    src={dish.imageUrl || fallbackImage}
                    alt={dish.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackImage;
                    }}
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    {dish.isChefSpecial && <Badge variant="terracotta">Chef Special</Badge>}
                    {dish.isFeatured && <Badge variant="olive">Featured</Badge>}
                  </div>
                  {!dish.isAvailable && (
                    <div className="absolute inset-0 bg-charcoal-900/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded shadow-md">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>

                {/* Dish Information */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <button
                        onClick={() => openDishModal(dish)}
                        className="text-left font-serif font-bold text-base text-charcoal hover:text-terracotta transition-colors line-clamp-1"
                      >
                        {dish.name}
                      </button>
                      <span className="font-bold text-terracotta text-base ml-2 flex-shrink-0">
                        {hasMultiplePrices ? `From ${formatCurrency(minPrice)}` : formatCurrency(minPrice)}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-500 line-clamp-2 mb-3 leading-relaxed">
                      {dish.description}
                    </p>

                    {/* Variant Pills Preview */}
                    {hasVariants && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {dish.variants!.map((v) => (
                          <span
                            key={v.id || v.name}
                            className="bg-bistro-bg text-charcoal-600 text-[10px] px-2 py-0.5 rounded border border-bistro-border"
                          >
                            {v.name}: {formatCurrency(v.price)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-bistro-border flex items-center justify-between">
                    <Link
                      to={`/menu/${dish.id}`}
                      className="text-xs font-medium text-charcoal-600 hover:text-terracotta transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </Link>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!dish.isAvailable}
                      onClick={() => openDishModal(dish)}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      {hasVariants && dish.variants!.length > 1 ? 'Choose Size' : 'Add to Cart'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Dish Detail Modal */}
      {selectedDish && (
        <Modal
          isOpen={!!selectedDish}
          onClose={() => setSelectedDish(null)}
          title={selectedDish.name}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="relative h-56 sm:h-64 rounded-lg overflow-hidden bg-charcoal-100">
              <img
                src={selectedDish.imageUrl || fallbackImage}
                alt={selectedDish.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackImage;
                }}
              />
              <div className="absolute top-3 right-3">
                <span className="bg-charcoal-900/80 text-terracotta font-bold text-lg px-3 py-1 rounded-md backdrop-blur-sm border border-charcoal-700">
                  {formatCurrency(
                    selectedVariant ? selectedVariant.price : selectedDish.price
                  )}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-charcoal-700 leading-relaxed">
              {selectedDish.description}
            </p>

            {/* Variant / Size Selector */}
            {selectedDish.variants && selectedDish.variants.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-bistro-border">
                <label className="block text-xs font-bold text-charcoal">
                  Select Size / Variant:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {selectedDish.variants.map((v) => (
                    <button
                      key={v.id || v.name}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        selectedVariant?.name === v.name
                          ? 'border-terracotta bg-terracotta-50/70 text-terracotta font-bold'
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

            {/* Modal Actions */}
            <div className="pt-4 border-t border-bistro-border flex items-center justify-between gap-4">
              {/* Stepper */}
              <div className="flex items-center border border-bistro-border rounded-lg p-1 bg-bistro-bg">
                <button
                  type="button"
                  onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                  className="p-1.5 text-charcoal-600 hover:text-charcoal-900 rounded"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 font-bold text-xs text-charcoal">{modalQuantity}</span>
                <button
                  type="button"
                  onClick={() => setModalQuantity(modalQuantity + 1)}
                  className="p-1.5 text-charcoal-600 hover:text-charcoal-900 rounded"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart CTA */}
              <Button
                variant="primary"
                className="flex-1"
                disabled={!selectedDish.isAvailable}
                onClick={() => {
                  addItem(selectedDish, selectedVariant, [], modalQuantity);
                  setSelectedDish(null);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add {modalQuantity} to Cart (
                {formatCurrency(
                  (selectedVariant ? Number(selectedVariant.price) : Number(selectedDish.price)) *
                    modalQuantity
                )}
                )
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
