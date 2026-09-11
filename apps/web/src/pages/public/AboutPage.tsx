import React from 'react';
import { Link } from 'react-router-dom';
import { useRestaurant } from '../../context/RestaurantContext';
import { useTableAvailability } from '../../hooks/useTableAvailability';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Flame, ShieldCheck, Clock, MapPin, Utensils } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { settings } = useRestaurant();
  const { data: tableAvailability } = useTableAvailability();

  const totalTables = tableAvailability?.totalTables || settings.tableCount || 100;
  const openingHoursText = settings.openingHours?.monday
    ? `${settings.openingHours.monday.open} – ${settings.openingHours.monday.close}`
    : '9:00 AM – 12:00 PM';

  return (
    <div className="space-y-16 sm:space-y-24 py-12 sm:py-20">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="text-xs font-bold text-terracotta uppercase tracking-wider block">
          About Euroshub Kitchen
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-charcoal dark:text-white tracking-tight">
          Modern Fast-Food Kitchen in Saddar, Rawalpindi
        </h1>
        <p className="text-sm sm:text-base text-charcoal-600 dark:text-charcoal-300 max-w-2xl mx-auto leading-relaxed">
          {settings.description ||
            'Euroshub Kitchen brings quality fast-food dining and takeaway to Saddar, Rawalpindi. Handcrafted pizzas, gourmet burgers, and fresh sides crafted with high-standard ingredients.'}
        </p>
      </section>

      {/* Story & Practical Mission */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold text-terracotta uppercase tracking-wider block">
              Our Location & Service
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-charcoal dark:text-white leading-snug">
              Quality Ingredients, Honest Preparation & Fast Dining
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
              Located at {settings.address || 'Kohistan Tower, Saddar, Rawalpindi (Office 609)'}, Euroshub Kitchen focuses on delivering freshly prepared fast-food meals with zero compromise on taste or cleanliness.
            </p>
            <p className="text-xs sm:text-sm text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
              Our menu features 12 core items spanning signature stuffed-crust and thin pizzas, fresh beef and chicken patties, toasted club and Mexican sandwiches, and golden sides. Whether you are dining at our {totalTables} tables or picking up a takeaway meal, every dish is cooked to order.
            </p>
            <div className="pt-2 flex gap-4">
              <Link to="/menu">
                <Button variant="primary">Explore Our Menu</Button>
              </Link>
              <Link to="/reservation">
                <Button variant="outline">Reserve a Table</Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl overflow-hidden shadow-md h-64 sm:h-80 bg-charcoal-100 dark:bg-charcoal-800">
              <img
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80"
                alt="Fresh Pizza Preparation"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-md h-64 sm:h-80 mt-6 sm:mt-10 bg-charcoal-100 dark:bg-charcoal-800">
              <img
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80"
                alt="Burger Kitchen"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="bg-white dark:bg-charcoal-800/40 py-16 border-y border-bistro-border dark:border-charcoal-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h3 className="text-2xl font-serif font-bold text-charcoal dark:text-white">Our Kitchen Principles</h3>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">Honest values that govern our kitchen operations daily.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-terracotta-50 dark:bg-charcoal-700 text-terracotta flex items-center justify-center mx-auto">
                <Flame className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-charcoal dark:text-white text-base">Cooked to Order</h4>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400 leading-relaxed">
                Pizzas are baked hot and burgers are griddled fresh upon receiving your order.
              </p>
            </Card>

            <Card className="p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-charcoal dark:text-white text-base">Verified Quality</h4>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400 leading-relaxed">
                Clean preparation standards with high-grade mozzarella, meats, and fresh produce.
              </p>
            </Card>

            <Card className="p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-charcoal dark:text-white text-base">Daily Hours</h4>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400 leading-relaxed">
                Open daily from {openingHoursText} for morning to midday dining and takeaway orders.
              </p>
            </Card>

            <Card className="p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <Utensils className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-charcoal dark:text-white text-base">{totalTables} Dine-In Tables</h4>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400 leading-relaxed">
                Spacious seating capacity at Kohistan Tower with easy counter service and table booking.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Location Details Block */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div className="p-8 rounded-2xl bg-charcoal text-white space-y-3 border border-charcoal-800 shadow-xl">
          <MapPin className="w-8 h-8 text-terracotta mx-auto" />
          <h3 className="font-serif font-bold text-xl">{settings.name}</h3>
          <p className="text-xs text-charcoal-300 max-w-md mx-auto">{settings.address}</p>
          <p className="text-xs text-terracotta-300 font-semibold">Daily {openingHoursText} • Saddar, Rawalpindi</p>
        </div>
      </section>
    </div>
  );
};
