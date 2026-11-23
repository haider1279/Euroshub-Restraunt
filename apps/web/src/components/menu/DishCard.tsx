import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { MenuItem } from '../../types';
import { cn } from '../../utils/cn';
import { FoodImage } from '../ui/FoodImage';
import { PriceTag, lowestPrice } from '../ui/PriceTag';
import { Badge } from '../ui/Badge';

interface DishCardProps {
  dish: MenuItem;
  /** Shows a quick-add button; the rest of the card links to the dish page. */
  onQuickAdd?: (dish: MenuItem) => void;
  /** First visible card on the page gets image priority. */
  priority?: boolean;
  headingLevel?: 'h2' | 'h3';
  className?: string;
}

export const DishCard: React.FC<DishCardProps> = ({ dish, onQuickAdd, priority, headingLevel: H = 'h3', className }) => {
  const { amount, multiple } = lowestPrice(dish);
  const soldOut = !dish.isAvailable;

  return (
    <article className={cn('card-interactive group relative flex flex-col overflow-hidden rounded-lg border border-line bg-surface', className)}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <FoodImage src={dish.imageUrl} alt={dish.name} category={dish.category?.name} priority={priority} width={640} height={480} />
        {(dish.isChefSpecial || soldOut) && (
          <div className="absolute left-3 top-3 flex gap-1.5">
            {soldOut ? (
              <Badge variant="neutral" className="bg-night/90">Sold out</Badge>
            ) : (
              <Badge variant="accent" className="bg-night/90">Chef’s pick</Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <H className="font-serif text-lg leading-snug text-ink">
          {/* Stretched link: the whole card is clickable, one tab stop. */}
          <Link to={`/menu/${dish.id}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-lg focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent">
            {dish.name}
          </Link>
        </H>
        {dish.description && <p className="mt-1.5 line-clamp-2 text-sm text-muted">{dish.description}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <PriceTag amount={amount} from={multiple} />
          {onQuickAdd && (
            <button
              type="button"
              disabled={soldOut}
              onClick={() => onQuickAdd(dish)}
              className="pressable relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-line-strong text-ink hover:border-accent/60 hover:bg-accent/10 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`Add ${dish.name} to cart`}
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
