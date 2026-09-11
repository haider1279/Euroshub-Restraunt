import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement> | ((value: string) => void);
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', id, onChange, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        (onChange as any)(e.target.value, e);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-charcoal-700 dark:text-charcoal-200 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          onChange={handleChange}
          className={cn(
            'block w-full rounded-md border text-sm px-3.5 py-2.5 transition-bistro focus:outline-none focus:ring-1',
            error
              ? 'border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500 dark:text-red-300 dark:border-red-500'
              : 'border-bistro-border text-charcoal bg-white focus:border-terracotta focus:ring-terracotta dark:bg-charcoal-800 dark:border-charcoal-700 dark:text-charcoal-100 dark:focus:border-terracotta',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="dark:bg-charcoal-800 dark:text-charcoal-100">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
