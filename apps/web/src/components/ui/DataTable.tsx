import React from 'react';
import { cn } from '../../utils/cn';

/** Dense, readable admin tables. Compose with Th / Td / Tr. */
export const TableShell: React.FC<{ children: React.ReactNode; className?: string; footer?: React.ReactNode }> = ({
  children,
  className,
  footer,
}) => (
  <div className={cn('overflow-hidden rounded-lg border border-line bg-surface', className)}>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
    {footer}
  </div>
);

export const THead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="border-b border-line bg-deep">{children}</thead>
);

export const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <th
    scope="col"
    className={cn('whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-[0.08em] text-muted', className)}
    {...props}
  />
);

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <td className={cn('px-4 py-3 align-middle text-ink', className)} {...props} />
);

export const Tr: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, ...props }) => (
  <tr className={cn('border-b border-line transition-colors last:border-0 hover:bg-ink/[0.03]', className)} {...props} />
);

/** Full-width row for empty / error messages inside a table body */
export const TableMessage: React.FC<{ colSpan: number; children: React.ReactNode }> = ({ colSpan, children }) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-muted">
      {children}
    </td>
  </tr>
);

/** Small action button used inside table rows */
export const RowAction: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'default' | 'danger' | 'accent' }> = ({
  className,
  tone = 'default',
  ...props
}) => (
  <button
    type="button"
    className={cn(
      'pressable inline-flex h-11 min-w-11 items-center sm:h-9 sm:min-w-9 justify-center gap-1.5 rounded-full border px-3 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50',
      tone === 'default' && 'border-line-strong text-muted hover:border-ink/30 hover:text-ink',
      tone === 'accent' && 'border-accent/40 text-accent hover:bg-accent/10',
      tone === 'danger' && 'border-danger/30 text-danger hover:bg-danger/10',
      className
    )}
    {...props}
  />
);

/** Page-level pager for admin and account lists */
export const Pager: React.FC<{
  page: number;
  pages: number;
  onChange: (page: number) => void;
  className?: string;
}> = ({ page, pages, onChange, className }) =>
  pages > 1 ? (
    <nav aria-label="Pagination" className={cn('flex items-center justify-between gap-3 text-sm text-muted', className)}>
      <span className="tabular">
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <RowAction disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </RowAction>
        <RowAction disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next
        </RowAction>
      </div>
    </nav>
  ) : null;
