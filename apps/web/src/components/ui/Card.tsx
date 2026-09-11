import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-bistro-border shadow-soft p-5 transition-bistro dark:bg-charcoal-800 dark:border-charcoal-700 dark:shadow-none',
        hoverEffect && 'hover:shadow-card hover:border-terracotta-200 dark:hover:border-terracotta-700',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
