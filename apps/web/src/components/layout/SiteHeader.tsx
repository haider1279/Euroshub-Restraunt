import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu as MenuIcon, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { useScrolled } from '../../hooks/useReveal';
import { cn } from '../../utils/cn';
import { Brand } from '../ui/Brand';
import { Sheet } from '../ui/Dialog';
import { buttonClasses } from '../ui/Button';

const NAV = [
  { name: 'Menu', path: '/menu' },
  { name: 'Reservations', path: '/reservation' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
];

const isReservationPath = (path: string) => path === '/reservation' || path === '/reservations';

/** Cart link with a count badge that bumps when items are added. */
const CartLink: React.FC = () => {
  const { itemCount } = useCart();
  const prev = useRef(itemCount);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    if (itemCount > prev.current) setBump((b) => b + 1);
    prev.current = itemCount;
  }, [itemCount]);

  return (
    <Link
      to="/cart"
      className="pressable relative inline-flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-ink/[0.06]"
      aria-label={itemCount > 0 ? `Cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}` : 'Cart, empty'}
    >
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      {itemCount > 0 && (
        <span
          key={bump}
          className={cn(
            'tabular absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-semibold text-night',
            bump > 0 && 'badge-bump'
          )}
          aria-hidden="true"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
      {/* Announces cart changes to screen readers */}
      <span className="sr-only" role="status" aria-live="polite">
        {itemCount > 0 ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'} in cart` : ''}
      </span>
    </Link>
  );
};

export const SiteHeader: React.FC<{ overHero?: boolean }> = ({ overHero = false }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { settings } = useRestaurant();
  const scrolled = useScrolled(24);
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile sheet on navigation
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const transparent = overHero && !scrolled && !menuOpen;

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative inline-flex min-h-11 items-center px-3 text-sm transition-colors duration-200',
      isActive ? 'text-ink' : 'text-muted hover:text-ink'
    );

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 h-16 border-b transition-colors duration-300',
        transparent ? 'border-transparent bg-transparent' : 'border-line bg-canvas'
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-10 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-night"
      >
        Skip to content
      </a>
      <div className="container-content flex h-full items-center justify-between gap-4">
        <Brand name={settings.name || 'Euroshub Kitchen'} logoUrl={settings.logoUrl} />

        <nav aria-label="Main" className="hidden items-center md:flex">
          {NAV.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={(state) =>
                navClass({ isActive: state.isActive || (link.path === '/reservation' && isReservationPath(location.pathname)) })
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          {isAdmin && (
            <Link to="/admin" className="hidden min-h-11 items-center px-3 text-sm text-muted hover:text-ink lg:inline-flex">
              Admin
            </Link>
          )}
          {isAuthenticated ? (
            <Link
              to="/account"
              className="hidden min-h-11 max-w-[160px] items-center truncate px-3 text-sm text-muted hover:text-ink md:inline-flex"
            >
              {user?.name?.split(' ')[0] || 'Account'}
            </Link>
          ) : (
            <Link to="/login" className="hidden min-h-11 items-center px-3 text-sm text-muted hover:text-ink md:inline-flex">
              Sign in
            </Link>
          )}
          <CartLink />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="pressable inline-flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-ink/[0.06] md:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <MenuIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <Sheet isOpen={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
        <nav aria-label="Mobile" className="flex flex-col p-3">
          {[{ name: 'Home', path: '/' }, ...NAV].map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex min-h-12 items-center rounded px-3 text-base transition-colors',
                  isActive ? 'bg-ink/[0.06] text-ink' : 'text-muted hover:bg-ink/[0.04] hover:text-ink'
                )
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>
        <div className="mt-2 border-t border-line p-5">
          {isAuthenticated ? (
            <div className="space-y-3">
              <p className="text-sm text-muted">
                Signed in as <span className="text-ink">{user?.name}</span>
              </p>
              <Link to="/account" className={buttonClasses({ variant: 'secondary', className: 'w-full' })}>
                My account
              </Link>
              {isAdmin && (
                <Link to="/admin" className={buttonClasses({ variant: 'secondary', className: 'w-full' })}>
                  Admin dashboard
                </Link>
              )}
              <button type="button" onClick={logout} className={buttonClasses({ variant: 'ghost', className: 'w-full' })}>
                Sign out
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              <Link to="/login" className={buttonClasses({ className: 'w-full' })}>
                Sign in
              </Link>
              <Link to="/register" className={buttonClasses({ variant: 'secondary', className: 'w-full' })}>
                Create account
              </Link>
            </div>
          )}
        </div>
      </Sheet>
    </header>
  );
};
