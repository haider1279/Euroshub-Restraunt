import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SiteHeader } from '../components/layout/SiteHeader';
import { SiteFooter } from '../components/layout/SiteFooter';
import { PageSpinner } from '../components/ui/Spinner';

export const PublicLayout: React.FC = () => {
  const location = useLocation();
  // The home hero sits under a transparent navbar; every other page clears it.
  const isHome = location.pathname === '/';

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader overHero={isHome} />
      <main id="main" tabIndex={-1} className={isHome ? 'flex-1' : 'flex-1 pt-16'}>
        <Suspense fallback={<PageSpinner />}>
          {/* Keyed by path so each route gets a quick fade-in */}
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
};
