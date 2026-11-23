import React, { useId } from 'react';
import { cn } from '../../utils/cn';

/** Shared base for text-like controls: 8px radius, surface fill, border-only states. */
export const controlClasses = (hasError?: boolean) =>
  cn(
    'block w-full min-h-11 rounded border bg-surface px-3.5 text-base text-ink sm:text-sm',
    'placeholder:text-subtle transition-colors duration-200',
    'hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-50',
    hasError ? 'border-danger/70' : 'border-line focus-visible:border-accent/60'
  );

export interface FieldProps {
  label?: React.ReactNode;
  error?: string;
  helperText?: React.ReactNode;
  required?: boolean;
  className?: string;
}

interface FieldShellProps extends FieldProps {
  id: string;
  children: (a11y: { id: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) => React.ReactNode;
}

/** Label above, control, then error or helper text. Wires ids for screen readers. */
export const FieldShell: React.FC<FieldShellProps> = ({ id, label, error, helperText, required, className, children }) => {
  const descId = error ? `${id}-error` : helperText ? `${id}-help` : undefined;
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-muted">
          {label}
          {required && (
            <span className="text-muted" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': descId })}
      {error ? (
        <p id={descId} className="mt-1.5 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={descId} className="mt-1.5 text-sm text-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

export const useFieldId = (id?: string) => {
  const generated = useId();
  return id || `f${generated.replace(/:/g, '')}`;
};
