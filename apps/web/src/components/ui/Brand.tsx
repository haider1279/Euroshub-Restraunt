import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { resolveImageUrl } from './FoodImage';

interface BrandProps {
  name: string;
  logoUrl?: string | null;
  to?: string;
  className?: string;
  /** Small caption under the name, e.g. "Admin" */
  caption?: string;
}

/** Restaurant wordmark. Shows the uploaded logo when one is set. */
export const Brand: React.FC<BrandProps> = ({ name, logoUrl, to = '/', className, caption }) => (
  <Link
    to={to}
    className={cn('inline-flex min-h-11 items-center gap-2.5 rounded text-ink', className)}
    aria-label={`${name}, home`}
  >
    {logoUrl && (
      <img
        src={resolveImageUrl(logoUrl)}
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 rounded object-contain"
        decoding="async"
      />
    )}
    <span className="flex flex-col leading-none">
      <span className="font-serif text-lg tracking-display">{name}</span>
      {caption && <span className="mt-1 text-xs text-muted">{caption}</span>}
    </span>
  </Link>
);
