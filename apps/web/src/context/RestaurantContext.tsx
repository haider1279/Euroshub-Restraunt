import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export interface RestaurantSettings {
  id: string;
  name: string;
  headline?: string | null;
  subtitle?: string | null;
  description: string;
  phone: string;
  email: string;
  address: string;
  logoUrl?: string | null;
  currency: string;
  timezone: string;
  openingHours: Record<string, { open: string; close: string; closed?: boolean }>;
  deliveryEnabled: boolean;
  deliveryFee: number;
  tableCount: number;
  footerText?: string | null;
  reservationSettings?: any;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  isActive: boolean;
}

interface RestaurantContextType {
  settings: RestaurantSettings;
  socialLinks: SocialLink[];
  isLoading: boolean;
  refetchSettings: () => Promise<void>;
  refetchSocialLinks: () => Promise<void>;
}

const defaultSettings: RestaurantSettings = {
  id: 'singleton',
  name: 'Euroshub Kitchen',
  headline: 'Fresh, Hot & Fast in Rawalpindi',
  subtitle: 'Crispy burgers, loaded pizzas, and artisanal sandwiches prepared daily at Kohistan Tower, Saddar.',
  description:
    'Euroshub Kitchen brings quality fast-food dining and takeaway to Saddar, Rawalpindi. Handcrafted pizzas, gourmet burgers, and fresh sides crafted with high-standard ingredients.',
  phone: '+92 xxx xxx xxx (Needs Admin Input)',
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
  const [settings, setSettings] = useState<RestaurantSettings>(defaultSettings);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('/settings');
      if (res.data?.settings) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      console.warn('Could not fetch restaurant settings from API, using defaults:', err);
    }
  }, []);

  const fetchSocialLinks = useCallback(async () => {
    try {
      const res = await api.get('/social-links');
      if (res.data?.socialLinks) {
        setSocialLinks(res.data.socialLinks);
      }
    } catch (err) {
      console.warn('Could not fetch social links from API:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchSettings(), fetchSocialLinks()]);
      setIsLoading(false);
    };
    init();
  }, [fetchSettings, fetchSocialLinks]);

  return (
    <RestaurantContext.Provider
      value={{
        settings,
        socialLinks,
        isLoading,
        refetchSettings: fetchSettings,
        refetchSocialLinks: fetchSocialLinks,
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
