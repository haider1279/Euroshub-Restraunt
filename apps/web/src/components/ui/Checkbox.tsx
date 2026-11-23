import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { useFieldId } from './Field';

interface ChoiceProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned content, e.g. an add-on price */
  aside?: React.ReactNode;
}

const boxBase =
  'peer relative mt-0.5 h-5 w-5 shrink-0 cursor-pointer appearance-none border border-line-strong bg-surface transition-colors duration-200 ' +
  'checked:border-accent checked:bg-accent hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-50';

/** Full-row tap target (min 44px) with the control on the left. */
const rowBase =
  'flex min-h-11 cursor-pointer items-start gap-3 rounded border border-line bg-surface px-3.5 py-3 transition-colors duration-200 ' +
  'hover:border-line-strong has-[:checked]:border-accent/50 has-[:checked]:bg-accent/[0.06] has-[:disabled]:cursor-not-allowed';

export const Checkbox = forwardRef<HTMLInputElement, ChoiceProps>(
  ({ label, description, aside, className, id, ...props }, ref) => {
    const inputId = useFieldId(id);
    return (
      <label htmlFor={inputId} className={cn(rowBase, className)}>
        <span className="relative flex">
          <input ref={ref} id={inputId} type="checkbox" className={cn(boxBase, 'rounded')} {...props} />
          <svg
            viewBox="0 0 16 16"
            className="pointer-events-none absolute left-0.5 top-1 h-4 w-4 text-night opacity-0 peer-checked:opacity-100"
            aria-hidden="true"
          >
            <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-ink">{label}</span>
          {description && <span className="mt-0.5 block text-sm text-muted">{description}</span>}
        </span>
        {aside && <span className="shrink-0 text-sm text-muted tabular">{aside}</span>}
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export const Radio = forwardRef<HTMLInputElement, ChoiceProps>(
  ({ label, description, aside, className, id, ...props }, ref) => {
    const inputId = useFieldId(id);
    return (
      <label htmlFor={inputId} className={cn(rowBase, className)}>
        <span className="relative flex">
          <input ref={ref} id={inputId} type="radio" className={cn(boxBase, 'rounded-full')} {...props} />
          <span
            className="pointer-events-none absolute left-[6px] top-[8px] h-2 w-2 rounded-full bg-night opacity-0 peer-checked:opacity-100"
            aria-hidden="true"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-ink">{label}</span>
          {description && <span className="mt-0.5 block text-sm text-muted">{description}</span>}
        </span>
        {aside && <span className="shrink-0 text-sm text-muted tabular">{aside}</span>}
      </label>
    );
  }
);
Radio.displayName = 'Radio';
