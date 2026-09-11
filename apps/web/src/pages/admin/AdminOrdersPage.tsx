import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { Order, OrderStatus } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Search, Filter, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/date';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal">Orders</h1>
          <p className="text-stone-500 mt-1">{data?.total ?? 0} orders total</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()} id="refresh-orders-btn">
          <RefreshCcw className="w-4 h-4 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by order # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
            id="order-search-input"
          />
        </div>
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v: any) => { setStatus(typeof v === 'string' ? v : v?.target?.value || ''); setPage(1); }}
          className="w-40"
          id="order-status-filter"
        />
        <Select
          options={TYPE_OPTIONS}
          value={type}
          onChange={(v: any) => { setType(typeof v === 'string' ? v : v?.target?.value || ''); setPage(1); }}
          className="w-40"
          id="order-type-filter"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-5 py-3 font-semibold text-stone-500 text-xs uppercase tracking-wide">Order</th>
                <th className="text-left px-5 py-3 font-semibold text-stone-500 text-xs uppercase tracking-wide">Customer</th>
                <th className="text-left px-5 py-3 font-semibold text-stone-500 text-xs uppercase tracking-wide">Type</th>
                <th className="text-left px-5 py-3 font-semibold text-stone-500 text-xs uppercase tracking-wide">Total</th>
                <th className="text-left px-5 py-3 font-semibold text-stone-500 text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-stone-500 text-xs uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3 font-semibold text-stone-500 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-5 py-3"><Skeleton className="h-5 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-terracotta">
                        <Link to={`/admin/orders/${order.id}`} className="hover:underline" id={`order-link-${order.id}`}>
                          #{order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-charcoal">{order.customer?.name}</div>
                        <div className="text-xs text-stone-400">{order.customer?.email}</div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="secondary" size="sm">{order.type.replace('_', ' ')}</Badge>
                      </td>
                      <td className="px-5 py-3 font-semibold">{formatCurrency(order.total)}</td>
                      <td className="px-5 py-3">
                        <Badge variant={STATUS_BADGE[order.status] as any} size="sm">{order.status}</Badge>
                      </td>
                      <td className="px-5 py-3 text-stone-500 text-xs">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {NEXT_STATUSES[order.status].map((next) => (
                            <button
                              key={next}
                              id={`order-${order.id}-status-${next}`}
                              onClick={() => updateStatus.mutate({ orderId: order.id, newStatus: next })}
                              disabled={updateStatus.isPending}
                              className="text-xs px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-terracotta hover:text-white font-medium transition-colors disabled:opacity-50"
                            >
                              → {next}
                            </button>
                          ))}
                          {NEXT_STATUSES[order.status].length === 0 && (
                            <span className="text-xs text-stone-400">Terminal</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && !isLoading && (
          <div className="text-center py-12 text-stone-400">No orders found.</div>
        )}
      </div>

      {/* Pagination */}
      {(data?.pages || 1) > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} id="prev-page-btn">
            Previous
          </Button>
          <span className="text-sm text-stone-500">Page {page} of {data?.pages}</span>
          <Button variant="secondary" size="sm" disabled={page === data?.pages} onClick={() => setPage(p => p + 1)} id="next-page-btn">
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
