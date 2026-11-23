import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Spinner } from './Spinner';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-night hover:bg-ink/90 disabled:bg-ink/40',
  secondary:
    'border border-line-strong bg-transparent text-ink hover:border-ink/30 hover:bg-ink/[0.04]',
  ghost: 'bg-transparent text-muted hover:bg-ink/[0.06] hover:text-ink',
  danger: 'border border-danger/40 bg-danger/10 text-danger hover:bg-danger/[0.16] hover:border-danger/60',
};

// Mobile keeps a 44px minimum tap target; small buttons tighten from 640px up.
const SIZES: Record<ButtonSize, string> = {
  sm: 'h-11 sm:h-9 px-4 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(
    'pressable inline-flex select-none items-center justify-center whitespace-nowrap rounded-full font-medium',
    'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? <Spinner className="h-4 w-4" /> : leftIcon}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  )
);
Button.displayName = 'Button';

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
}

/** A router link styled as a button. Use instead of nesting <Button> inside <Link>. */
export const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ variant = 'primary', size = 'md', leftIcon, rightIcon, disabled, className, children, ...props }, ref) => (
    <Link
      ref={ref}
      className={buttonClasses({ variant, size, className: className as string })}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      {...props}
    >
      {leftIcon}
      <span>{children}</span>
      {rightIcon}
    </Link>
  )
);
ButtonLink.displayName = 'ButtonLink';
