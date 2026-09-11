import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client';
import { TableAvailability } from '../types';
import { subscribeToSync } from '../utils/sync';

export const useTableAvailability = (targetDate?: string) => {
  const queryClient = useQueryClient();

  const queryKey = ['tableAvailability', targetDate || 'now'];

  const { data, isLoading, isError, refetch } = useQuery<{ availability: TableAvailability }>({
    queryKey,
    queryFn: () => {
      const url = targetDate
        ? `/tables/availability?date=${encodeURIComponent(targetDate)}`
        : '/tables/availability';
      return apiRequest<{ availability: TableAvailability }>(url);
    },
    refetchInterval: 10000, // Live poll every 10 seconds
    refetchOnWindowFocus: true,
  });

  // Cross-tab sync listener: refetch immediately when tables/orders/reservations change
  useEffect(() => {
    const unsubscribe = subscribeToSync((type) => {
      if (type === 'tables') {
        queryClient.invalidateQueries({ queryKey: ['tableAvailability'] });
      }
    });
    return unsubscribe;
  }, [queryClient]);

  const availability = data?.availability || {
    totalTables: 100,
    availableTables: 100,
    occupiedTables: 0,
    totalSeats: 400,
    availableSeats: 400,
  };

  return {
    data: availability,
    availability,
    isLoading,
    isError,
    refetch,
  };
};
