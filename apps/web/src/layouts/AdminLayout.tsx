import React, { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  ExternalLink,
  LayoutDashboard,
  ListTree,
  LogOut,
  Menu as MenuIcon,
  MessageSquare,
  Receipt,
  Settings,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRestaurant } from '../context/RestaurantContext';
import { Brand } from '../components/ui/Brand';
import { Sheet } from '../components/ui/Dialog';
import { PageSpinner } from '../components/ui/Spinner';
import { cn } from '../utils/cn';

const NAV = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Orders', path: '/admin/orders', icon: Receipt },
  { label: 'Menu', path: '/admin/menu', icon: UtensilsCrossed },
  { label: 'Categories', path: '/admin/categories', icon: ListTree },
  { label: 'Reservations', path: '/admin/reservations', icon: CalendarDays },
  { label: 'Customers', path: '/admin/customers', icon: Users },
  { label: 'Reviews', path: '/admin/reviews', icon: MessageSquare },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

const isActivePath = (pathname: string, path: string) =>
  pathname === path ||
  pathname.startsWith(`${path}/`) ||
  // /admin/users is an alias of the customers page
  (path === '/admin/customers' && pathname.startsWith('/admin/users'));

const AdminNav: React.FC<{ pathname: string }> = ({ pathname }) => (
  <nav aria-label="Admin" className="flex flex-col gap-0.5 p-3">
    {NAV.map(({ label, path, icon: Icon }) => {
      const active = isActivePath(pathname, path);
      return (
        <NavLink
          key={path}
          to={path}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'flex min-h-11 items-center gap-3 rounded px-3 text-sm transition-colors lg:min-h-10',
            active ? 'bg-ink/[0.07] text-ink' : 'text-muted hover:bg-ink/[0.04] hover:text-ink'
          )}
        >
          <Icon className={cn('h-4 w-4', active ? 'text-accent' : 'text-subtle')} aria-hidden="true" />
          {label}
        </NavLink>
      );
    })}
  </nav>
);

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { settings } = useRestaurant();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => setNavOpen(false), [location.pathname]);

  const current = NAV.find((n) => isActivePath(location.pathname, n.path));

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[232px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-night lg:flex">
        <div className="flex h-16 items-center border-b border-line px-5">
          <Brand name={settings.name || 'Euroshub Kitchen'} to="/admin/dashboard" caption="Admin" />
        </div>
        <div className="flex-1 overflow-y-auto">
          <AdminNav pathname={location.pathname} />
        </div>
        <div className="border-t border-line p-3">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-10 items-center gap-3 rounded px-3 text-sm text-muted hover:bg-ink/[0.04] hover:text-ink"
          >
            <ExternalLink className="h-4 w-4 text-subtle" aria-hidden="true" />
            View site
            <span className="sr-only">(opens in a new tab)</span>
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-line bg-canvas px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="pressable -ml-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-ink/[0.06] lg:hidden"
              aria-label="Open admin menu"
              aria-expanded={navOpen}
            >
              <MenuIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <p className="truncate text-sm text-muted">
              <span className="hidden sm:inline">Admin</span>
              <span className="hidden text-subtle sm:inline"> / </span>
              <span className="text-ink">{current?.label ?? 'Dashboard'}</span>
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span className="hidden max-w-[180px] truncate px-2 text-sm text-muted sm:inline">{user?.name}</span>
            <button
              type="button"
              onClick={logout}
              className="pressable inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm text-muted hover:bg-ink/[0.06] hover:text-ink"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
              <span className="sr-only sm:hidden">Sign out</span>
            </button>
          </div>
        </header>

        <main id="main" tabIndex={-1} className="flex-1 py-6 sm:py-8">
          <div className="container-admin">
            <Suspense fallback={<PageSpinner />}>
              <div key={location.pathname} className="page-enter">
                <Outlet />
              </div>
            </Suspense>
          </div>
        </main>
      </div>

      {/* Mobile nav */}
      <Sheet isOpen={navOpen} onClose={() => setNavOpen(false)} title="Admin" side="left">
        <AdminNav pathname={location.pathname} />
        <div className="border-t border-line p-3">
          <Link to="/" className="flex min-h-11 items-center gap-3 rounded px-3 text-sm text-muted hover:text-ink">
            <ExternalLink className="h-4 w-4 text-subtle" aria-hidden="true" />
            View site
          </Link>
        </div>
      </Sheet>
    </div>
  );
};
