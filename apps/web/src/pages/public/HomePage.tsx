import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Star } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { categoriesQuery } from '../../api/queries';
import { MenuItem, Review } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import { useTableAvailability } from '../../hooks/useTableAvailability';
import { checkRestaurantStatus } from '../../utils/hours';
import { closedStatusLine, hoursSummary, openStatusLine } from '../../utils/openingHours';
import { formatDate } from '../../utils/date';
import { AuroraHero } from '../../components/home/AuroraHero';
import { DishCard } from '../../components/menu/DishCard';
import { Reveal, SectionHeader } from '../../components/ui/Section';
import { DishCardSkeleton, Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/EmptyState';
import { ButtonLink, Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { FoodImage } from '../../components/ui/FoodImage';
import { PriceTag, lowestPrice } from '../../components/ui/PriceTag';

const Stars: React.FC<{ rating: number }> = ({ rating }) => (
  <span className="inline-flex items-center gap-0.5 text-warning" aria-label={`${rating} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={i < rating ? 'h-3.5 w-3.5 fill-current' : 'h-3.5 w-3.5 text-ink/15'} aria-hidden="true" />
    ))}
  </span>
);

export const HomePage: React.FC = () => {
  const { settings } = useRestaurant();
  const { data: tableAvailability, isLoading: isTablesLoading, isError: isTablesError } = useTableAvailability();
  const [isAllReviewsOpen, setIsAllReviewsOpen] = useState(false);

  const { data: catData, isLoading: isCatLoading } = useQuery(categoriesQuery);

  const { data: chefSpecialData, isLoading: isChefLoading } = useQuery({
    queryKey: ['chefSpecials'],
    queryFn: () => apiRequest<{ items: MenuItem[] }>('/menu-items/chef-specials'),
  });

  const { data: featuredData, isLoading: isFeaturedLoading, isError: isFeaturedError, refetch: refetchFeatured } = useQuery({
    queryKey: ['featuredItems'],
    queryFn: () => apiRequest<{ items: MenuItem[] }>('/menu-items/featured'),
  });

  // Popular comes from real order history only
  const { data: popularData } = useQuery({
    queryKey: ['popularItems'],
    queryFn: () => apiRequest<{ items: MenuItem[] }>('/menu-items/popular'),
  });

  const { data: reviewData } = useQuery({
    queryKey: ['publicReviews'],
    queryFn: () => apiRequest<{ reviews: Review[]; averageRating?: number | null; totalReviews?: number }>('/reviews'),
  });

  // Fallback sample when nothing is flagged featured yet
  const { data: allMenuData, isLoading: isMenuLoading } = useQuery({
    queryKey: ['homeMenuSample'],
    queryFn: () => apiRequest<{ items: MenuItem[] }>('/menu-items?pageSize=6'),
  });

  const popularItems = popularData?.items || [];
  const reviews = reviewData?.reviews || [];
  const averageRating = reviewData?.averageRating;
  const totalReviewsCount = reviewData?.totalReviews ?? reviews.length;
  const categories = catData?.categories || [];

  // Featured = chef specials + featured flags (deduped); otherwise a menu sample.
  const featured = useMemo(() => {
    const seen = new Set<string>();
    const merged = [...(chefSpecialData?.items || []), ...(featuredData?.items || [])].filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    return merged.length > 0 ? merged.slice(0, 6) : (allMenuData?.items || []).slice(0, 6);
  }, [chefSpecialData, featuredData, allMenuData]);
  const featuredLoading = isChefLoading || isFeaturedLoading || (featured.length === 0 && isMenuLoading);

  const status = checkRestaurantStatus(new Date(), settings.openingHours as any, settings.timezone || 'Asia/Karachi');
  const hours = hoursSummary(settings.openingHours);
  const signature = settings.signatureMenuItem;
  const mapsUrl = settings.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`
    : null;
  const tel = settings.phone ? settings.phone.replace(/[^0-9+]/g, '') : '';

  return (
    <>
      <AuroraHero statusLine={closedStatusLine(status)} />

      <div className="container-content space-y-24 pb-24 pt-8 sm:space-y-32 sm:pb-32">
        {/* Categories */}
        <Reveal as="section" aria-labelledby="home-categories">
          <SectionHeader id="home-categories" title="Browse the menu" action={{ label: 'Full menu', to: '/menu' }} />
          <div className="scroll-row -mx-4 mt-6 px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {isCatLoading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-11 w-28 shrink-0 rounded-full" />)
              : categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/menu?category=${cat.id}`}
                    className="pressable inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-line-strong px-4 text-sm text-ink hover:border-ink/30 hover:bg-ink/[0.04]"
                  >
                    {cat.name}
                    {typeof cat._count?.items === 'number' && <span className="tabular text-muted">{cat._count.items}</span>}
                  </Link>
                ))}
          </div>
        </Reveal>

        {/* Featured */}
        <Reveal as="section" aria-labelledby="home-featured">
          <SectionHeader id="home-featured" title="From the kitchen" action={{ label: 'See everything', to: '/menu' }} />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredLoading ? (
              Array.from({ length: 3 }).map((_, i) => <DishCardSkeleton key={i} />)
            ) : isFeaturedError && featured.length === 0 ? (
              <ErrorState className="sm:col-span-2 lg:col-span-3" title="Couldn’t load dishes" onRetry={() => refetchFeatured()} />
            ) : featured.length === 0 ? (
              <p className="text-sm text-muted">The menu is being updated. Check back shortly.</p>
            ) : (
              featured.map((dish) => <DishCard key={dish.id} dish={dish} />)
            )}
          </div>
        </Reveal>

        {/* Signature dish (set by the restaurant in admin settings) */}
        {signature && (
          <Reveal as="section" aria-labelledby="home-signature">
            <Link
              to={`/menu/${signature.id}`}
              className="card-interactive grid overflow-hidden rounded-lg border border-line bg-surface md:grid-cols-2"
            >
              <div className="aspect-[4/3] md:aspect-auto md:min-h-[320px]">
                <FoodImage src={signature.imageUrl} alt={signature.name} category={signature.category?.name} width={720} height={540} />
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-10">
                <p className="eyebrow">Signature dish</p>
                <h2 id="home-signature" className="mt-3 font-serif text-3xl text-ink">
                  {signature.name}
                </h2>
                {signature.description && <p className="mt-3 text-base text-muted">{signature.description}</p>}
                <div className="mt-6 flex items-center justify-between gap-4">
                  <PriceTag amount={lowestPrice(signature).amount} from={lowestPrice(signature).multiple} size="lg" />
                  <span className="inline-flex items-center gap-1.5 text-sm text-ink">
                    View dish <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </Link>
          </Reveal>
        )}

        {/* Popular (from real orders) */}
        {popularItems.length > 0 && (
          <Reveal as="section" aria-labelledby="home-popular">
            <SectionHeader id="home-popular" title="Most ordered" description="Based on completed orders." />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {popularItems.slice(0, 6).map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          </Reveal>
        )}

        {/* Visit: hours, location, contact */}
        <Reveal as="section" aria-labelledby="home-visit" className="grid gap-10 border-t border-line pt-16 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 id="home-visit" className="font-serif text-3xl text-ink">
              Visit us
            </h2>
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted">
              <span className={status.isOpen ? 'h-1.5 w-1.5 rounded-full bg-accent' : 'h-1.5 w-1.5 rounded-full bg-warning'} aria-hidden="true" />
              {openStatusLine(status) || closedStatusLine(status)}
            </p>
          </div>
          <dl className="grid gap-8 sm:grid-cols-3">
            <div>
              <dt className="eyebrow">Hours</dt>
              <dd className="mt-3 space-y-1 text-sm">
                {hours.map((row) => (
                  <p key={row.label}>
                    <span className="text-muted">{row.label}</span>
                    <br />
                    <span className="tabular text-ink">{row.value}</span>
                  </p>
                ))}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Location</dt>
              <dd className="mt-3 text-sm text-ink">
                <p>{settings.address}</p>
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center text-muted underline-offset-4 hover:text-ink hover:underline">
                    Open in Maps<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Contact</dt>
              <dd className="mt-3 text-sm">
                {settings.phone && (
                  <a href={`tel:${tel}`} className="block min-h-11 py-2.5 text-ink hover:text-accent sm:min-h-0 sm:py-0">
                    {settings.phone}
                  </a>
                )}
                {settings.email && (
                  <a href={`mailto:${settings.email}`} className="block min-h-11 break-all py-2.5 text-muted hover:text-ink sm:mt-1 sm:min-h-0 sm:py-0">
                    {settings.email}
                  </a>
                )}
              </dd>
            </div>
          </dl>
        </Reveal>

        {/* Reviews: shown only when real reviews exist */}
        {reviews.length > 0 && (
          <Reveal as="section" aria-labelledby="home-reviews">
            <SectionHeader
              id="home-reviews"
              title="What guests say"
              description={
                averageRating ? (
                  <span className="tabular">
                    {Number(averageRating).toFixed(1)} out of 5 from {totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'}
                  </span>
                ) : undefined
              }
            />
            <ul className="mt-8 grid gap-5 md:grid-cols-3">
              {reviews.slice(0, 3).map((rev) => (
                <li key={rev.id} className="flex flex-col rounded-lg border border-line bg-surface p-5">
                  <Stars rating={rev.rating} />
                  <blockquote className="mt-4 line-clamp-5 flex-1 text-base text-ink">{rev.comment}</blockquote>
                  <p className="mt-5 text-sm text-muted">
                    {rev.customer?.name || 'Guest'} · {formatDate(rev.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
            {reviews.length > 3 && (
              <Button variant="secondary" size="sm" className="mt-6" onClick={() => setIsAllReviewsOpen(true)}>
                Read all {reviews.length} reviews
              </Button>
            )}
          </Reveal>
        )}

        {/* Reservations */}
        <Reveal as="section" aria-labelledby="home-reserve" className="rounded-lg border border-line bg-deep p-6 sm:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <h2 id="home-reserve" className="font-serif text-3xl text-ink">
                Eating in? Book a table.
              </h2>
              <p className="mt-3 text-base text-muted">
                Pick a date, time and party size. It takes under a minute.
                {!isTablesLoading && !isTablesError && tableAvailability && (
                  <span className="tabular">
                    {' '}
                    {tableAvailability.availableTables} of {tableAvailability.totalTables} tables are free right now.
                  </span>
                )}
              </p>
            </div>
            <ButtonLink to="/reservation" size="lg" className="self-start md:self-auto">
              Book a table
            </ButtonLink>
          </div>
        </Reveal>
      </div>

      <Dialog isOpen={isAllReviewsOpen} onClose={() => setIsAllReviewsOpen(false)} title={`All reviews (${reviews.length})`} maxWidth="xl">
        <ul className="divide-y divide-line">
          {reviews.map((rev) => (
            <li key={rev.id} className="py-4 first:pt-0">
              <div className="flex items-center justify-between gap-3">
                <Stars rating={rev.rating} />
                <span className="text-xs text-muted">{formatDate(rev.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm text-ink">{rev.comment}</p>
              <p className="mt-2 text-sm text-muted">{rev.customer?.name || 'Guest'}</p>
            </li>
          ))}
        </ul>
      </Dialog>
    </>
  );
};
