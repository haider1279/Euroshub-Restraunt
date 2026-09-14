import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useRestaurant } from '../context/RestaurantContext';
import { useTheme } from '../context/ThemeContext';
import { HorseLogo } from '../components/ui/HorseLogo';
import { resolveImageUrl } from '../components/ui/FoodImage';
import {
  ShoppingBag,
  User,
  Menu as MenuIcon,
  X,
  Calendar,
  Phone,
  MapPin,
  Clock,
  LogOut,
  Shield,
  Mail,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const PublicLayout: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { settings, socialLinks } = useRestaurant();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Menu', path: '/menu' },
    { name: 'Reservations', path: '/reservation' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  // Find active social links with non-empty URL
  const activeSocials = socialLinks.filter((s) => s.isActive && s.url && s.url.trim().length > 0);

  return (
    <div className="min-h-screen flex flex-col bg-bistro-bg text-charcoal dark:bg-charcoal-900 dark:text-charcoal-100">
      {/* Top Banner / Announcement Bar */}
      <div className="bg-charcoal text-charcoal-200 text-xs py-2 px-4 border-b border-charcoal-700">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center space-x-4 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5 truncate max-w-xs sm:max-w-none">
              <MapPin className="w-3.5 h-3.5 text-terracotta flex-shrink-0" />
              <span>{settings.address || 'Kohistan Tower, Saddar, Rawalpindi, Office 609'}</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-terracotta flex-shrink-0" />
              <span>Daily: 9:00 AM – 12:00 PM</span>
            </span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] sm:text-xs">
            <a
              href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`}
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-terracotta" />
              <span>{settings.phone}</span>
            </a>
            {isAdmin && (
              <Link
                to="/admin"
                className="bg-terracotta/20 text-terracotta-300 hover:text-white px-2 py-0.5 rounded border border-terracotta/40 flex items-center gap-1 font-medium transition-colors"
              >
                <Shield className="w-3 h-3" /> Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-bistro-border shadow-soft dark:bg-charcoal-900/95 dark:border-charcoal-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-xl bg-charcoal flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105 border border-charcoal-800">
              {settings.logoUrl ? (
                <img src={resolveImageUrl(settings.logoUrl)} alt={settings.name} className="w-8 h-8 object-contain rounded-lg" />
              ) : (
                <HorseLogo className="w-7 h-7 text-white" />
              )}
            </div>
            <div>
              <span className="font-serif font-bold text-xl sm:text-2xl text-charcoal tracking-tight block dark:text-white">
                {settings.name.split(' ')[0]}{' '}
                <span className="text-terracotta">{settings.name.split(' ').slice(1).join(' ') || 'Kitchen'}</span>
              </span>
              <span className="text-[10px] text-charcoal-400 uppercase tracking-widest block font-semibold dark:text-charcoal-400">
                Fast-Food • Saddar, Rawalpindi
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`transition-bistro hover:text-terracotta ${
                  isActive(link.path) ? 'text-terracotta font-semibold' : 'text-charcoal-700 dark:text-charcoal-200'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Action Affordances */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Table Reservation Button */}
            <Link to="/reservation" className="hidden lg:inline-flex">
              <Button variant="outline" size="sm" leftIcon={<Calendar className="w-4 h-4 text-terracotta" />}>
                Reserve Table
              </Button>
            </Link>

            {/* Cart Button with Reactive Counter */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-lg text-charcoal-700 hover:text-terracotta hover:bg-bistro-bg transition-bistro border border-bistro-border dark:text-charcoal-200 dark:border-charcoal-700 dark:hover:bg-charcoal-800"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-terracotta text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-scale">
                  {itemCount}
                </span>
              )}
            </Link>

          {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg text-charcoal-600 hover:text-terracotta hover:bg-bistro-bg transition-bistro border border-bistro-border dark:text-charcoal-200 dark:border-charcoal-700 dark:hover:bg-charcoal-800"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Auth Dropdown / Account Link */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/account"
                  className="flex items-center space-x-2 py-1.5 px-3 rounded-lg border border-bistro-border hover:bg-bistro-bg transition-bistro text-sm font-medium text-charcoal-800 dark:border-charcoal-700 dark:text-charcoal-100 dark:hover:bg-charcoal-800"
                >
                  <User className="w-4 h-4 text-terracotta" />
                  <span className="hidden sm:inline truncate max-w-[120px]">{user?.name}</span>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 text-charcoal-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Order Now
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-charcoal-700 hover:text-terracotta hover:bg-bistro-bg border border-bistro-border dark:text-charcoal-200 dark:border-charcoal-700 dark:hover:bg-charcoal-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-bistro-border px-4 pt-2 pb-6 space-y-3 shadow-lg dark:bg-charcoal-900 dark:border-charcoal-800">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.path)
                    ? 'bg-terracotta-50 text-terracotta font-semibold dark:bg-terracotta-950/40'
                    : 'text-charcoal-700 hover:bg-bistro-bg dark:text-charcoal-200 dark:hover:bg-charcoal-800'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-3 border-t border-bistro-border dark:border-charcoal-800 flex flex-col gap-2">
              <Link to="/reservation" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full" leftIcon={<Calendar className="w-4 h-4 text-terracotta" />}>
                  Reserve a Table
                </Button>
              </Link>
              {!isAuthenticated ? (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Sign In / Register
                  </Button>
                </Link>
              ) : (
                <Link to="/account" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" className="w-full">
                    My Account
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Page Body with deliberate breathing room before footer */}
      <main className="flex-1 pb-16 sm:pb-24">
        <Outlet />
      </main>

      {/* Deep Charcoal Section Footer with high contrast and distinct border */}
      <footer className="bg-charcoal-900 dark:bg-charcoal-950 text-charcoal-200 pt-16 pb-12 border-t border-charcoal-700/80 dark:border-charcoal-800 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand & Story */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-terracotta flex items-center justify-center text-white shadow-md">
                {settings.logoUrl ? (
                  <img src={resolveImageUrl(settings.logoUrl)} alt={settings.name} className="w-7 h-7 object-contain" />
                ) : (
                  <HorseLogo className="w-6 h-6 text-white" />
                )}
              </div>
              <span className="font-serif font-bold text-xl text-white tracking-tight">
                {settings.name.split(' ')[0]}{' '}
                <span className="text-terracotta-300">{settings.name.split(' ').slice(1).join(' ') || 'Kitchen'}</span>
              </span>
            </div>
            <p className="text-xs text-charcoal-300 leading-relaxed mb-4">
              {settings.description ||
                'Euroshub Kitchen brings quality fast-food dining and takeaway to Saddar, Rawalpindi. Handcrafted pizzas, gourmet burgers, and fresh sides crafted with high-standard ingredients.'}
            </p>
            <div className="text-xs text-charcoal-400">
              <p>{settings.footerText || `© ${new Date().getFullYear()} Euroshub Kitchen. All rights reserved.`}</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 font-sans">Explore</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/menu" className="text-charcoal-300 hover:text-terracotta-300 transition-colors">
                  Our Menu & Pricing
                </Link>
              </li>
              <li>
                <Link to="/reservation" className="text-charcoal-300 hover:text-terracotta-300 transition-colors">
                  Book a Table
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-charcoal-300 hover:text-terracotta-300 transition-colors">
                  About Euroshub
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-charcoal-300 hover:text-terracotta-300 transition-colors">
                  Location & Hours
                </Link>
              </li>
              <li>
                <Link to="/account/orders" className="text-charcoal-300 hover:text-terracotta-300 transition-colors">
                  Track Your Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 font-sans">Operating Hours</h4>
            <ul className="space-y-2 text-xs text-charcoal-300">
              <li className="flex justify-between">
                <span>Monday – Sunday:</span>
                <span className="text-white font-medium">
                  {settings.openingHours?.monday
                    ? `${settings.openingHours.monday.open} – ${settings.openingHours.monday.close}`
                    : '9:00 AM – 12:00 PM'}
                </span>
              </li>
              <li className="text-[11px] text-charcoal-400 pt-1">Dine-in & Takeaway orders available daily.</li>
            </ul>

            {/* Social Links (Conditionally rendered only if valid active link exists) */}
            {activeSocials.length > 0 && (
              <div className="mt-6">
                <h5 className="text-[11px] font-semibold text-white uppercase tracking-wider mb-2 font-sans">
                  Follow Us
                </h5>
                <div className="flex items-center space-x-3">
                  {activeSocials.map((s) => (
                    <a
                      key={s.id}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-charcoal-800 text-charcoal-200 hover:text-white hover:bg-terracotta transition-colors flex items-center justify-center text-xs font-bold border border-charcoal-700"
                      title={s.platform}
                    >
                      {s.platform.slice(0, 2)}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 font-sans">
              Rawalpindi Kitchen
            </h4>
            <div className="space-y-2.5 text-xs text-charcoal-300">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-terracotta-300 flex-shrink-0 mt-0.5" />
                <span>{settings.address}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-terracotta-300 flex-shrink-0" />
                <span>{settings.phone}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-terracotta-300 flex-shrink-0" />
                <span>{settings.email}</span>
              </p>
              <p className="text-[11px] text-charcoal-400 mt-4 leading-normal border-t border-charcoal-800 pt-3">
                Modern fast-food platform for Euroshub Kitchen. Kohistan Tower, Saddar, Rawalpindi.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
