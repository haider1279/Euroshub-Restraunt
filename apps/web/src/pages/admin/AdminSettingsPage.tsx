import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { RestaurantSettings, SocialLink } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Skeleton } from '../../components/ui/Skeleton';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Save, Clock, Truck, UtensilsCrossed, Share2, Globe } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

type SettingsForm = Omit<RestaurantSettings, 'id' | 'updatedAt' | 'openingHours'> & {
  headline?: string;
  subtitle?: string;
  logoUrl?: string;
  footerText?: string;
  openingHours: Record<string, { open: string; close: string; closed: boolean }>;
};

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<RestaurantSettings>({
    queryKey: ['restaurant-settings'],
    queryFn: async () => {
      const res = await apiRequest<{ settings: RestaurantSettings }>('/settings');
      return res.settings;
    },
  });

  const { data: socialLinksData } = useQuery<{ socialLinks: SocialLink[] }>({
    queryKey: ['admin-social-links'],
    queryFn: () => apiRequest('/admin/social-links'),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty },
  } = useForm<SettingsForm>();

  useEffect(() => {
    if (settings) {
      reset({
        name: settings.name,
        headline: (settings as any).headline || 'Fresh, Hot & Fast in Rawalpindi',
        subtitle:
          (settings as any).subtitle ||
          'Crispy burgers, loaded pizzas, and artisanal sandwiches prepared daily at Kohistan Tower, Saddar.',
        description: settings.description,
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
        logoUrl: (settings as any).logoUrl || '',
        footerText: (settings as any).footerText || '',
        deliveryEnabled: settings.deliveryEnabled,
        deliveryFee: settings.deliveryFee,
        tableCount: settings.tableCount,
        openingHours: settings.openingHours || {},
      });
    }
  }, [settings, reset]);

  const save = useMutation({
    mutationFn: (data: SettingsForm) =>
      apiRequest('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-settings'] });
      toast.success('Restaurant settings saved successfully');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const updateSocial = useMutation({
    mutationFn: ({ id, url, isActive }: { id: string; url: string; isActive: boolean }) =>
      apiRequest(`/admin/social-links/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ url, isActive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-links'] });
      queryClient.invalidateQueries({ queryKey: ['social-links'] });
      toast.success('Social link updated');
    },
    onError: () => toast.error('Failed to update social link'),
  });

  const openingHours = watch('openingHours') || {};

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-10 w-48" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-charcoal">Restaurant & Content Settings</h1>
        <p className="text-stone-500 mt-1">
          Configure live restaurant identity, address, hours, and branding without code changes.
        </p>
      </div>

      <form onSubmit={handleSubmit((d) => save.mutate(d))} id="settings-form" className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-charcoal flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-terracotta" /> Identity & Contact
          </h2>
          <Input label="Restaurant Name" id="settings-name" {...register('name', { required: true })} />
          <Input
            label="Homepage Hero Headline"
            id="settings-headline"
            {...register('headline')}
            placeholder="Fresh, Hot & Fast in Rawalpindi"
          />
          <Input
            label="Homepage Hero Subtitle"
            id="settings-subtitle"
            {...register('subtitle')}
            placeholder="Crispy burgers, loaded pizzas, and artisanal sandwiches..."
          />
          <Textarea
            label="Description"
            id="settings-description"
            rows={3}
            {...register('description', { required: true })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone Number" id="settings-phone" {...register('phone', { required: true })} />
            <Input
              label="Email Address"
              id="settings-email"
              type="email"
              {...register('email', { required: true })}
            />
          </div>
          <Input label="Address" id="settings-address" {...register('address', { required: true })} />
          <Input
            label="Logo URL (Optional / Admin-replaceable)"
            id="settings-logo-url"
            {...register('logoUrl')}
            placeholder="https://... or leave blank for horse logo"
          />
          <Input
            label="Footer Copyright / Text"
            id="settings-footer-text"
            {...register('footerText')}
            placeholder="© Euroshub Kitchen. Fresh Pakistani Fast-Food. Kohistan Tower, Saddar, Rawalpindi."
          />
        </div>

        {/* Delivery & Seating Capacity */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-charcoal flex items-center gap-2">
            <Truck className="w-4 h-4 text-terracotta" /> Delivery & Tables
          </h2>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="settings-delivery-enabled"
              {...register('deliveryEnabled')}
              className="w-4 h-4 rounded accent-terracotta"
            />
            <label htmlFor="settings-delivery-enabled" className="text-sm font-medium text-charcoal cursor-pointer">
              Enable Delivery Orders (Disabled by default; keeps delivery gated off customer UI)
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Delivery Fee (PKR)"
              id="settings-delivery-fee"
              type="number"
              step="1"
              {...register('deliveryFee', { valueAsNumber: true })}
            />
            <Input
              label="Seated Table Count"
              id="settings-table-count"
              type="number"
              {...register('tableCount', { valueAsNumber: true })}
            />
          </div>
        </div>

        {/* Opening Hours */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-charcoal flex items-center gap-2">
            <Clock className="w-4 h-4 text-terracotta" /> Kitchen Operational Hours
          </h2>
          <div className="space-y-3">
            {DAYS.map((day) => {
              const dayData = openingHours[day] || { open: '09:00', close: '12:00', closed: false };
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium text-charcoal capitalize">{day}</span>
                  <input
                    type="checkbox"
                    id={`closed-${day}`}
                    checked={!dayData.closed}
                    onChange={(e) =>
                      setValue(
                        `openingHours.${day}`,
                        { ...dayData, closed: !e.target.checked },
                        { shouldDirty: true }
                      )
                    }
                    className="w-4 h-4 rounded accent-terracotta"
                  />
                  <span className="text-xs text-stone-400">{dayData.closed ? 'Closed' : 'Open'}</span>
                  {!dayData.closed && (
                    <>
                      <input
                        type="time"
                        value={dayData.open}
                        onChange={(e) =>
                          setValue(
                            `openingHours.${day}`,
                            { ...dayData, open: e.target.value },
                            { shouldDirty: true }
                          )
                        }
                        className="text-sm border border-stone-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                        id={`open-${day}`}
                      />
                      <span className="text-stone-400 text-sm">–</span>
                      <input
                        type="time"
                        value={dayData.close}
                        onChange={(e) =>
                          setValue(
                            `openingHours.${day}`,
                            { ...dayData, close: e.target.value },
                            { shouldDirty: true }
                          )
                        }
                        className="text-sm border border-stone-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                        id={`close-${day}`}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" isLoading={save.isPending} disabled={!isDirty} id="save-settings-btn">
            <Save className="w-4 h-4 mr-1.5" /> Save Restaurant Settings
          </Button>
        </div>
      </form>

      {/* Social Links Management */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-charcoal flex items-center gap-2">
          <Share2 className="w-4 h-4 text-terracotta" /> Social Media Links (Admin Configurable)
        </h2>
        <p className="text-xs text-stone-500">
          Only active links with valid non-empty URLs will render public icons on the customer footer.
        </p>
        <div className="divide-y divide-stone-100">
          {(socialLinksData?.socialLinks || []).map((s) => (
            <div key={s.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-xs text-charcoal">{s.platform}</span>
                <span className="text-[11px] text-stone-400 block">{s.url || 'No URL configured'}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  defaultValue={s.url}
                  placeholder={`https://${s.platform.toLowerCase()}.com/...`}
                  className="text-xs px-2.5 py-1 border border-stone-200 rounded-lg w-48"
                  id={`social-input-${s.id}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById(`social-input-${s.id}`) as HTMLInputElement;
                    updateSocial.mutate({
                      id: s.id,
                      url: input?.value || '',
                      isActive: !s.isActive,
                    });
                  }}
                  className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                    s.isActive
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {s.isActive ? 'Active (Click to Hide)' : 'Inactive (Click to Enable)'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
