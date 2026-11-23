import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { RestaurantSettings, SocialLink, MenuItem } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { broadcastSync } from '../../utils/sync';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { resolveImageUrl } from '../../components/ui/FoodImage';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Skeleton } from '../../components/ui/Skeleton';
import { controlClasses } from '../../components/ui/Field';
import { RowAction } from '../../components/ui/DataTable';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { ChangePasswordCard } from '../../components/auth/ChangePasswordCard';

const Section: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <section className="rounded-lg border border-line bg-surface p-5 sm:p-6">
    <h2 className="font-sans text-base font-medium text-ink">{title}</h2>
    {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    <div className="mt-5 space-y-5">{children}</div>
  </section>
);

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
  monday: { open: '09:00', close: '00:00', closed: false },
  tuesday: { open: '09:00', close: '00:00', closed: false },
  wednesday: { open: '09:00', close: '00:00', closed: false },
  thursday: { open: '09:00', close: '00:00', closed: false },
  friday: { open: '09:00', close: '00:00', closed: false },
  saturday: { open: '09:00', close: '00:00', closed: false },
  sunday: { open: '09:00', close: '00:00', closed: false },
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
      <div className="max-w-3xl space-y-6">
        <Skeleton className="h-10 w-48" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-ink">Settings</h1>
        <p className="mt-1 text-sm text-muted">Changes go live on the website as soon as you save.</p>
      </div>

      <form onSubmit={handleSubmit((d) => save.mutate(d))} id="settings-form" className="space-y-6">
        <Section title="Restaurant details">
          <Input label="Restaurant name" id="settings-name" {...register('name', { required: true })} />
          <Textarea
            label="Description"
            id="settings-description"
            rows={3}
            helperText="Shown on the About page."
            {...register('description', { required: true })}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Phone" id="settings-phone" type="tel" {...register('phone', { required: true })} />
            <Input label="Email" id="settings-email" type="email" {...register('email', { required: true })} />
          </div>
          <Input label="Address" id="settings-address" {...register('address', { required: true })} />
          <Input
            label="Logo URL"
            id="settings-logo-url"
            helperText="Optional. Leave blank to show the restaurant name only."
            placeholder="https://"
            {...register('logoUrl')}
          />
          <Input label="Footer text" id="settings-footer-text" {...register('footerText')} />
        </Section>

        <Section title="Signature dish" description="Featured in its own block on the homepage. Leave empty to hide the block.">
          <Select
            label="Dish"
            id="settings-signature-item"
            placeholder="None"
            options={availableItems.map((item) => ({
              value: item.id,
              label: `${item.name} · ${item.category?.name || 'Item'} · ${formatCurrency(item.price)}`,
            }))}
            {...register('signatureMenuItemId')}
          />
          {selectedSignatureItem && (
            <div className="flex items-center gap-4 rounded border border-line bg-deep p-3">
              {selectedSignatureItem.imageUrl ? (
                <img
                  src={resolveImageUrl(selectedSignatureItem.imageUrl)}
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-ink/[0.06] text-xs text-muted">No image</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{selectedSignatureItem.name}</p>
                <p className="line-clamp-1 text-sm text-muted">{selectedSignatureItem.description}</p>
                <p className="tabular mt-0.5 text-sm text-ink">
                  {selectedSignatureItem.variants && selectedSignatureItem.variants.length > 1
                    ? `From ${formatCurrency(selectedSignatureItem.variants[0].price)} · ${selectedSignatureItem.variants.length} sizes`
                    : formatCurrency(selectedSignatureItem.price)}
                </p>
              </div>
            </div>
          )}
        </Section>

        <Section title="Seating" description="Total dine-in tables. Used for live availability on the website.">
          <div className="max-w-[200px]">
            <Input
              label="Tables"
              id="settings-table-count"
              type="number"
              min={1}
              max={200}
              {...register('tableCount', { valueAsNumber: true, min: 1 })}
            />
          </div>
        </Section>

        <Section title="Opening hours" description="A closing time of 12:00 AM or earlier than opening runs past midnight.">
          <ul className="divide-y divide-line rounded border border-line">
            {DAYS.map((day) => {
              const dayData = openingHours[day] || { open: '09:00', close: '00:00', closed: false };
              return (
                <li key={day} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 sm:px-4">
                  <label htmlFor={`closed-${day}`} className="flex min-h-11 w-36 cursor-pointer items-center gap-3 text-sm capitalize text-ink">
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
                      className="h-5 w-5 cursor-pointer accent-accent"
                    />
                    {day}
                  </label>
                  {dayData.closed ? (
                    <span className="text-sm text-muted">Closed</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        aria-label={`${day} opens`}
                        value={dayData.open}
                        onChange={(e) =>
                          setValue(
                            `openingHours.${day}`,
                            { ...dayData, open: e.target.value },
                            { shouldDirty: true }
                          )
                        }
                        className={cn(controlClasses(), 'w-[132px]')}
                        id={`open-${day}`}
                      />
                      <span className="text-sm text-muted" aria-hidden="true">
                        to
                      </span>
                      <input
                        type="time"
                        aria-label={`${day} closes`}
                        value={dayData.close}
                        onChange={(e) =>
                          setValue(
                            `openingHours.${day}`,
                            { ...dayData, close: e.target.value },
                            { shouldDirty: true }
                          )
                        }
                        className={cn(controlClasses(), 'w-[132px]')}
                        id={`close-${day}`}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title="Legacy homepage text" description="The current homepage uses fixed hero copy, so these two fields are not shown on the site. They are kept so nothing is lost.">
          <Input label="Hero headline" id="settings-headline" {...register('headline')} />
          <Input label="Hero subtitle" id="settings-subtitle" {...register('subtitle')} />
        </Section>

        <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-4 border-t border-line bg-canvas px-4 py-3 sm:mx-0 sm:rounded-lg sm:border sm:px-5">
          <p className="text-sm text-muted" aria-live="polite">
            {isDirty ? 'You have unsaved changes.' : 'All changes saved.'}
          </p>
          <Button type="submit" isLoading={save.isPending} disabled={!isDirty} id="save-settings-btn" leftIcon={<Save className="h-4 w-4" />}>
            Save settings
          </Button>
        </div>
      </form>

      <Section title="Social links" description="Only active links with a URL appear in the website footer.">
        <ul className="divide-y divide-line">
          {(socialLinksData?.socialLinks || []).map((s) => (
            <li key={s.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-end">
              <Input
                label={s.platform}
                type="url"
                defaultValue={s.url}
                placeholder={`https://${s.platform.toLowerCase()}.com/...`}
                id={`social-input-${s.id}`}
                wrapperClassName="flex-1"
              />
              <RowAction
                tone={s.isActive ? 'accent' : 'default'}
                className="sm:mb-1"
                onClick={() => {
                  const input = document.getElementById(`social-input-${s.id}`) as HTMLInputElement;
                  updateSocial.mutate({
                    id: s.id,
                    url: input?.value || '',
                    isActive: !s.isActive,
                  });
                }}
              >
                {s.isActive ? 'Active · turn off' : 'Off · turn on'}
              </RowAction>
            </li>
          ))}
        </ul>
      </Section>

      <ChangePasswordCard />
    </div>
  );
}
