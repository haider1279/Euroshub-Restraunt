import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { categoriesQuery, menuItemsQuery } from '../../api/queries';
import { MenuItem, ProductVariant } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { cn } from '../../utils/cn';
import { useCart } from '../../context/CartContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { DishCardSkeleton, LoadingStatus, Skeleton } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { Dialog } from '../../components/ui/Dialog';
import { FoodImage } from '../../components/ui/FoodImage';
import { SegmentedControl } from '../../components/ui/Tabs';
import { QuantityStepper } from '../../components/ui/QuantityStepper';
import { DishCard } from '../../components/menu/DishCard';

const SORT_OPTIONS = [
  { value: 'DEFAULT', label: 'Recommended' },
  { value: 'PRICE_ASC', label: 'Price: low to high' },
  { value: 'PRICE_DESC', label: 'Price: high to low' },
];

export const MenuPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCart();

  // Active Category Filter
  const activeCategory = searchParams.get('category') || 'ALL';
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('DEFAULT');

  // Quick add dialog state
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  const { data: catData, isLoading: isCatLoading } = useQuery(categoriesQuery);
  const { data: menuData, isLoading, isError, refetch } = useQuery(menuItemsQuery);

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
    const availableVariants = (dish.variants || []).filter((v) => v.isAvailable !== false);
    setSelectedVariant(availableVariants.length > 0 ? availableVariants[0] : null);
    setModalQuantity(1);
  };

  const categories = catData?.categories || [];
  const activeCategoryName = categories.find((c) => c.id === activeCategory)?.name;
  const modalVariants = (selectedDish?.variants || []).filter((v) => v.isAvailable !== false);
  const modalUnitPrice = selectedDish ? (selectedVariant ? Number(selectedVariant.price) : Number(selectedDish.price)) : 0;

  const pill = (active: boolean) =>
    cn(
      'pressable inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm',
      active ? 'border-ink bg-ink text-night' : 'border-line-strong text-muted hover:border-ink/30 hover:text-ink'
    );

  return (
    <div>
      <div className="container-content">
        <header className="flex flex-col gap-6 pb-6 pt-10 sm:pt-14 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-serif text-4xl text-ink">Menu</h1>
            <p className="mt-3 max-w-xl text-base text-muted">Everything is made when you order.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_200px] md:w-[440px]">
            <Input
              type="search"
              aria-label="Search the menu"
              placeholder="Search dishes"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search />}
            />
            <Select aria-label="Sort dishes" options={SORT_OPTIONS} value={sortBy} onChange={(e) => setSortBy(e.target.value)} />
          </div>
        </header>
      </div>

      {/* Sticky category bar */}
      <div className="sticky top-16 z-30 border-y border-line bg-canvas">
        <nav aria-label="Menu categories" className="container-content">
          <div className="scroll-row -mx-4 px-4 py-2.5 sm:mx-0 sm:px-0">
            <button type="button" className={pill(activeCategory === 'ALL')} aria-pressed={activeCategory === 'ALL'} onClick={() => handleCategorySelect('ALL')}>
              All
              <span className={cn('tabular', activeCategory === 'ALL' ? 'text-night/60' : 'text-subtle')}>{rawItems.length}</span>
            </button>
            {isCatLoading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11 w-24 shrink-0 rounded-full" />)
              : categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={pill(activeCategory === cat.id)}
                    aria-pressed={activeCategory === cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
          </div>
        </nav>
      </div>

      <section className="container-content pb-24 pt-8" aria-labelledby="menu-results">
        <h2 id="menu-results" className="sr-only">
          {activeCategoryName ? `${activeCategoryName} dishes` : 'All dishes'}
        </h2>
        <p className="mb-6 text-sm text-muted" role="status" aria-live="polite">
          {!isLoading && !isError && `${filteredItems.length} ${filteredItems.length === 1 ? 'dish' : 'dishes'}`}
          {!isLoading && searchTerm.trim() && ` matching “${searchTerm.trim()}”`}
        </p>

        {isLoading ? (
          <>
            <LoadingStatus label="Loading menu" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <DishCardSkeleton key={i} />
              ))}
            </div>
          </>
        ) : isError ? (
          <ErrorState title="Couldn’t load the menu" onRetry={() => refetch()} />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="No dishes match"
            description="Try another word or category."
            actionLabel="Clear filters"
            onAction={() => {
              setSearchTerm('');
              handleCategorySelect('ALL');
            }}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((dish, i) => (
              <DishCard key={dish.id} dish={dish} onQuickAdd={openDishModal} priority={i === 0} />
            ))}
          </div>
        )}
      </section>

      {/* Quick add */}
      {selectedDish && (
        <Dialog isOpen={!!selectedDish} onClose={() => setSelectedDish(null)} title={selectedDish.name} maxWidth="lg">
          <div className="space-y-5">
            <div className="aspect-[16/9] overflow-hidden rounded">
              <FoodImage src={selectedDish.imageUrl} alt={selectedDish.name} category={selectedDish.category?.name} width={960} height={540} />
            </div>
            {selectedDish.description && <p className="text-sm text-muted">{selectedDish.description}</p>}

            {modalVariants.length > 0 && (
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-muted">Choose an option</legend>
                <SegmentedControl
                  label="Choose an option"
                  value={selectedVariant?.id ?? null}
                  onChange={(id) => setSelectedVariant(modalVariants.find((v) => v.id === id) || null)}
                  options={modalVariants.map((v) => ({ value: v.id, label: v.name, hint: formatCurrency(v.price) }))}
                />
              </fieldset>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
              <QuantityStepper
                value={modalQuantity}
                label={`Quantity for ${selectedDish.name}`}
                onDecrease={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                onIncrease={() => setModalQuantity(modalQuantity + 1)}
              />
              <Button
                className="flex-1"
                disabled={!selectedDish.isAvailable}
                onClick={() => {
                  addItem(selectedDish, selectedVariant, [], modalQuantity);
                  setSelectedDish(null);
                }}
              >
                <span className="tabular">Add to cart · {formatCurrency(modalUnitPrice * modalQuantity)}</span>
              </Button>
            </div>
            <Link to={`/menu/${selectedDish.id}`} className="inline-flex min-h-11 items-center text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
              See full details and add-ons
            </Link>
          </div>
        </Dialog>
      )}
    </div>
  );
};
