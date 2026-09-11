import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-semibold text-charcoal-700 dark:text-charcoal-200 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={cn(
            'block w-full rounded-md border text-sm p-3 transition-bistro focus:outline-none focus:ring-1',
            error
              ? 'border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500 dark:text-red-300 dark:border-red-500'
              : 'border-bistro-border text-charcoal bg-white focus:border-terracotta focus:ring-terracotta dark:bg-charcoal-800 dark:border-charcoal-700 dark:text-charcoal-100 dark:focus:border-terracotta',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-xs text-charcoal-400 dark:text-charcoal-500">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
