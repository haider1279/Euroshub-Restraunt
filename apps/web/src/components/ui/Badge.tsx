import React from 'react';
import { cn } from '../../utils/cn';

type Tone = 'neutral' | 'accent' | 'cyan' | 'warning' | 'danger' | 'rose';

export type BadgeVariant =
  | Tone
  // Status names map straight to a tone
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

const TONE_OF: Record<BadgeVariant, Tone> = {
  neutral: 'neutral',
  accent: 'accent',
  cyan: 'cyan',
  warning: 'warning',
  danger: 'danger',
  rose: 'rose',
  pending: 'warning',
  confirmed: 'cyan',
  preparing: 'cyan',
  ready: 'accent',
  completed: 'neutral',
  cancelled: 'danger',
};

const TONES: Record<Tone, { pill: string; dot: string }> = {
  neutral: { pill: 'border-line-strong bg-ink/[0.04] text-muted', dot: 'bg-muted' },
  accent: { pill: 'border-accent/30 bg-accent/10 text-accent', dot: 'bg-accent' },
  cyan: { pill: 'border-cyan/30 bg-cyan/10 text-cyan', dot: 'bg-cyan' },
  warning: { pill: 'border-warning/30 bg-warning/10 text-warning', dot: 'bg-warning' },
  danger: { pill: 'border-danger/30 bg-danger/10 text-danger', dot: 'bg-danger' },
  rose: { pill: 'border-rose/30 bg-rose/10 text-rose', dot: 'bg-rose' },
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', size = 'md', className, dot = false }) => {
  const tone = TONE_OF[(variant as string).toLowerCase() as BadgeVariant] ?? 'neutral';
  const styles = TONES[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-medium',
        size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs',
        styles.pill,
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', styles.dot)} aria-hidden="true" />}
      {children}
    </span>
  );
};

/** "PREPARING" -> "Preparing", "DINE_IN" -> "Dine-in" */
export const humanize = (value: string) => {
  const s = value.toLowerCase().replace(/_/g, value === 'DINE_IN' ? '-' : ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Badge for an order or reservation status, consistently colored and labelled. */
export const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md'; className?: string }> = ({ status, size, className }) => (
  <Badge variant={status.toLowerCase()} size={size} dot className={className}>
    {humanize(status)}
  </Badge>
);
