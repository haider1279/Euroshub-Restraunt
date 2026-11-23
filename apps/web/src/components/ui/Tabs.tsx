import React, { useId, useRef } from 'react';
import { cn } from '../../utils/cn';

export interface TabItem<T extends string> {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

/** Underlined tab list with arrow-key navigation. Render the panel yourself. */
export function Tabs<T extends string>({ items, value, onChange, label, className }: TabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const step = e.key === 'ArrowRight' ? 1 : -1;
    for (let i = 1; i <= items.length; i++) {
      const next = (index + step * i + items.length) % items.length;
      if (!items[next].disabled) {
        onChange(items[next].value);
        refs.current[next]?.focus();
        break;
      }
    }
  };

  return (
    <div role="tablist" aria-label={label} className={cn('scroll-row gap-1 border-b border-line', className)}>
      {items.map((item, i) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => (refs.current[i] = el)}
            id={`${id}-${item.value}`}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'relative -mb-px min-h-11 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors duration-200',
              selected ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

interface SegmentedProps<T extends string> {
  options: { value: T; label: React.ReactNode; hint?: React.ReactNode; disabled?: boolean }[];
  value: T | null;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

/** Single-choice control (radiogroup). Used for variants and order type. */
export function SegmentedControl<T extends string>({ options, value, onChange, label, className }: SegmentedProps<T>) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex flex-wrap gap-2', className)}>
      {options.map((opt) => {
        const checked = opt.value === value;
        return (
          <label
            key={opt.value}
            className={cn(
              'pressable flex min-h-11 min-w-[88px] flex-1 cursor-pointer flex-col items-center justify-center rounded border px-3 py-2 text-center',
              'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
              checked ? 'border-accent/60 bg-accent/[0.08] text-ink' : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink',
              opt.disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={checked}
              disabled={opt.disabled}
              onChange={() => onChange(opt.value)}
            />
            <span className="text-sm font-medium">{opt.label}</span>
            {opt.hint && <span className="mt-0.5 text-xs text-muted tabular">{opt.hint}</span>}
          </label>
        );
      })}
    </div>
  );
}
