import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-charcoal-100 rounded-md ${className}`}
    />
  );
};

export const DishCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-bistro-border overflow-hidden shadow-soft p-4 flex flex-col">
      <Skeleton className="h-44 w-full rounded-md mb-4" />
      <div className="flex justify-between items-start mb-2">
        <Skeleton className="h-6 w-3/5" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-4 w-full mb-1.5" />
      <Skeleton className="h-4 w-4/5 mb-4" />
      <div className="mt-auto pt-3 border-t border-bistro-border flex items-center justify-between">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
    </div>
  );
};

export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => {
  return (
    <tr className="border-b border-bistro-border animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-3.5 px-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
};
