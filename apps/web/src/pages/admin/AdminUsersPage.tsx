import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { apiRequest } from '../../api/client';
import { User } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Input } from '../../components/ui/Input';
import { TableShell, THead, Th, Td, Tr, TableMessage, Pager } from '../../components/ui/DataTable';
import { formatDate } from '../../utils/date';
import { cn } from '../../utils/cn';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');

  const { data, isLoading } = useQuery<{ users: User[]; total: number; pages: number }>({
    queryKey: ['admin-users', page, roleFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (roleFilter) params.set('role', roleFilter);
      return apiRequest(`/admin/users?${params}`);
    },
  });

  const filtered = (data?.users || []).filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const roleOptions = [
    { value: '', label: 'All' },
    { value: 'ADMIN', label: 'Admins' },
    { value: 'CUSTOMER', label: 'Customers' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl text-ink">Customers</h1>
        <p className="tabular mt-1 text-sm text-muted">{data?.total ?? 0} registered accounts</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="search"
          aria-label="Search people"
          placeholder="Name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search />}
          id="user-search-input"
          wrapperClassName="sm:max-w-sm"
        />
        <div className="flex gap-1.5" role="group" aria-label="Filter by role">
          {roleOptions.map((r) => (
            <button
              key={r.value}
              type="button"
              aria-pressed={roleFilter === r.value}
              onClick={() => { setRoleFilter(r.value); setPage(1); }}
              className={cn(
                'pressable inline-flex min-h-11 items-center rounded-full border px-4 text-sm',
                roleFilter === r.value ? 'border-ink bg-ink text-night' : 'border-line-strong text-muted hover:text-ink'
              )}
              id={`filter-role-${r.value || 'all'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <TableShell>
        <THead>
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Phone</Th>
            <Th>Role</Th>
            <Th>Joined</Th>
          </tr>
        </THead>
        <tbody>
          {isLoading ? (
            [...Array(8)].map((_, i) => (
              <tr key={i} className="border-b border-line">
                {[...Array(5)].map((_, j) => (
                  <Td key={j}>
                    <Skeleton className="h-5 w-full" />
                  </Td>
                ))}
              </tr>
            ))
          ) : filtered.length === 0 ? (
            <TableMessage colSpan={5}>{search ? 'No one matches that search.' : 'No accounts yet.'}</TableMessage>
          ) : (
            filtered.map((user) => (
              <Tr key={user.id}>
                <Td className="text-ink">{user.name}</Td>
                <Td className="text-muted">{user.email}</Td>
                <Td className="tabular whitespace-nowrap text-muted">{user.phone || '—'}</Td>
                <Td>
                  <Badge variant={user.role === 'ADMIN' ? 'accent' : 'neutral'} size="sm">
                    {user.role === 'ADMIN' ? 'Admin' : 'Customer'}
                  </Badge>
                </Td>
                <Td className="tabular whitespace-nowrap text-muted">{formatDate(user.createdAt)}</Td>
              </Tr>
            ))
          )}
        </tbody>
      </TableShell>

      <Pager page={page} pages={data?.pages || 1} onChange={setPage} />
    </div>
  );
}
