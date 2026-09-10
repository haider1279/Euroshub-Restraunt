import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { MenuItem, MenuCategory, Review } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/currency';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DishCardSkeleton } from '../../components/ui/Skeleton';
import {
  Utensils,
  Calendar,
  Flame,
  Star,
  Clock,
  MapPin,
  ArrowRight,
  Plus,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { addItem } = useCart();
  const { settings } = useRestaurant();

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

  // Fetch Public Reviews (only approved/non-hidden reviews)
  const { data: reviewData } = useQuery({
    queryKey: ['publicReviews'],
    queryFn: () => apiRequest<{ reviews: Review[] }>('/reviews'),
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
  const sampleItems = allMenuData?.items || [];

  const fallbackImage =
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80';

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* ── 1. Hero Section ── */}
      <section className="relative bg-charcoal text-white overflow-hidden py-20 sm:py-28 lg:py-32">
        <div
          className="absolute inset-0 opacity-15 mix-blend-overlay bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&auto=format&fit=crop&q=80)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-charcoal-800/80 border border-charcoal-700 px-3.5 py-1.5 rounded-full text-xs font-medium text-terracotta-300">
              <span className="w-2 h-2 rounded-full bg-terracotta animate-pulse" />
              <span>Modern Fast-Food • Saddar, Rawalpindi</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white leading-tight">
              {settings.headline || 'Fresh, Hot & Fast in Rawalpindi'}
            </h1>
            <p className="text-base sm:text-lg text-charcoal-300 max-w-2xl leading-relaxed">
              {settings.subtitle ||
                'Crispy burgers, loaded pizzas, and artisanal sandwiches prepared daily at Kohistan Tower, Saddar.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Link to="/menu" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Explore Our Menu
                </Button>
              </Link>
              <Link to="/reservation" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-transparent border-charcoal-600 text-white hover:bg-charcoal-800"
                  leftIcon={<Calendar className="w-4 h-4 text-terracotta" />}
                >
                  Reserve a Table
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center sm:justify-start space-x-8 pt-6 border-t border-charcoal-800 text-xs text-charcoal-400">
              <div>
                <span className="block text-white font-bold text-lg font-serif">100</span>
                <span>Dine-In Tables</span>
              </div>
              <div className="border-l border-charcoal-800 pl-8">
                <span className="block text-white font-bold text-lg font-serif">PKR</span>
                <span>Exact Local Pricing</span>
              </div>
              <div className="border-l border-charcoal-800 pl-8">
                <span className="block text-white font-bold text-lg font-serif">Daily</span>
                <span>9:00 AM – 12:00 PM</span>
              </div>
            </div>
          </div>

          {/* Hero Featured Showcase Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md bg-charcoal-800/90 rounded-2xl p-4 border border-charcoal-700 shadow-2xl backdrop-blur-md">
              <div className="relative h-64 sm:h-72 rounded-xl overflow-hidden mb-4">
                <img
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80"
                  alt="BBQ Pizza at Euroshub Kitchen"
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant="terracotta">Signature Pizza</Badge>
                </div>
                <div className="absolute bottom-3 right-3 bg-charcoal-900/90 backdrop-blur-sm text-terracotta px-3 py-1 rounded-lg font-bold text-sm border border-charcoal-700">
                  From {formatCurrency(700)}
                </div>
              </div>
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <h3 className="font-serif font-bold text-lg text-white">BBQ Pizza</h3>
                  <span className="text-xs text-charcoal-400 font-medium">4 Size Variants</span>
                </div>
                <p className="text-xs text-charcoal-400 line-clamp-2">
                  Topped with smoky BBQ chicken, diced red onions, and melted mozzarella over hand-tossed dough.
                </p>
                <div className="pt-2">
                  <Link to="/menu">
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
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal tracking-tight">
            Menu Categories
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-500">
            Handcrafted fast-food favorites prepared to order with verified ingredients.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {catData?.categories?.map((cat) => (
            <Link key={cat.id} to={`/menu?category=${cat.id}`} className="group">
              <Card hoverEffect className="p-6 text-center space-y-3 border border-bistro-border group-hover:border-terracotta transition-all">
                <div className="w-12 h-12 mx-auto rounded-xl bg-terracotta-50 text-terracotta flex items-center justify-center group-hover:bg-terracotta group-hover:text-white transition-colors shadow-sm">
                  <Utensils className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-charcoal group-hover:text-terracotta transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-charcoal-400 mt-0.5">
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
          <div className="flex justify-between items-end mb-8 border-b border-bistro-border pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-terracotta uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" /> Chef's Recommendation
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal">
                Chef Specials
              </h2>
            </div>
            <Link to="/menu" className="text-xs font-bold text-terracotta hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {chefSpecials.map((dish) => (
              <Card key={dish.id} hoverEffect className="p-0 overflow-hidden flex flex-col h-full">
                <div className="relative h-48 bg-charcoal-100 overflow-hidden">
                  <img
                    src={dish.imageUrl || fallbackImage}
                    alt={dish.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackImage;
                    }}
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="terracotta">Chef Special</Badge>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-serif font-bold text-base text-charcoal">{dish.name}</h3>
                      <span className="font-bold text-terracotta text-sm">
                        {dish.variants && dish.variants.length > 1
                          ? `From ${formatCurrency(dish.variants[0].price)}`
                          : formatCurrency(dish.price)}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-500 line-clamp-2 mt-1">{dish.description}</p>
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
          <div className="flex justify-between items-end mb-8 border-b border-bistro-border pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-olive uppercase tracking-wider mb-1">
                <Flame className="w-4 h-4" /> Highlighted Menu
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal">
                Featured Items
              </h2>
            </div>
            <Link to="/menu" className="text-xs font-bold text-terracotta hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredItems.map((dish) => (
              <Card key={dish.id} hoverEffect className="p-0 overflow-hidden flex flex-col h-full">
                <div className="relative h-48 bg-charcoal-100 overflow-hidden">
                  <img
                    src={dish.imageUrl || fallbackImage}
                    alt={dish.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackImage;
                    }}
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="olive">Featured</Badge>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-serif font-bold text-base text-charcoal">{dish.name}</h3>
                      <span className="font-bold text-terracotta text-sm">
                        {dish.variants && dish.variants.length > 1
                          ? `From ${formatCurrency(dish.variants[0].price)}`
                          : formatCurrency(dish.price)}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-500 line-clamp-2 mt-1">{dish.description}</p>
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
          <div className="flex justify-between items-end mb-8 border-b border-bistro-border pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-terracotta uppercase tracking-wider mb-1">
                <Star className="w-4 h-4" /> Customer Favorites
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal">
                Most Popular Dishes
              </h2>
            </div>
            <Link to="/menu" className="text-xs font-bold text-terracotta hover:underline flex items-center gap-1">
              Explore Full Menu <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularItems.map((dish) => (
              <Card key={dish.id} hoverEffect className="p-0 overflow-hidden flex flex-col h-full">
                <div className="relative h-48 bg-charcoal-100 overflow-hidden">
                  <img
                    src={dish.imageUrl || fallbackImage}
                    alt={dish.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackImage;
                    }}
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="terracotta">Popular</Badge>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-serif font-bold text-base text-charcoal">{dish.name}</h3>
                      <span className="font-bold text-terracotta text-sm">
                        {dish.variants && dish.variants.length > 1
                          ? `From ${formatCurrency(dish.variants[0].price)}`
                          : formatCurrency(dish.price)}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-500 line-clamp-2 mt-1">{dish.description}</p>
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
          <div className="flex justify-between items-end mb-8 border-b border-bistro-border pb-4">
            <div>
              <div className="text-xs font-bold text-terracotta uppercase tracking-wider mb-1">
                Fast-Food Selection
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal">
                From Our Kitchen
              </h2>
            </div>
            <Link to="/menu" className="text-xs font-bold text-terracotta hover:underline flex items-center gap-1">
              Full Menu <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleItems.slice(0, 6).map((dish) => (
              <Card key={dish.id} hoverEffect className="p-0 overflow-hidden flex flex-col h-full">
                <div className="relative h-48 bg-charcoal-100 overflow-hidden">
                  <img
                    src={dish.imageUrl || fallbackImage}
                    alt={dish.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackImage;
                    }}
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-serif font-bold text-base text-charcoal">{dish.name}</h3>
                      <span className="font-bold text-terracotta text-sm">
                        {dish.variants && dish.variants.length > 1
                          ? `From ${formatCurrency(dish.variants[0].price)}`
                          : formatCurrency(dish.price)}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-500 line-clamp-2 mt-1">{dish.description}</p>
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

      {/* ── 6. Honest Reviews Section (Renders approved reviews or honest neutral state) ── */}
      <section className="bg-bistro-bg/60 py-16 border-y border-bistro-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal tracking-tight">
              Customer Feedback
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-500">
              Verified reviews submitted by diners who completed orders with Euroshub Kitchen.
            </p>
          </div>

          {reviews.length === 0 ? (
            <div className="max-w-md mx-auto p-8 rounded-2xl bg-white border border-bistro-border text-center space-y-2">
              <p className="text-sm font-semibold text-charcoal">No customer reviews yet</p>
              <p className="text-xs text-charcoal-500">
                Reviews appear here after diners complete an order and submit feedback.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.slice(0, 3).map((rev) => (
                <Card key={rev.id} className="p-6 space-y-4">
                  <div className="flex items-center space-x-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < rev.rating ? 'fill-amber-500 text-amber-500' : 'text-charcoal-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-charcoal-700 italic leading-relaxed">
                    "{rev.comment}"
                  </p>
                  <div className="pt-2 border-t border-bistro-border flex justify-between items-center text-[11px] text-charcoal-400">
                    <span className="font-semibold text-charcoal-700">{rev.customer?.name || 'Verified Customer'}</span>
                    <span>Order #{rev.order?.orderNumber}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 7. Reservation Banner CTA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-charcoal rounded-2xl p-8 sm:p-12 text-white text-center sm:text-left grid grid-cols-1 md:grid-cols-12 gap-8 items-center border border-charcoal-800 shadow-xl">
          <div className="md:col-span-8 space-y-3">
            <h2 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight">
              Dine With Us in Saddar, Rawalpindi
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-300 leading-relaxed max-w-xl">
              100 tables available for casual dining and fast service. Book in advance or walk in daily from 9:00 AM to 12:00 PM.
            </p>
          </div>
          <div className="md:col-span-4 flex justify-center md:justify-end">
            <Link to="/reservation">
              <Button variant="primary" size="lg" leftIcon={<Calendar className="w-4 h-4" />}>
                Reserve a Table
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
