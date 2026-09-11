import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { RestaurantSettings, SocialLink, MenuItem } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { broadcastSync } from '../../utils/sync';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Skeleton } from '../../components/ui/Skeleton';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Save, Clock, UtensilsCrossed, Share2, Sparkles, Armchair } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

type SettingsForm = Omit<RestaurantSettings, 'id' | 'updatedAt' | 'openingHours'> & {
  headline?: string;
  subtitle?: string;
  logoUrl?: string;
  footerText?: string;
  signatureMenuItemId?: string;
  openingHours: Record<string, { open: string; close: string; closed: boolean }>;
};

const defaultHours: Record<string, { open: string; close: string; closed: boolean }> = {
  monday: { open: '09:00', close: '23:00', closed: false },
  tuesday: { open: '09:00', close: '23:00', closed: false },
  wednesday: { open: '09:00', close: '23:00', closed: false },
  thursday: { open: '09:00', close: '23:00', closed: false },
  friday: { open: '09:00', close: '23:00', closed: false },
  saturday: { open: '09:00', close: '23:00', closed: false },
  sunday: { open: '09:00', close: '23:00', closed: false },
};

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();

  const { data: rawSettings, isLoading } = useQuery<RestaurantSettings>({
    queryKey: ['restaurant-settings'],
    queryFn: async () => {
      const res = await apiRequest<{ settings: RestaurantSettings }>('/settings');
      return (res as any)?.settings || res;
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const settings: RestaurantSettings | undefined = (rawSettings as any)?.settings || rawSettings;

  const { data: menuData } = useQuery<{ items: MenuItem[] }>({
    queryKey: ['menuItemsForSignature'],
    queryFn: () => apiRequest<{ items: MenuItem[] }>('/menu-items?isAvailable=true&pageSize=100'),
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

  const availableItems = menuData?.items || [];
  const selectedSignatureId = watch('signatureMenuItemId');
  const selectedSignatureItem = availableItems.find((i) => i.id === selectedSignatureId) || settings?.signatureMenuItem;

  const populateFormData = (data: RestaurantSettings): SettingsForm => {
    const rawHours = data.openingHours || {};
    const mergedHours: Record<string, { open: string; close: string; closed: boolean }> = {};
    for (const day of DAYS) {
      mergedHours[day] = {
        open: rawHours[day]?.open || defaultHours[day].open,
        close: rawHours[day]?.close || defaultHours[day].close,
        closed: rawHours[day]?.closed ?? defaultHours[day].closed,
      };
    }

    return {
      name: data.name ?? '',
      headline: data.headline ?? '',
      subtitle: data.subtitle ?? '',
      description: data.description ?? '',
      phone: data.phone ?? '',
      email: data.email ?? '',
      address: data.address ?? '',
      logoUrl: data.logoUrl ?? '',
      footerText: data.footerText ?? '',
      tableCount: data.tableCount ?? 100,
      signatureMenuItemId: data.signatureMenuItemId || data.signatureMenuItem?.id || '',
      openingHours: mergedHours,
      deliveryEnabled: data.deliveryEnabled ?? false,
      deliveryFee: data.deliveryFee ?? 0,
      currency: data.currency ?? 'PKR',
      timezone: data.timezone ?? 'Asia/Karachi',
    };
  };

  useEffect(() => {
    if (settings && !isDirty) {
      reset(populateFormData(settings));
    }
  }, [settings, reset, isDirty]);

  const save = useMutation({
    mutationFn: (data: SettingsForm) => {
      const payload: any = {
        name: data.name,
        headline: data.headline && data.headline.trim() ? data.headline.trim() : null,
        subtitle: data.subtitle && data.subtitle.trim() ? data.subtitle.trim() : null,
        description: data.description,
        phone: data.phone,
        email: data.email,
        address: data.address,
        logoUrl: data.logoUrl && data.logoUrl.trim() ? data.logoUrl.trim() : null,
        footerText: data.footerText && data.footerText.trim() ? data.footerText.trim() : null,
        tableCount: Number(data.tableCount) || 100,
        signatureMenuItemId: data.signatureMenuItemId && data.signatureMenuItemId.trim() ? data.signatureMenuItemId.trim() : null,
        openingHours: data.openingHours || {},
      };
      return apiRequest<{ settings: RestaurantSettings }>('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (res: any) => {
      const updated = res?.settings || res;
      if (updated) {
        queryClient.setQueryData(['restaurant-settings'], updated);
        reset(populateFormData(updated));
      }
      queryClient.invalidateQueries({ queryKey: ['restaurant-settings'] });
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      queryClient.invalidateQueries({ queryKey: ['tableAvailability'] });
      broadcastSync('settings');
      broadcastSync('menu');
      broadcastSync('tables');
      toast.success('Restaurant settings saved successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save settings');
    },
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
      broadcastSync('settings');
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
          Configure live restaurant identity, address, hours, signature food, and branding without code changes.
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

        {/* Homepage Signature Item Configuration */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-charcoal flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-terracotta" /> Homepage Signature Item
            </h2>
            <span className="text-xs bg-terracotta-50 text-terracotta px-2.5 py-1 rounded-full font-semibold">
              Live on Hero Card
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Select the hero signature dish displayed prominently on the customer homepage. Customers clicking this dish or its order button will open its detail view with sizes and pricing.
          </p>

          <div className="space-y-3">
            <div>
              <label htmlFor="settings-signature-item" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Select Signature Dish
              </label>
              <select
                id="settings-signature-item"
                {...register('signatureMenuItemId')}
                className="block w-full rounded-xl border border-stone-200 bg-white text-sm px-3.5 py-2.5 text-charcoal focus:border-terracotta focus:ring-terracotta focus:outline-none"
              >
                <option value="">-- Choose a dish --</option>
                {availableItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.category?.name || 'Item'} — Base {formatCurrency(item.price)})
                  </option>
                ))}
              </select>
            </div>

            {selectedSignatureItem && (
              <div className="flex items-center gap-4 p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                {selectedSignatureItem.imageUrl ? (
                  <img
                    src={selectedSignatureItem.imageUrl}
                    alt={selectedSignatureItem.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-stone-200 flex items-center justify-center text-xs text-stone-500 flex-shrink-0">
                    No Image
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-charcoal truncate">{selectedSignatureItem.name}</h4>
                  <p className="text-xs text-stone-500 line-clamp-1">{selectedSignatureItem.description}</p>
                  <p className="text-xs text-terracotta font-bold mt-0.5">
                    {selectedSignatureItem.variants && selectedSignatureItem.variants.length > 1
                      ? `From ${formatCurrency(selectedSignatureItem.variants[0].price)} (${selectedSignatureItem.variants.length} size variants)`
                      : formatCurrency(selectedSignatureItem.price)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seated Table Capacity */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-charcoal flex items-center gap-2">
            <Armchair className="w-4 h-4 text-terracotta" /> Seating & Table Capacity
          </h2>
          <p className="text-xs text-stone-500">
            Total operational dining tables configured for the restaurant. Used to synchronize real-time seating availability calculations across the customer website.
          </p>
          <div className="max-w-xs">
            <Input
              label="Configured Dine-In Table Count"
              id="settings-table-count"
              type="number"
              min={1}
              max={200}
              {...register('tableCount', { valueAsNumber: true, min: 1 })}
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
