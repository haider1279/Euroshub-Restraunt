import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface QuantityStepperProps {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  /** Accessible name, e.g. "Quantity for Zinger Burger" */
  label?: string;
  /** Show a remove icon instead of minus when value is 1 (cart rows) */
  removeAtOne?: boolean;
  min?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  onDecrease,
  onIncrease,
  label = 'Quantity',
  removeAtOne = false,
  min = 1,
  size = 'md',
  className,
}) => {
  const btn = cn(
    'pressable inline-flex items-center justify-center rounded-full text-ink hover:bg-ink/[0.08] disabled:cursor-not-allowed disabled:opacity-40',
    size === 'sm' ? 'h-11 w-11 sm:h-9 sm:w-9' : 'h-11 w-11'
  );
  const showRemove = removeAtOne && value <= 1;
  return (
    <div role="group" aria-label={label} className={cn('inline-flex items-center rounded-full border border-line-strong p-0.5', className)}>
      <button
        type="button"
        className={btn}
        onClick={onDecrease}
        disabled={!removeAtOne && value <= min}
        aria-label={showRemove ? 'Remove item' : 'Decrease quantity'}
      >
        {showRemove ? <Trash2 className="h-4 w-4" aria-hidden="true" /> : <Minus className="h-4 w-4" aria-hidden="true" />}
      </button>
      <span className="tabular min-w-8 text-center text-sm text-ink" aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={onIncrease} aria-label="Increase quantity">
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
};
