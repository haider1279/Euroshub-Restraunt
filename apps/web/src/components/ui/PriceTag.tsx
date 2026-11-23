import React from 'react';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/currency';

interface PriceTagProps {
  amount: number | string | null | undefined;
  /** Prefix "From" when the item has several prices */
  from?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZES = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'font-serif text-2xl tracking-display',
};

export const PriceTag: React.FC<PriceTagProps> = ({ amount, from, size = 'md', className }) => (
  <span className={cn('tabular whitespace-nowrap text-ink', SIZES[size], className)}>
    {from && <span className="mr-1 text-sm text-muted">From</span>}
    {formatCurrency(amount)}
  </span>
);

/** Lowest available price for a menu item (variants first, then base price). */
export const lowestPrice = (item: {
  price: number | string;
  variants?: { price: number | string; isAvailable?: boolean }[];
}) => {
  const available = (item.variants || []).filter((v) => v.isAvailable !== false);
  if (available.length === 0) return { amount: Number(item.price), multiple: false };
  return {
    amount: Math.min(...available.map((v) => Number(v.price))),
    multiple: available.length > 1,
  };
};
