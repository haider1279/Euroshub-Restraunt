import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Lift 2px and brighten the border on hover. Use for clickable cards. */
  interactive?: boolean;
  /** Legacy alias of `interactive` */
  hoverEffect?: boolean;
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, interactive, hoverEffect, padded = true, ...props }) => (
  <div
    className={cn(
      'rounded-lg border border-line bg-surface',
      padded && 'p-5 sm:p-6',
      (interactive || hoverEffect) && 'card-interactive',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

/** Section heading inside a card */
export const CardTitle: React.FC<{ children: React.ReactNode; className?: string; as?: 'h2' | 'h3' }> = ({
  children,
  className,
  as: Tag = 'h2',
}) => <Tag className={cn('font-serif text-xl text-ink', className)}>{children}</Tag>;
