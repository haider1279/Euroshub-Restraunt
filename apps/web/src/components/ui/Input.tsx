import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-charcoal-700 dark:text-charcoal-200 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-md shadow-sm">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-400 dark:text-charcoal-500">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'block w-full rounded-md border text-sm px-3.5 py-2.5 transition-bistro focus:outline-none focus:ring-1',
              error
                ? 'border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500 dark:text-red-300 dark:border-red-500'
                : 'border-bistro-border text-charcoal bg-white focus:border-terracotta focus:ring-terracotta dark:bg-charcoal-800 dark:border-charcoal-700 dark:text-charcoal-100 dark:focus:border-terracotta',
              leftIcon ? 'pl-10' : '',
              rightIcon ? 'pr-10' : '',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-charcoal-400 dark:text-charcoal-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-xs text-charcoal-400 dark:text-charcoal-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
