import React from 'react';

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
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
    },
    warning: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
    },
    confirmed: {
      bg: 'bg-slate-100 text-slate-800 border-slate-300',
      dot: 'bg-slate-500',
    },
    info: {
      bg: 'bg-blue-50 text-blue-800 border-blue-200',
      dot: 'bg-blue-500',
    },
    preparing: {
      bg: 'bg-orange-50 text-terracotta-700 border-terracotta-200',
      dot: 'bg-terracotta',
    },
    ready: {
      bg: 'bg-lime-50 text-olive-700 border-olive-200',
      dot: 'bg-olive',
    },
    completed: {
      bg: 'bg-green-50 text-green-800 border-green-200',
      dot: 'bg-green-600',
    },
    success: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-600',
    },
    cancelled: {
      bg: 'bg-red-50 text-red-700 border-red-200',
      dot: 'bg-red-500',
    },
    danger: {
      bg: 'bg-red-50 text-red-700 border-red-200',
      dot: 'bg-red-500',
    },
    default: {
      bg: 'bg-charcoal-100 text-charcoal-800 border-charcoal-200',
      dot: 'bg-charcoal-500',
    },
    secondary: {
      bg: 'bg-stone-100 text-stone-700 border-stone-200',
      dot: 'bg-stone-400',
    },
    terracotta: {
      bg: 'bg-terracotta-50 text-terracotta-800 border-terracotta-200',
      dot: 'bg-terracotta',
    },
    olive: {
      bg: 'bg-olive-50 text-olive-800 border-olive-200',
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
      className={`inline-flex items-center font-medium rounded-full border ${sizeStyles[size]} ${current.bg} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${current.dot}`} />}
      {children}
    </span>
  );
};
