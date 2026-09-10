import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingBag, Calendar, Star, Settings, LogOut, ArrowLeft } from 'lucide-react';

export const AccountLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { label: 'Overview', path: '/account', icon: LayoutDashboard },
    { label: 'Order History', path: '/account/orders', icon: ShoppingBag },
    { label: 'Reservations', path: '/account/reservations', icon: Calendar },
    { label: 'My Reviews', path: '/account/reviews', icon: Star },
    { label: 'Account Settings', path: '/account/settings', icon: Settings },
  ];

  const isCurrent = (path: string) => {
    if (path === '/account') return location.pathname === '/account';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header with back link */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-8 border-b border-bistro-border gap-4">
        <div>
          <Link
            to="/"
            className="inline-flex items-center text-xs font-medium text-charcoal-500 hover:text-terracotta mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Restaurant Website
          </Link>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
            Manage your past dining experiences, active deliveries, and account preferences.
          </p>
        </div>
        <button
          onClick={logout}
          className="inline-flex items-center text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md border border-red-200 transition-colors w-fit"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1">
          <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible space-x-2 lg:space-x-0 lg:space-y-1 bg-white p-2 sm:p-3 rounded-xl border border-bistro-border shadow-soft">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isCurrent(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-bistro whitespace-nowrap ${
                    active
                      ? 'bg-terracotta text-white shadow-sm'
                      : 'text-charcoal-700 hover:bg-bistro-bg hover:text-terracotta'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-charcoal-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Content Pane */}
        <div className="lg:col-span-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
