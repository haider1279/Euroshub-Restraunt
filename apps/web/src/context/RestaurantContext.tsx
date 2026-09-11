import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client';
import { RestaurantSettings, SocialLink } from '../types';
import { subscribeToSync } from '../utils/sync';

export type { RestaurantSettings, SocialLink };

interface RestaurantContextType {
  settings: RestaurantSettings;
  socialLinks: SocialLink[];
  isLoading: boolean;
  refetchSettings: () => Promise<any>;
  refetchSocialLinks: () => Promise<any>;
}

const defaultSettings: RestaurantSettings = {
  id: 'singleton',
  name: 'Euroshub Kitchen',
  headline: 'Fresh, Hot & Fast in Rawalpindi',
  subtitle: 'Crispy burgers, loaded pizzas, and artisanal sandwiches prepared daily at Kohistan Tower, Saddar.',
  description:
    'Euroshub Kitchen brings quality fast-food dining and takeaway to Saddar, Rawalpindi. Handcrafted pizzas, gourmet burgers, and fresh sides crafted with high-standard ingredients.',
  phone: '+92 300 1234567',
  email: 'haider1.euroshub@gmail.com',
  address: 'Kohistan Tower, Saddar, Rawalpindi, Office 609',
  logoUrl: null,
  currency: 'PKR',
  timezone: 'Asia/Karachi',
  openingHours: {
    monday: { open: '09:00', close: '12:00', closed: false },
    tuesday: { open: '09:00', close: '12:00', closed: false },
    wednesday: { open: '09:00', close: '12:00', closed: false },
    thursday: { open: '09:00', close: '12:00', closed: false },
    friday: { open: '09:00', close: '12:00', closed: false },
    saturday: { open: '09:00', close: '12:00', closed: false },
    sunday: { open: '09:00', close: '12:00', closed: false },
  },
  deliveryEnabled: false,
  deliveryFee: 0,
  tableCount: 100,
  footerText: '© Euroshub Kitchen. Fresh Pakistani Fast-Food. Kohistan Tower, Saddar, Rawalpindi.',
};

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  // 1. Live Restaurant Settings via React Query with 10s auto-polling
  const settingsQuery = useQuery<RestaurantSettings>({
    queryKey: ['restaurant-settings'],
    queryFn: async () => {
      const res = await apiRequest<{ settings: RestaurantSettings }>('/settings');
      return (res as any)?.settings || res;
    },
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  // 2. Social Links query
  const socialQuery = useQuery<{ socialLinks: SocialLink[] }>({
    queryKey: ['social-links'],
    queryFn: () => apiRequest<{ socialLinks: SocialLink[] }>('/social-links'),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  // 3. Cross-tab live synchronization: when admin saves in one tab, all tabs refetch immediately
  useEffect(() => {
    const unsubscribe = subscribeToSync((type) => {
      if (type === 'settings') {
        queryClient.invalidateQueries({ queryKey: ['restaurant-settings'] });
      } else if (type === 'menu') {
        queryClient.invalidateQueries({ queryKey: ['menuItems'] });
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        queryClient.invalidateQueries({ queryKey: ['chefSpecials'] });
        queryClient.invalidateQueries({ queryKey: ['featuredItems'] });
        queryClient.invalidateQueries({ queryKey: ['popularItems'] });
        queryClient.invalidateQueries({ queryKey: ['restaurant-settings'] });
      } else if (type === 'reviews') {
        queryClient.invalidateQueries({ queryKey: ['publicReviews'] });
      }
    });
    return unsubscribe;
  }, [queryClient]);

  const rawSettings = settingsQuery.data;
  const settings = (rawSettings as any)?.settings || rawSettings || defaultSettings;
  const socialLinks = socialQuery.data?.socialLinks || [];
  const isLoading = settingsQuery.isLoading && !settingsQuery.data;

  return (
    <RestaurantContext.Provider
      value={{
        settings,
        socialLinks,
        isLoading,
        refetchSettings: settingsQuery.refetch,
        refetchSocialLinks: socialQuery.refetch,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
