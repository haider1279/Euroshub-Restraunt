import React from 'react';
import { Check, X } from 'lucide-react';
import { OrderStatus } from '../../types';
import { cn } from '../../utils/cn';

const STEPS: { status: OrderStatus; label: string; description: string }[] = [
  { status: 'PENDING', label: 'Placed', description: 'The kitchen has your order.' },
  { status: 'CONFIRMED', label: 'Confirmed', description: 'Accepted by the kitchen.' },
  { status: 'PREPARING', label: 'Preparing', description: 'Being made now.' },
  { status: 'READY', label: 'Ready', description: 'Ready at the counter or your table.' },
  { status: 'COMPLETED', label: 'Completed', description: 'Served or picked up.' },
];

interface TimelineProps {
  currentStatus: OrderStatus;
  /** Compact single-row version for order lists */
  compact?: boolean;
}

export const Timeline: React.FC<TimelineProps> = ({ currentStatus, compact = false }) => {
  if (currentStatus === 'CANCELLED') {
    return (
      <div className="flex items-start gap-3 rounded border border-danger/30 bg-danger/[0.06] p-4">
        <X className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-ink">Order cancelled</p>
          {!compact && <p className="mt-0.5 text-sm text-muted">This order will not be prepared.</p>}
        </div>
      </div>
    );
  }

  const currentIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.status === currentStatus)
  );

  if (compact) {
    return (
      <ol className="flex items-center gap-1.5" aria-label={`Order status: ${STEPS[currentIndex].label}`}>
        {STEPS.map((step, i) => (
          <li
            key={step.status}
            className={cn('h-1 flex-1 rounded-full', i <= currentIndex ? 'bg-accent' : 'bg-ink/10')}
            aria-hidden="true"
          />
        ))}
      </ol>
    );
  }

  return (
    <ol className="grid gap-0 md:grid-cols-5" aria-label="Order progress">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        const isLast = i === STEPS.length - 1;
        return (
          <li
            key={step.status}
            aria-current={current ? 'step' : undefined}
            className="relative flex gap-4 pb-6 last:pb-0 md:flex-col md:gap-3 md:pb-0 md:pr-4"
          >
            {/* Connector: vertical on mobile, horizontal from md */}
            {!isLast && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-[11px] top-7 h-[calc(100%-28px)] w-px md:left-7 md:top-[11px] md:h-px md:w-[calc(100%-28px)]',
                  done ? 'bg-accent/60' : 'bg-line-strong'
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                done && 'border-accent bg-accent text-night',
                current && 'border-accent bg-canvas text-accent',
                !done && !current && 'border-line-strong bg-canvas text-subtle'
              )}
            >
              {done ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <span className={cn('h-2 w-2 rounded-full', current ? 'bg-accent' : 'bg-ink/20')} aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0">
              <p className={cn('text-sm font-medium', done || current ? 'text-ink' : 'text-muted')}>
                {step.label}
                {done && <span className="sr-only"> (done)</span>}
                {current && <span className="sr-only"> (current)</span>}
              </p>
              <p className="mt-0.5 text-sm text-muted">{step.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
};
