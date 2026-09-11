import React from 'react';
import { cn } from '../../utils/cn';

export type BadgeVariant =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'default'
  | 'terracotta'
  | 'olive'
  | 'secondary'
  | 'warning'
  | 'success'
  | 'danger'
  | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const variantStyles: Record<BadgeVariant, { bg: string; dot: string }> = {
    pending: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
      dot: 'bg-amber-500',
    },
    warning: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
      dot: 'bg-amber-500',
    },
    confirmed: {
      bg: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
      dot: 'bg-slate-500 dark:bg-slate-400',
    },
    info: {
      bg: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50',
      dot: 'bg-blue-500',
    },
    preparing: {
      bg: 'bg-orange-50 text-terracotta-700 border-terracotta-200 dark:bg-orange-950/40 dark:text-terracotta-300 dark:border-terracotta-800/50',
      dot: 'bg-terracotta',
    },
    ready: {
      bg: 'bg-lime-50 text-olive-700 border-olive-200 dark:bg-lime-950/40 dark:text-olive-300 dark:border-olive-800/50',
      dot: 'bg-olive',
    },
    completed: {
      bg: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800/50',
      dot: 'bg-green-600',
    },
    success: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
      dot: 'bg-emerald-600',
    },
    cancelled: {
      bg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/50',
      dot: 'bg-red-500',
    },
    danger: {
      bg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/50',
      dot: 'bg-red-500',
    },
    default: {
      bg: 'bg-charcoal-100 text-charcoal-800 border-charcoal-200 dark:bg-charcoal-700 dark:text-charcoal-200 dark:border-charcoal-600',
      dot: 'bg-charcoal-500',
    },
    secondary: {
      bg: 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
      dot: 'bg-stone-400',
    },
    terracotta: {
      bg: 'bg-terracotta-50 text-terracotta-800 border-terracotta-200 dark:bg-terracotta-950/40 dark:text-terracotta-300 dark:border-terracotta-800/50',
      dot: 'bg-terracotta',
    },
    olive: {
      bg: 'bg-olive-50 text-olive-800 border-olive-200 dark:bg-olive-950/40 dark:text-olive-300 dark:border-olive-800/50',
      dot: 'bg-olive',
    },
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  const current = variantStyles[variant.toLowerCase() as BadgeVariant] || variantStyles.default;

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        sizeStyles[size],
        current.bg,
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', current.dot)} />}
      {children}
    </span>
  );
};
