import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { controlClasses, FieldProps, FieldShell, useFieldId } from './Field';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>, FieldProps {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, wrapperClassName, id, required, ...props }, ref) => {
    const inputId = useFieldId(id);
    return (
      <FieldShell id={inputId} label={label} error={error} helperText={helperText} required={required} className={wrapperClassName}>
        {(a11y) => (
          <div className="relative">
            {leftIcon && (
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-subtle [&>svg]:h-4 [&>svg]:w-4">
                {leftIcon}
              </span>
            )}
            <input
              ref={ref}
              required={required}
              className={cn(controlClasses(!!error), leftIcon && 'pl-10', rightIcon && 'pr-10', className)}
              {...a11y}
              {...props}
            />
            {rightIcon && (
              <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-subtle [&>svg]:h-4 [&>svg]:w-4">
                {rightIcon}
              </span>
            )}
          </div>
        )}
      </FieldShell>
    );
  }
);
Input.displayName = 'Input';
