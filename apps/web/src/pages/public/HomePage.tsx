import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { MenuItem, MenuCategory, Review } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import { useCart } from '../../context/CartContext';
import { useTableAvailability } from '../../hooks/useTableAvailability';
import { formatCurrency } from '../../utils/currency';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { FoodImage } from '../../components/ui/FoodImage';
import {
  Utensils,
  Calendar,
  Flame,
  Star,
  Clock,
  MapPin,
  ArrowRight,
  Sparkles,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { addItem } = useCart();
  const { settings } = useRestaurant();
  const { data: tableAvailability } = useTableAvailability();

  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const [isAllReviewsOpen, setIsAllReviewsOpen] = useState(false);

  // Fetch Categories
  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest<{ categories: MenuCategory[] }>('/menu-categories'),
  });

  // Fetch Chef Specials
  const { data: chefSpecialData } = useQuery({
    queryKey: ['chefSpecials'],
    queryFn: () => apiRequest<{ items: MenuItem[] }>('/menu-items/chef-specials'),
  });

  // Fetch Featured Items
  const { data: featuredData } = useQuery({
    queryKey: ['featuredItems'],
    queryFn: () => apiRequest<{ items: MenuItem[] }>('/menu-items/featured'),
  });

  // Fetch Popular Items (from real order history only)
  const { data: popularData } = useQuery({
    queryKey: ['popularItems'],
    queryFn: () => apiRequest<{ items: MenuItem[] }>('/menu-items/popular'),
  });

  // Fetch Public Reviews (with aggregate ratings)
  const { data: reviewData } = useQuery({
    queryKey: ['publicReviews'],
    queryFn: () => apiRequest<{ reviews: Review[]; averageRating?: number | null; totalReviews?: number }>('/reviews'),
  });

  // Fallback items query to showcase top dishes if featured not yet manually flagged
  const { data: allMenuData, isLoading: isMenuLoading } = useQuery({
    queryKey: ['homeMenuSample'],
    queryFn: () => apiRequest<{ items: MenuItem[] }>('/menu-items?pageSize=6'),
  });

  const chefSpecials = chefSpecialData?.items || [];
  const featuredItems = featuredData?.items || [];
  const popularItems = popularData?.items || [];
  const reviews = reviewData?.reviews || [];
  const averageRating = reviewData?.averageRating;
  const totalReviewsCount = reviewData?.totalReviews ?? reviews.length;
  const sampleItems = allMenuData?.items || [];

  // Dynamic Signature Item from Settings
  const signatureItem = settings.signatureMenuItem;
  const signatureName = signatureItem?.name || 'Euroshub Kitchen Special';
  const signatureDesc =
    signatureItem?.description ||
    'Freshly prepared daily with selected artisanal ingredients at Kohistan Tower, Saddar.';
  const signatureImage = signatureItem?.imageUrl || '';
  const signatureAvailableVariants = (signatureItem?.variants || []).filter((v: any) => v.isAvailable !== false);
  const signaturePrice =
    signatureAvailableVariants.length > 0
      ? Math.min(...signatureAvailableVariants.map((v: any) => Number(v.price)))
      : signatureItem?.price ?? 700;
  const signatureVariantCount = signatureItem?.variants?.length ?? 0;
  const signatureCategoryName = signatureItem?.category?.name || 'Signature Item';
  const signatureTargetUrl = signatureItem?.id ? `/menu/${signatureItem.id}` : '/menu';

  // Dynamic Table Counts
  const totalTables = tableAvailability?.totalTables || settings.tableCount || 100;
  const availableTables = tableAvailability?.availableTables ?? totalTables;

  // Dynamic Opening Hours
  const defaultHours = '9:00 AM – 12:00 PM';
  const openingHoursText = settings.openingHours?.monday
    ? `${settings.openingHours.monday.open} – ${settings.openingHours.monday.close}`
    : defaultHours;

  const toggleReviewExpand = (reviewId: string) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* ── 1. Hero Section ── */}
      <section className="relative bg-charcoal-900 text-white overflow-hidden py-20 sm:py-28 lg:py-32">
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&auto=format&fit=crop&q=80)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-charcoal-800/90 border border-charcoal-700 px-3.5 py-1.5 rounded-full text-xs font-medium text-terracotta-300">
              <span className="w-2 h-2 rounded-full bg-terracotta animate-pulse" />
              <span>Modern Fast-Food • Saddar, Rawalpindi</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white leading-tight">
              {settings.headline || 'Fresh, Hot & Fast in Rawalpindi'}
            </h1>
            <p className="text-base sm:text-lg text-charcoal-200 max-w-2xl leading-relaxed">
              {settings.subtitle ||
                'Crispy burgers, loaded pizzas, and artisanal sandwiches prepared daily at Kohistan Tower, Saddar.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Link to="/menu" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto shadow-md"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Explore Our Menu
                </Button>
              </Link>
              <Link to="/reservation" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-charcoal-800/80 border-charcoal-600 text-white hover:bg-charcoal-700 hover:border-charcoal-500"
                  leftIcon={<Calendar className="w-4 h-4 text-terracotta-300" />}
                >
                  Reserve a Table
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center sm:justify-start space-x-8 pt-6 border-t border-charcoal-800 text-xs text-charcoal-300">
              <div>
                <span className="block text-white font-bold text-lg font-serif">{totalTables}</span>
                <span>Dine-In Tables</span>
              </div>
              <div className="border-l border-charcoal-800 pl-8">
                <span className="block text-white font-bold text-lg font-serif flex items-center gap-1">
                  {averageRating ? `${averageRating} ★` : '5.0 ★'}
                </span>
                <span>
                  {totalReviewsCount > 0 ? `${totalReviewsCount} Customer Reviews` : 'Verified Dining'}
                </span>
              </div>
              <div className="border-l border-charcoal-800 pl-8">
                <span className="block text-white font-bold text-lg font-serif">Daily</span>
                <span>{openingHoursText}</span>
              </div>
            </div>
          </div>

          {/* Hero Featured Showcase Card — Dynamic from Restaurant Settings */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md bg-charcoal-800/90 rounded-2xl p-4 border border-charcoal-700 shadow-2xl backdrop-blur-md">
              <Link to={signatureTargetUrl} className="block group">
                <div className="relative h-64 sm:h-72 rounded-xl overflow-hidden mb-4 bg-charcoal-900">
                  <FoodImage
                    src={signatureImage}
                    alt={signatureName}
                    categoryName={signatureCategoryName}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3 z-10">
                    <Badge variant="terracotta">{signatureCategoryName}</Badge>
                  </div>
                  <div className="absolute bottom-3 right-3 z-10 bg-charcoal-900/90 backdrop-blur-sm text-terracotta-300 px-3 py-1 rounded-lg font-bold text-sm border border-charcoal-700">
                    From {formatCurrency(signaturePrice)}
                  </div>
                </div>
              </Link>
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <Link to={signatureTargetUrl} className="hover:text-terracotta-300 transition-colors">
                    <h3 className="font-serif font-bold text-lg text-white">{signatureName}</h3>
                  </Link>
                  {signatureVariantCount > 1 && (
                    <span className="text-xs text-charcoal-300 font-medium">
                      {signatureVariantCount} Size Options
                    </span>
                  )}
                </div>
                <p className="text-xs text-charcoal-300 line-clamp-2">{signatureDesc}</p>
                <div className="pt-2">
                  <Link to={signatureTargetUrl}>
                    <Button variant="primary" size="sm" className="w-full">
                      Order at Euroshub
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Category Navigation Section ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal dark:text-white tracking-tight">
            Menu Categories
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-600 dark:text-charcoal-300">
            Handcrafted fast-food favorites prepared to order with verified ingredients.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {catData?.categories?.map((cat) => (
            <Link key={cat.id} to={`/menu?category=${cat.id}`} className="group">
              <Card
                hoverEffect
                className="p-6 text-center space-y-3 border border-bistro-border dark:border-charcoal-700 group-hover:border-terracotta dark:group-hover:border-terracotta transition-all"
              >
                <div className="w-12 h-12 mx-auto rounded-xl bg-terracotta-50 dark:bg-charcoal-800 text-terracotta flex items-center justify-center group-hover:bg-terracotta group-hover:text-white transition-colors shadow-sm">
                  <Utensils className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-charcoal dark:text-white group-hover:text-terracotta transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400 mt-0.5 font-medium">
                    {cat._count?.items ?? ''} Items Available
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 3. Chef Special Section (Renders ONLY if ≥1 item flagged isChefSpecial) ── */}
      {chefSpecials.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8 border-b border-bistro-border dark:border-charcoal-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-terracotta uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" /> Chef's Recommendation
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal dark:text-white">
                Chef Specials
              </h2>
            </div>
            <Link to="/menu" className="text-xs font-bold text-terracotta hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {chefSpecials.map((dish) => (
              <Card key={dish.id} hoverEffect className="p-0 overflow-hidden flex flex-col h-full border border-bistro-border dark:border-charcoal-700">
                <Link to={`/menu/${dish.id}`} className="block relative h-48 bg-charcoal-100 dark:bg-charcoal-850 overflow-hidden group">
                  <FoodImage
                    src={dish.imageUrl}
                    alt={dish.name}
                    categoryName="Chef Special"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 z-10">
                    <Badge variant="terracotta">Chef Special</Badge>
                  </div>
                </Link>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-baseline">
                      <Link to={`/menu/${dish.id}`} className="hover:text-terracotta transition-colors">
                        <h3 className="font-serif font-bold text-base text-charcoal dark:text-white">{dish.name}</h3>
                      </Link>
                      <span className="font-bold text-terracotta text-sm">
                        {dish.variants && dish.variants.length > 1
                          ? `From ${formatCurrency(dish.variants[0].price)}`
                          : formatCurrency(dish.price)}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-600 dark:text-charcoal-300 line-clamp-2 mt-1">{dish.description}</p>
                  </div>
                  <Link to={`/menu/${dish.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Dish & Sizes
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── 4. Featured Section (Renders ONLY if ≥1 item flagged isFeatured) ── */}
      {featuredItems.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8 border-b border-bistro-border dark:border-charcoal-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-olive uppercase tracking-wider mb-1">
                <Flame className="w-4 h-4" /> Highlighted Menu
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal dark:text-white">
                Featured Items
              </h2>
            </div>
            <Link to="/menu" className="text-xs font-bold text-terracotta hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredItems.map((dish) => (
              <Card key={dish.id} hoverEffect className="p-0 overflow-hidden flex flex-col h-full border border-bistro-border dark:border-charcoal-700">
                <Link to={`/menu/${dish.id}`} className="block relative h-48 bg-charcoal-100 dark:bg-charcoal-850 overflow-hidden group">
                  <FoodImage
                    src={dish.imageUrl}
                    alt={dish.name}
                    categoryName="Featured"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 z-10">
                    <Badge variant="olive">Featured</Badge>
                  </div>
                </Link>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-baseline">
                      <Link to={`/menu/${dish.id}`} className="hover:text-terracotta transition-colors">
                        <h3 className="font-serif font-bold text-base text-charcoal dark:text-white">{dish.name}</h3>
                      </Link>
                      <span className="font-bold text-terracotta text-sm">
                        {dish.variants && dish.variants.length > 1
                          ? `From ${formatCurrency(dish.variants[0].price)}`
                          : formatCurrency(dish.price)}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-600 dark:text-charcoal-300 line-clamp-2 mt-1">{dish.description}</p>
                  </div>
                  <Link to={`/menu/${dish.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── 5. Popular Section (Renders ONLY if real completed order ranking exists) ── */}
      {popularItems.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8 border-b border-bistro-border dark:border-charcoal-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-terracotta uppercase tracking-wider mb-1">
                <Star className="w-4 h-4" /> Customer Favorites
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal dark:text-white">
                Most Popular Dishes
              </h2>
            </div>
            <Link to="/menu" className="text-xs font-bold text-terracotta hover:underline flex items-center gap-1">
              Explore Full Menu <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularItems.map((dish) => (
              <Card key={dish.id} hoverEffect className="p-0 overflow-hidden flex flex-col h-full border border-bistro-border dark:border-charcoal-700">
                <Link to={`/menu/${dish.id}`} className="block relative h-48 bg-charcoal-100 dark:bg-charcoal-850 overflow-hidden group">
                  <FoodImage
                    src={dish.imageUrl}
                    alt={dish.name}
                    categoryName="Popular"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 z-10">
                    <Badge variant="terracotta">Popular</Badge>
                  </div>
                </Link>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-baseline">
                      <Link to={`/menu/${dish.id}`} className="hover:text-terracotta transition-colors">
                        <h3 className="font-serif font-bold text-base text-charcoal dark:text-white">{dish.name}</h3>
                      </Link>
                      <span className="font-bold text-terracotta text-sm">
                        {dish.variants && dish.variants.length > 1
                          ? `From ${formatCurrency(dish.variants[0].price)}`
                          : formatCurrency(dish.price)}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-600 dark:text-charcoal-300 line-clamp-2 mt-1">{dish.description}</p>
                  </div>
                  <Link to={`/menu/${dish.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Dish
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── Sample Menu Items Showcase (Always honest fallback of available items) ── */}
      {chefSpecials.length === 0 && featuredItems.length === 0 && sampleItems.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8 border-b border-bistro-border dark:border-charcoal-800 pb-4">
            <div>
              <div className="text-xs font-bold text-terracotta uppercase tracking-wider mb-1">
                Fast-Food Selection
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal dark:text-white">
                From Our Kitchen
              </h2>
            </div>
            <Link to="/menu" className="text-xs font-bold text-terracotta hover:underline flex items-center gap-1">
              Full Menu <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleItems.slice(0, 6).map((dish) => (
              <Card key={dish.id} hoverEffect className="p-0 overflow-hidden flex flex-col h-full border border-bistro-border dark:border-charcoal-700">
                <Link to={`/menu/${dish.id}`} className="block relative h-48 bg-charcoal-100 dark:bg-charcoal-850 overflow-hidden group">
                  <FoodImage
                    src={dish.imageUrl}
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-baseline">
                      <Link to={`/menu/${dish.id}`} className="hover:text-terracotta transition-colors">
                        <h3 className="font-serif font-bold text-base text-charcoal dark:text-white">{dish.name}</h3>
                      </Link>
                      <span className="font-bold text-terracotta text-sm">
                        {dish.variants && dish.variants.length > 1
                          ? `From ${formatCurrency(dish.variants[0].price)}`
                          : formatCurrency(dish.price)}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-600 dark:text-charcoal-300 line-clamp-2 mt-1">{dish.description}</p>
                  </div>
                  <Link to={`/menu/${dish.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details & Pricing
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── 6. Honest Reviews Section (Renders approved reviews with expandable comments and modal) ── */}
      <section className="bg-bistro-bg/60 dark:bg-charcoal-850/60 py-16 border-y border-bistro-border dark:border-charcoal-700/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal dark:text-white tracking-tight">
              Customer Feedback
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-600 dark:text-charcoal-300">
              Verified reviews submitted by diners who completed orders with Euroshub Kitchen.
            </p>
            {averageRating && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="flex items-center text-amber-500">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                </div>
                <span className="font-bold text-charcoal dark:text-white text-base">
                  {averageRating} out of 5
                </span>
                <span className="text-xs text-charcoal-500 dark:text-charcoal-400 font-medium">
                  ({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="max-w-md mx-auto p-8 rounded-2xl bg-white dark:bg-charcoal-800 border border-bistro-border dark:border-charcoal-700 text-center space-y-2">
              <MessageSquare className="w-8 h-8 text-charcoal-400 mx-auto" />
              <p className="text-sm font-semibold text-charcoal dark:text-white">No customer reviews yet</p>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                Reviews appear here after diners complete an order and submit feedback.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reviews.slice(0, 3).map((rev) => {
                  const isLong = rev.comment.length > 120;
                  const isExpanded = expandedReviews[rev.id];
                  const displayedComment = isLong && !isExpanded
                    ? `${rev.comment.slice(0, 120)}...`
                    : rev.comment;

                  return (
                    <Card key={rev.id} className="p-6 space-y-4 flex flex-col justify-between border border-bistro-border dark:border-charcoal-700">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-1 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < rev.rating
                                  ? 'fill-amber-500 text-amber-500'
                                  : 'text-charcoal-200 dark:text-charcoal-700'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-charcoal-700 dark:text-charcoal-200 italic leading-relaxed">
                          "{displayedComment}"
                        </p>
                        {isLong && (
                          <button
                            type="button"
                            onClick={() => toggleReviewExpand(rev.id)}
                            className="text-[11px] font-semibold text-terracotta hover:underline inline-flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>
                                Show less <ChevronUp className="w-3 h-3" />
                              </>
                            ) : (
                              <>
                                Read more <ChevronDown className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <div className="pt-2 border-t border-bistro-border dark:border-charcoal-700 flex justify-between items-center text-[11px] text-charcoal-500 dark:text-charcoal-400">
                        <span className="font-semibold text-charcoal-800 dark:text-charcoal-200">
                          {rev.customer?.name || 'Verified Customer'}
                        </span>
                        <span>Order #{rev.order?.orderNumber}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {reviews.length > 3 && (
                <div className="text-center pt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAllReviewsOpen(true)}
                    leftIcon={<MessageSquare className="w-4 h-4 text-terracotta" />}
                  >
                    View All {reviews.length} Reviews
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── 7. Reservation Banner CTA (Deliberately separated floating card with rich aesthetics) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
        <div className="relative overflow-hidden rounded-2xl p-8 sm:p-12 lg:p-14 bg-gradient-to-br from-charcoal-900 via-charcoal-850 to-charcoal-900 text-white border border-charcoal-700/80 shadow-2xl backdrop-blur-md">
          {/* Subtle warm decorative glow */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-terracotta/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4 text-center sm:text-left">
              <div className="inline-flex items-center space-x-2 bg-charcoal-800/90 border border-charcoal-700 px-3.5 py-1 rounded-full text-xs font-semibold text-terracotta-300">
                <span className="w-2 h-2 rounded-full bg-terracotta animate-pulse" />
                <span>Live Dining Status • {availableTables} of {totalTables} Tables Available</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight text-white leading-tight">
                Dine With Us in Saddar, Rawalpindi
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-300 leading-relaxed max-w-2xl">
                Experience fresh artisanal burgers, stone-baked pizzas, and fast casual dining at Kohistan Tower. Book your table in advance or walk in daily during kitchen hours ({openingHoursText}).
              </p>
            </div>
            <div className="lg:col-span-4 flex justify-center lg:justify-end">
              <Link to="/reservation" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto shadow-lg hover:shadow-terracotta/20 transition-all font-semibold"
                  leftIcon={<Calendar className="w-4 h-4" />}
                >
                  Reserve a Table
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── View All Reviews Modal ── */}
      <Modal
        isOpen={isAllReviewsOpen}
        onClose={() => setIsAllReviewsOpen(false)}
        title={`All Customer Reviews (${reviews.length})`}
        maxWidth="xl"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 rounded-lg bg-bistro-bg/50 dark:bg-charcoal-800/80 border border-bistro-border dark:border-charcoal-700 space-y-2"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < rev.rating
                          ? 'fill-amber-500 text-amber-500'
                          : 'text-charcoal-300 dark:text-charcoal-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-charcoal-500 dark:text-charcoal-400 font-medium">Order #{rev.order?.orderNumber}</span>
              </div>
              <p className="text-xs text-charcoal-800 dark:text-charcoal-200 italic leading-relaxed">
                "{rev.comment}"
              </p>
              <p className="text-[11px] font-semibold text-charcoal-600 dark:text-charcoal-300">
                — {rev.customer?.name || 'Verified Customer'}
              </p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};
