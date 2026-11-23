import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { controlClasses, FieldProps, FieldShell, useFieldId } from './Field';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, FieldProps {
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, wrapperClassName, id, rows = 3, required, ...props }, ref) => {
    const textareaId = useFieldId(id);
    return (
      <FieldShell id={textareaId} label={label} error={error} helperText={helperText} required={required} className={wrapperClassName}>
        {(a11y) => (
          <textarea
            ref={ref}
            rows={rows}
            required={required}
            className={cn(controlClasses(!!error), 'py-3 leading-relaxed', className)}
            {...a11y}
            {...props}
          />
        )}
      </FieldShell>
    );
  }
);
Textarea.displayName = 'Textarea';
