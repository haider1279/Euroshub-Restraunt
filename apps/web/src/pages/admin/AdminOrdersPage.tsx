import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { RefreshCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '../../api/client';
import { Order, OrderStatus } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { StatusBadge, humanize } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { TableShell, THead, Th, Td, Tr, TableMessage, RowAction, Pager } from '../../components/ui/DataTable';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'READY', label: 'Ready' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'DINE_IN', label: 'Dine In' },
  { value: 'TAKEAWAY', label: 'Takeaway' },
  { value: 'DELIVERY', label: 'Delivery' },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PREPARING: 'warning',
  READY: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery<{ orders: Order[]; total: number; pages: number }>({
    queryKey: ['admin-orders', status, type, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (type) params.set('type', type);
      params.set('page', String(page));
      params.set('limit', '15');
      return apiRequest(`/admin/orders?${params}`);
    },
    refetchInterval: 15_000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ orderId, newStatus }: { orderId: string; newStatus: string }) =>
      apiRequest(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const filteredOrders = (data?.orders || []).filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customer?.name?.toLowerCase().includes(q) ||
      o.customer?.email?.toLowerCase().includes(q)
    );
  });

  const orders = filteredOrders;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-ink">Orders</h1>
          <p className="tabular mt-1 text-sm text-muted">
            {data?.total ?? 0} total · refreshes every 15 seconds
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()} id="refresh-orders-btn" leftIcon={<RefreshCcw className="h-4 w-4" />}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
        <Input
          type="search"
          aria-label="Search orders"
          placeholder="Order number, customer name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search />}
          id="order-search-input"
        />
        <Select
          aria-label="Filter by status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v: any) => { setStatus(typeof v === 'string' ? v : v?.target?.value || ''); setPage(1); }}
          id="order-status-filter"
        />
        <Select
          aria-label="Filter by type"
          options={TYPE_OPTIONS}
          value={type}
          onChange={(v: any) => { setType(typeof v === 'string' ? v : v?.target?.value || ''); setPage(1); }}
          id="order-type-filter"
        />
      </div>

      <TableShell>
        <THead>
          <tr>
            <Th>Order</Th>
            <Th>Customer</Th>
            <Th>Type</Th>
            <Th className="text-right">Total</Th>
            <Th>Status</Th>
            <Th>Placed</Th>
            <Th>Move to</Th>
          </tr>
        </THead>
        <tbody>
          {isLoading ? (
            [...Array(8)].map((_, i) => (
              <tr key={i} className="border-b border-line">
                {[...Array(7)].map((_, j) => (
                  <Td key={j}>
                    <Skeleton className="h-5 w-full" />
                  </Td>
                ))}
              </tr>
            ))
          ) : orders.length === 0 ? (
            <TableMessage colSpan={7}>{search || status || type ? 'No orders match these filters.' : 'No orders yet.'}</TableMessage>
          ) : (
            orders.map((order) => (
              <Tr key={order.id}>
                <Td>
                  <Link to={`/admin/orders/${order.id}`} className="tabular font-mono text-ink underline-offset-4 hover:underline" id={`order-link-${order.id}`}>
                    #{order.orderNumber}
                  </Link>
                </Td>
                <Td>
                  <div className="text-ink">{order.customer?.name}</div>
                  <div className="text-xs text-muted">{order.customer?.email}</div>
                </Td>
                <Td className="whitespace-nowrap text-muted">
                  {humanize(order.type)}
                  {order.tableNumber ? ` · T${order.tableNumber}` : ''}
                </Td>
                <Td className="tabular whitespace-nowrap text-right">{formatCurrency(order.total)}</Td>
                <Td>
                  <StatusBadge status={order.status} size="sm" />
                </Td>
                <Td className="tabular whitespace-nowrap text-muted">{formatDate(order.createdAt)}</Td>
                <Td>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {NEXT_STATUSES[order.status].map((next) => (
                      <RowAction
                        key={next}
                        id={`order-${order.id}-status-${next}`}
                        tone={next === 'CANCELLED' ? 'danger' : 'default'}
                        onClick={() => updateStatus.mutate({ orderId: order.id, newStatus: next })}
                        disabled={updateStatus.isPending}
                      >
                        {next === 'CANCELLED' ? 'Cancel' : humanize(next)}
                      </RowAction>
                    ))}
                    {NEXT_STATUSES[order.status].length === 0 && <span className="text-xs text-muted">Closed</span>}
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </TableShell>

      <Pager page={page} pages={data?.pages || 1} onChange={setPage} />
    </div>
  );
}
