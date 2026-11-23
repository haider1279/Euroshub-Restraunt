import React, { Suspense } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SiteHeader } from '../components/layout/SiteHeader';
import { SiteFooter } from '../components/layout/SiteFooter';
import { PageSpinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';

const MENU = [
  { label: 'Overview', path: '/account', end: true },
  { label: 'Orders', path: '/account/orders' },
  { label: 'Reservations', path: '/account/reservations' },
  { label: 'Reviews', path: '/account/reviews' },
  { label: 'Settings', path: '/account/settings' },
];

export const AccountLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 pt-16">
        <div className="container-content py-10 sm:py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Your account</p>
              <h1 className="mt-2 font-serif text-3xl text-ink">{user?.name}</h1>
              {user?.email && <p className="mt-1 text-sm text-muted">{user.email}</p>}
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[200px_1fr] lg:gap-12">
            <nav aria-label="Account" className="scroll-row -mx-4 border-b border-line px-4 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:border-b-0 lg:px-0">
              {MENU.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      '-mb-px inline-flex min-h-11 shrink-0 items-center whitespace-nowrap border-b-2 px-3 text-sm transition-colors lg:mb-0 lg:rounded lg:border-b-0',
                      isActive
                        ? 'border-accent text-ink lg:bg-ink/[0.06]'
                        : 'border-transparent text-muted hover:text-ink lg:hover:bg-ink/[0.03]'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="min-w-0">
              <Suspense fallback={<PageSpinner />}>
                <div key={location.pathname} className="page-enter">
                  <Outlet />
                </div>
              </Suspense>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};
