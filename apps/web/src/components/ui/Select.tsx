import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { controlClasses, FieldProps, FieldShell, useFieldId } from './Field';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>, FieldProps {
  options: SelectOption[];
  placeholder?: string;
  wrapperClassName?: string;
}

/**
 * Native select. onChange receives the native change event, so it works with
 * react-hook-form's register() as well as plain (e) => e.target.value handlers.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, className, wrapperClassName, id, required, ...props }, ref) => {
    const selectId = useFieldId(id);
    return (
      <FieldShell id={selectId} label={label} error={error} helperText={helperText} required={required} className={wrapperClassName ?? className}>
        {(a11y) => (
          <div className="relative">
            <select
              ref={ref}
              required={required}
              className={cn(controlClasses(!!error), 'cursor-pointer appearance-none pr-10')}
              {...a11y}
              {...props}
            >
              {placeholder && <option value="">{placeholder}</option>}
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
              aria-hidden="true"
            />
          </div>
        )}
      </FieldShell>
    );
  }
);
Select.displayName = 'Select';
