import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Order } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { formatDateTime } from '../../utils/date';
import { StatusBadge, humanize } from '../ui/Badge';
import { Timeline } from '../ui/Timeline';

/** One order in a list: number, status, compact progress bar, total. Whole row links to the detail page. */
export const OrderRow: React.FC<{ order: Order }> = ({ order }) => (
  <li>
    <Link
      to={`/account/orders/${order.id}`}
      className="card-interactive group block rounded-lg border border-line bg-surface p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="tabular font-mono text-sm text-ink">{order.orderNumber}</span>
            <StatusBadge status={order.status} size="sm" />
          </div>
          <p className="mt-1.5 text-sm text-muted">
            {formatDateTime(order.createdAt)} · {humanize(order.type)}
            {order.tableNumber ? ` · Table ${order.tableNumber}` : ''} · {order.items.length}{' '}
            {order.items.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="tabular text-base text-ink">{formatCurrency(order.total)}</span>
          <ChevronRight className="h-4 w-4 text-subtle transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-4">
        <Timeline currentStatus={order.status} compact />
      </div>
    </Link>
  </li>
);
