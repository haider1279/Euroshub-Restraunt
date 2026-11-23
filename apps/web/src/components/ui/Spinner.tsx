import React from 'react';
import { cn } from '../../utils/cn';

export const Spinner: React.FC<{ className?: string; label?: string }> = ({ className, label }) => (
  <svg
    className={cn('spin h-5 w-5 shrink-0', className)}
    viewBox="0 0 24 24"
    fill="none"
    role={label ? 'status' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

/** Centered loading state for route guards and lazy routes. */
export const PageSpinner: React.FC<{ label?: string }> = ({ label = 'Loading' }) => (
  <div className="flex min-h-[50vh] items-center justify-center text-muted">
    <Spinner className="h-6 w-6" label={label} />
  </div>
);
