import React from 'react';
import { Link } from 'react-router-dom';
import { useRestaurant } from '../../context/RestaurantContext';
import { hoursSummary } from '../../utils/openingHours';

const LINKS = [
  { name: 'Menu', path: '/menu' },
  { name: 'Book a table', path: '/reservation' },
  { name: 'Track an order', path: '/account/orders' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
];

export const SiteFooter: React.FC = () => {
  const { settings, socialLinks } = useRestaurant();
  const socials = socialLinks.filter((s) => s.isActive && s.url && s.url.trim().length > 0);
  const hours = hoursSummary(settings.openingHours);
  const tel = settings.phone ? settings.phone.replace(/[^0-9+]/g, '') : '';

  return (
    <footer className="border-t border-line bg-night">
      <div className="container-content grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="font-serif text-xl text-ink">{settings.name}</p>
          {settings.address && <p className="mt-3 max-w-xs text-sm text-muted">{settings.address}</p>}
        </div>

        <div>
          <h2 className="eyebrow font-sans tracking-[0.14em]">Visit</h2>
          <dl className="mt-4 space-y-2 text-sm">
            {hours.map((row) => (
              <div key={row.label} className="flex flex-wrap justify-between gap-x-4">
                <dt className="text-muted">{row.label}</dt>
                <dd className="tabular text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h2 className="eyebrow font-sans tracking-[0.14em]">Contact</h2>
          <ul className="mt-4 space-y-1 text-sm">
            {settings.phone && (
              <li>
                <a href={`tel:${tel}`} className="inline-flex min-h-11 items-center sm:min-h-9 text-ink hover:text-accent">
                  {settings.phone}
                </a>
              </li>
            )}
            {settings.email && (
              <li>
                <a href={`mailto:${settings.email}`} className="inline-flex min-h-11 items-center sm:min-h-9 break-all text-ink hover:text-accent">
                  {settings.email}
                </a>
              </li>
            )}
            {socials.map((s) => (
              <li key={s.id}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center sm:min-h-9 capitalize text-muted hover:text-ink"
                >
                  {s.platform}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Footer">
          <h2 className="eyebrow font-sans tracking-[0.14em]">Explore</h2>
          <ul className="mt-4 space-y-1 text-sm">
            {LINKS.map((l) => (
              <li key={l.path}>
                <Link to={l.path} className="inline-flex min-h-11 items-center sm:min-h-9 text-muted hover:text-ink">
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="container-content py-6 text-xs text-muted">
          {settings.footerText || `© ${new Date().getFullYear()} ${settings.name}`}
        </p>
      </div>
    </footer>
  );
};
