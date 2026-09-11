import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { User } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { Search, Users, ShieldCheck, UserCircle } from 'lucide-react';
import { formatDate } from '../../utils/date';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal">Users</h1>
          <p className="text-stone-500 mt-1">{data?.total ?? 0} registered users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
            id="user-search-input"
          />
        </div>
        <div className="flex gap-2">
          {['', 'ADMIN', 'CUSTOMER'].map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`text-sm px-4 py-2 rounded-xl border font-medium transition-colors ${
                roleFilter === r
                  ? 'bg-terracotta text-white border-terracotta'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
              id={`filter-role-${r || 'all'}`}
            >
              {r || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-5 py-3 font-semibold text-stone-500 text-xs uppercase tracking-wide">User</th>
                <th className="text-left px-5 py-3 font-semibold text-stone-500 text-xs uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 font-semibold text-stone-500 text-xs uppercase tracking-wide">Phone</th>
                <th className="text-left px-5 py-3 font-semibold text-stone-500 text-xs uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3 font-semibold text-stone-500 text-xs uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading
                ? [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(5)].map((_, j) => (
                        <td key={j} className="px-5 py-3"><Skeleton className="h-5 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-terracotta/10 rounded-full flex items-center justify-center">
                            {user.role === 'ADMIN' ? (
                              <ShieldCheck className="w-4 h-4 text-terracotta" />
                            ) : (
                              <UserCircle className="w-4 h-4 text-stone-400" />
                            )}
                          </div>
                          <span className="font-medium text-charcoal">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-stone-500">{user.email}</td>
                      <td className="px-5 py-3 text-stone-500">{user.phone || '—'}</td>
                      <td className="px-5 py-3">
                        <Badge
                          variant={user.role === 'ADMIN' ? 'warning' : 'secondary'}
                          size="sm"
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-stone-400 text-xs">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && !isLoading && (
          <div className="text-center py-12 text-stone-400">No users found.</div>
        )}
      </div>

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
