/**
 * Shared query definitions for menu data. Pages and prefetchers use the same
 * key + fetcher so a prefetch (e.g. hovering "Order now") fills the exact cache
 * entry the menu page reads. Endpoints are unchanged.
 */
import { QueryClient } from '@tanstack/react-query';
import { apiRequest } from './client';
import { MenuCategory, MenuItem } from '../types';

const FIVE_MINUTES = 5 * 60 * 1000;

export const categoriesQuery = {
  queryKey: ['categories'],
  queryFn: () => apiRequest<{ categories: MenuCategory[] }>('/menu-categories'),
  staleTime: FIVE_MINUTES,
};

export const menuItemsQuery = {
  queryKey: ['menuItems'],
  queryFn: () => apiRequest<{ items: MenuItem[] }>('/menu-items?isAvailable=true&pageSize=100'),
  staleTime: FIVE_MINUTES,
};

let prefetched = false;
/** Warm the menu route: data plus the lazy route chunk. Runs once per session. */
export function prefetchMenu(queryClient: QueryClient) {
  if (prefetched) return;
  prefetched = true;
  queryClient.prefetchQuery(menuItemsQuery);
  queryClient.prefetchQuery(categoriesQuery);
  import('../pages/public/MenuPage');
}
