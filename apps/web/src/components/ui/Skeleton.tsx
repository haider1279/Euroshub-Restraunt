import React from 'react';
import { cn } from '../../utils/cn';

/** Static placeholder block. No pulsing: the layout itself signals loading. */
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('rounded bg-ink/[0.06]', className)} aria-hidden="true" />
);

export const DishCardSkeleton: React.FC = () => (
  <div className="overflow-hidden rounded-lg border border-line bg-surface" aria-hidden="true">
    <Skeleton className="aspect-[4/3] w-full rounded-none" />
    <div className="space-y-3 p-4">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  </div>
);

export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => (
  <tr aria-hidden="true">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3.5">
        <Skeleton className="h-4 w-full max-w-[120px]" />
      </td>
    ))}
  </tr>
);

/** Visually hidden live status for screen readers while a skeleton is shown. */
export const LoadingStatus: React.FC<{ label?: string }> = ({ label = 'Loading' }) => (
  <p className="sr-only" role="status">
    {label}
  </p>
);
