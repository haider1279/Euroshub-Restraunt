import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Calendar,
  Users,
  Star,
  Settings,
  ExternalLink,
  LogOut,
  Menu as MenuIcon,
  X,
  ShieldCheck,
} from 'lucide-react';
import { HorseLogo } from '../components/ui/HorseLogo';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Menu Management', path: '/admin/menu', icon: UtensilsCrossed },
    { label: 'Orders & Dispatch', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Table Reservations', path: '/admin/reservations', icon: Calendar },
    { label: 'Customer Directory', path: '/admin/customers', icon: Users },
    { label: 'Review Moderation', path: '/admin/reviews', icon: Star },
    { label: 'Restaurant Settings', path: '/admin/settings', icon: Settings },
  ];

  const isCurrent = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-charcoal flex flex-col md:flex-row dark:bg-charcoal-950 dark:text-charcoal-100">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-charcoal-900 text-white p-4 flex items-center justify-between border-b border-charcoal-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded bg-terracotta flex items-center justify-center text-white shadow-sm p-1">
            <HorseLogo className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif font-bold text-sm">Euroshub Admin</span>
        </div>
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="p-1.5 text-charcoal-300 hover:text-white"
        >
          {mobileNavOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileNavOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-charcoal-900 text-charcoal-200 flex-shrink-0 flex flex-col justify-between md:min-h-screen border-r border-charcoal-800 z-30`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-charcoal-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-terracotta flex items-center justify-center text-white shadow-md p-1.5">
                <HorseLogo className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="font-serif font-bold text-base text-white tracking-tight block">
                  Euroshub <span className="text-terracotta">POS</span>
                </span>
                <span className="text-[10px] text-charcoal-400 uppercase tracking-widest block font-medium">
                  Operations Console
                </span>
              </div>
            </div>
          </div>

          {/* Admin Navigation Links */}
          <div className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-charcoal-400 uppercase tracking-wider">
              Management
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isCurrent(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    active
                      ? 'bg-terracotta text-white font-semibold shadow-sm'
                      : 'text-charcoal-300 hover:bg-charcoal-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-charcoal-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-charcoal-800 bg-charcoal-950/50">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-charcoal-300 hover:text-white bg-charcoal-800/80 hover:bg-charcoal-800 rounded-md mb-3 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-terracotta" /> View Public Site
            </span>
          </Link>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2 truncate">
              <ShieldCheck className="w-4 h-4 text-olive flex-shrink-0" />
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-charcoal-400 uppercase tracking-wide">Administrator</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-charcoal-400 hover:text-red-400 rounded transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Workspace Top Header Bar */}
        <header className="hidden md:flex bg-white border-b border-bistro-border px-8 py-3.5 items-center justify-between shadow-soft dark:bg-charcoal-900 dark:border-charcoal-800">
          <div className="flex items-center space-x-2 text-xs text-charcoal-500 dark:text-charcoal-400">
            <span className="font-semibold text-charcoal-800 dark:text-charcoal-200">Euroshub Kitchen</span>
            <span>/</span>
            <span>Admin Console</span>
            <span>/</span>
            <span className="text-terracotta font-medium capitalize">
              {location.pathname.replace('/admin', '').replace('/', '') || 'Dashboard'}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2 bg-bistro-bg px-3 py-1 rounded-full border border-bistro-border text-xs text-charcoal-700 dark:bg-charcoal-800 dark:border-charcoal-700 dark:text-charcoal-300">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Live Database Connected</span>
            </div>
          </div>
        </header>

        {/* Workspace Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
