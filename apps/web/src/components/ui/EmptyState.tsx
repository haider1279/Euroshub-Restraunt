import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button, ButtonLink } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
  compact?: boolean;
}

/** Left-aligned, quiet empty state. One optional action. */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
  compact,
}) => (
  <div className={cn('rounded-lg border border-dashed border-line-strong', compact ? 'p-5' : 'p-6 sm:p-8', className)}>
    {icon && <div className="mb-4 text-subtle [&>svg]:h-6 [&>svg]:w-6">{icon}</div>}
    <h3 className="font-serif text-xl text-ink">{title}</h3>
    {description && <p className="mt-1.5 max-w-prose text-sm text-muted">{description}</p>}
    {actionLabel && (
      <div className="mt-5">
        {actionHref ? (
          <ButtonLink to={actionHref} variant="secondary" size="sm">
            {actionLabel}
          </ButtonLink>
        ) : (
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    )}
  </div>
);

interface ErrorStateProps {
  title?: string;
  description?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description = 'Check your connection and try again.',
  onRetry,
  className,
}) => (
  <div role="alert" className={cn('rounded-lg border border-danger/25 bg-danger/[0.05] p-6', className)}>
    <div className="flex items-start gap-3">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
      <div>
        <h3 className="font-sans text-base font-medium text-ink">{title}</h3>
        <p className="mt-1 text-sm text-muted">{description}</p>
        {onRetry && (
          <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    </div>
  </div>
);

/** Inline notice for form-level errors and status messages. */
export const Notice: React.FC<{
  tone?: 'danger' | 'warning' | 'accent' | 'neutral';
  title?: React.ReactNode;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({ tone = 'neutral', title, children, icon, className }) => {
  const tones = {
    danger: 'border-danger/30 bg-danger/[0.06] [&_.notice-icon]:text-danger',
    warning: 'border-warning/30 bg-warning/[0.06] [&_.notice-icon]:text-warning',
    accent: 'border-accent/30 bg-accent/[0.06] [&_.notice-icon]:text-accent',
    neutral: 'border-line-strong bg-ink/[0.03] [&_.notice-icon]:text-muted',
  };
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex gap-3 rounded border p-4', tones[tone], className)}>
      {icon && <span className="notice-icon mt-0.5 shrink-0 [&>svg]:h-5 [&>svg]:w-5">{icon}</span>}
      <div className="min-w-0 text-sm">
        {title && <p className="font-medium text-ink">{title}</p>}
        {children && <div className={cn('text-muted', title && 'mt-0.5')}>{children}</div>}
      </div>
    </div>
  );
};
