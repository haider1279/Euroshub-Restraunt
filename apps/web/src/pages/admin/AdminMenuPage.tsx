import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { MenuItem, MenuCategory, ProductVariant } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { broadcastSync } from '../../utils/sync';
import { cn } from '../../utils/cn';
import { Badge } from '../../components/ui/Badge';
import { Button, buttonClasses } from '../../components/ui/Button';
import { resolveImageUrl } from '../../components/ui/FoodImage';
import { Skeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Checkbox } from '../../components/ui/Checkbox';
import { EmptyState, Notice } from '../../components/ui/EmptyState';
import { TableShell, THead, Th, Td, Tr, TableMessage, RowAction } from '../../components/ui/DataTable';
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, Upload, X, ImageIcon, AlertTriangle, Layers } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

/** Visual on/off track used inside role="switch" buttons. */
const Switch: React.FC<{ on: boolean }> = ({ on }) => (
  <span
    aria-hidden="true"
    className={cn('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200', on ? 'bg-accent' : 'bg-ink/20')}
  >
    <span className={cn('inline-block h-4 w-4 rounded-full bg-night transition-transform duration-200', on ? 'translate-x-6' : 'translate-x-1')} />
  </span>
);

interface MenuItemForm {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
  ingredients: string;
  tags: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  isChefSpecial: boolean;
}

export default function AdminMenuPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Product Variant Management State
  const [variantModalItem, setVariantModalItem] = useState<MenuItem | null>(null);
  const [variantFormOpen, setVariantFormOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [variantName, setVariantName] = useState('');
  const [variantPrice, setVariantPrice] = useState<string>('');
  const [variantSortOrder, setVariantSortOrder] = useState<string>('0');
  const [variantIsAvailable, setVariantIsAvailable] = useState<boolean>(true);
  const [variantFormError, setVariantFormError] = useState('');

  const { data: categories = [] } = useQuery<MenuCategory[]>({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const res = await apiRequest<{ categories: MenuCategory[] }>('/menu-categories');
      return res.categories || [];
    },
  });

  // Fetch variants for the currently-open variant modal
  const {
    data: variantModalVariants = [],
    isLoading: variantsLoading,
    refetch: refetchVariants,
  } = useQuery<ProductVariant[]>({
    queryKey: ['admin-variants', variantModalItem?.id],
    queryFn: async () => {
      const res = await apiRequest<{ variants: ProductVariant[] } | ProductVariant[]>(
        `/admin/menu-items/${variantModalItem!.id}/variants`
      );
      if (Array.isArray(res)) {
        return res;
      }
      return res?.variants || [];
    },
    enabled: !!variantModalItem,
  });

  const { data: itemsData, isLoading } = useQuery<{ items: MenuItem[] }>({
    queryKey: ['admin-menu-items', categoryFilter],
    queryFn: () => {
      const params = new URLSearchParams({ pageSize: '100', isAvailable: 'all' });
      if (categoryFilter) params.set('categoryId', categoryFilter);
      return apiRequest<{ items: MenuItem[] }>(`/admin/menu-items?${params}`);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MenuItemForm>();

  const watchedCategoryId = watch('categoryId');

  const upsertItem = useMutation({
    mutationFn: (data: any) => {
      if (editingItem) {
        return apiRequest(`/admin/menu/items/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      }
      return apiRequest('/admin/menu/items', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      queryClient.invalidateQueries({ queryKey: ['chefSpecials'] });
      queryClient.invalidateQueries({ queryKey: ['featuredItems'] });
      queryClient.invalidateQueries({ queryKey: ['popularItems'] });
      broadcastSync('menu');
      toast.success(editingItem ? 'Menu item updated' : 'Menu item created');
      closeModal();
    },
    onError: (err: any) => {
      let msg = 'Failed to save menu item';
      if (err.details && Array.isArray(err.details) && err.details.length > 0) {
        msg = `Validation error: ${err.details.map((d: any) => `${d.field}: ${d.message}`).join(', ')}`;
      } else if (err.message) {
        msg = err.message;
      }
      toast.error(msg);
    },
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => apiRequest(`/admin/menu/items/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      broadcastSync('menu');
      toast.success('Menu item soft-deleted (historical orders preserved)');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete item'),
  });

  const toggleAvailability = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      apiRequest(`/admin/menu/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isAvailable }),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      broadcastSync('menu');
      toast.success(variables.isAvailable ? 'Item enabled and visible to customers' : 'Item disabled (moved to Disabled Items)');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update availability'),
  });

  // ── Variant Mutations ─────────────────────────────────────────────────────

  const createVariantMutation = useMutation({
    mutationFn: (data: { name: string; price: number; sortOrder: number; isAvailable: boolean }) =>
      apiRequest(`/admin/menu-items/${variantModalItem!.id}/variants`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      refetchVariants();
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      broadcastSync('menu');
      toast.success('Option added successfully');
      closeVariantForm();
    },
    onError: (err: any) => {
      const msg = err.message || 'Failed to create option';
      setVariantFormError(msg);
      toast.error(msg);
    },
  });

  const updateVariantMutation = useMutation({
    mutationFn: ({ variantId, data }: { variantId: string; data: Partial<{ name: string; price: number; sortOrder: number; isAvailable: boolean }> }) =>
      apiRequest(`/admin/variants/${variantId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      refetchVariants();
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      broadcastSync('menu');
      toast.success('Option updated');
      closeVariantForm();
    },
    onError: (err: any) => {
      const msg = err.message || 'Failed to update option';
      setVariantFormError(msg);
      toast.error(msg);
    },
  });

  const deleteVariantMutation = useMutation({
    mutationFn: (variantId: string) =>
      apiRequest(`/admin/variants/${variantId}`, { method: 'DELETE' }),
    onSuccess: () => {
      refetchVariants();
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      broadcastSync('menu');
      toast.success('Option removed');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete option'),
  });

  const toggleVariantAvailabilityMutation = useMutation({
    mutationFn: ({ variantId, isAvailable }: { variantId: string; isAvailable: boolean }) =>
      apiRequest(`/admin/variants/${variantId}`, {
        method: 'PUT',
        body: JSON.stringify({ isAvailable }),
      }),
    onSuccess: (_data, variables) => {
      refetchVariants();
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      broadcastSync('menu');
      toast.success(variables.isAvailable ? 'Option enabled' : 'Option disabled');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update option'),
  });

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be smaller than 5MB.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    try {
      const res = await apiRequest<{ url: string }>('/admin/upload', {
        method: 'POST',
        body: formData,
      });
      setImagePreview(res.url);
      setValue('imageUrl', res.url, { shouldDirty: true });
      toast.success('Image uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setImagePreview('');
    reset({
      name: '',
      description: '',
      price: 700,
      categoryId: categories[0]?.id || '',
      imageUrl: '',
      ingredients: '',
      tags: '',
      isAvailable: true,
      isFeatured: false,
      isPopular: false,
      isChefSpecial: false,
    });
    setShowModal(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setImagePreview(item.imageUrl || '');
    reset({
      name: item.name,
      description: item.description,
      price: Number(item.price),
      categoryId: item.categoryId,
      imageUrl: item.imageUrl || '',
      ingredients: (item.ingredients || []).join(', '),
      tags: (item.tags || []).join(', '),
      isAvailable: item.isAvailable,
      isFeatured: item.isFeatured,
      isPopular: item.isPopular,
      isChefSpecial: item.isChefSpecial || false,
    });
    setShowModal(true);
  };

  // ── Variant handlers ─────────────────────────────────────────────────────

  const openVariantModal = (item: MenuItem) => {
    setVariantModalItem(item);
  };

  const closeVariantModal = () => {
    setVariantModalItem(null);
    closeVariantForm();
  };

  const openAddVariant = () => {
    setEditingVariant(null);
    setVariantName('');
    setVariantPrice('');
    const list = Array.isArray(variantModalVariants) ? variantModalVariants : [];
    const nextOrder =
      list.length > 0
        ? Math.max(...list.map((v) => v.sortOrder ?? 0)) + 1
        : 0;
    setVariantSortOrder(String(nextOrder));
    setVariantIsAvailable(true);
    setVariantFormError('');
    setVariantFormOpen(true);
  };

  const openEditVariant = (v: ProductVariant) => {
    setEditingVariant(v);
    setVariantName(v.name);
    setVariantPrice(String(Number(v.price)));
    setVariantSortOrder(String(v.sortOrder ?? 0));
    setVariantIsAvailable(v.isAvailable !== false);
    setVariantFormError('');
    setVariantFormOpen(true);
  };

  const closeVariantForm = () => {
    setVariantFormOpen(false);
    setEditingVariant(null);
    setVariantName('');
    setVariantPrice('');
    setVariantSortOrder('0');
    setVariantIsAvailable(true);
    setVariantFormError('');
  };

  const handleVariantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setVariantFormError('');
    const name = variantName.trim();
    if (!name) { setVariantFormError('Option name is required.'); return; }
    if (name.length > 60) { setVariantFormError('Option name must be 60 characters or fewer.'); return; }
    const priceNum = parseFloat(variantPrice);
    if (isNaN(priceNum) || priceNum < 0) { setVariantFormError('Please enter a valid price (0 or greater).'); return; }
    const sortNum = parseInt(variantSortOrder, 10);
    const payload = { name, price: priceNum, sortOrder: isNaN(sortNum) ? 0 : sortNum, isAvailable: variantIsAvailable };
    if (editingVariant) {
      updateVariantMutation.mutate({ variantId: editingVariant.id, data: payload });
    } else {
      createVariantMutation.mutate(payload);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setImagePreview('');
    reset();
  };

  const onSubmit = (form: MenuItemForm) => {
    const payload: any = {
      ...form,
      price: Number(form.price),
      categoryId: form.categoryId || categories[0]?.id,
      imageUrl: imagePreview ? imagePreview : form.imageUrl ? form.imageUrl.trim() : null,
      ingredients: form.ingredients ? form.ingredients.split(',').map((s) => s.trim()).filter(Boolean) : [],
      tags: form.tags ? form.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
    };
    upsertItem.mutate(payload);
  };

  const allItems = itemsData?.items || [];
  const filteredItems = allItems.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
  });

  const activeItems = filteredItems.filter((item) => item.isAvailable);
  const disabledItems = filteredItems.filter((item) => !item.isAvailable);
  const isSavingVariant = createVariantMutation.isPending || updateVariantMutation.isPending;

  // Confirmation dialogs (replace the browser's native confirm())
  const [pendingDeleteItem, setPendingDeleteItem] = useState<MenuItem | null>(null);
  const [pendingDeleteVariant, setPendingDeleteVariant] = useState<ProductVariant | null>(null);

  const priceLabel = (item: MenuItem) =>
    item.variants && item.variants.length > 1 ? `From ${formatCurrency(item.variants[0].price)}` : formatCurrency(item.price);

  const renderTable = (items: MenuItem[], emptyText: string) => (
    <TableShell>
      <THead>
        <tr>
          <Th>Dish</Th>
          <Th>Category</Th>
          <Th className="text-right">Price</Th>
          <Th>Options</Th>
          <Th>Tags</Th>
          <Th className="text-right">
            <span className="sr-only">Actions</span>
          </Th>
        </tr>
      </THead>
      <tbody>
        {items.length === 0 ? (
          <TableMessage colSpan={6}>{emptyText}</TableMessage>
        ) : (
          items.map((item) => (
            <Tr key={item.id}>
              <Td className="min-w-[240px]">
                <div className="flex items-center gap-3">
                  {item.imageUrl ? (
                    <img
                      src={resolveImageUrl(item.imageUrl)}
                      alt=""
                      width={48}
                      height={48}
                      loading="lazy"
                      decoding="async"
                      className="h-12 w-12 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-ink/[0.06] text-subtle">
                      <ImageIcon className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">No image</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-ink">{item.name}</p>
                    <p className="line-clamp-1 max-w-[320px] text-xs text-muted">{item.description}</p>
                  </div>
                </div>
              </Td>
              <Td className="whitespace-nowrap text-muted">{item.category?.name || categories.find((c) => c.id === item.categoryId)?.name || '—'}</Td>
              <Td className="tabular whitespace-nowrap text-right">{priceLabel(item)}</Td>
              <Td>
                <RowAction onClick={() => openVariantModal(item)} id={`manage-variants-${item.id}`}>
                  <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                  {item.variants && item.variants.length > 0 ? `${item.variants.length} options` : 'Add options'}
                </RowAction>
              </Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {item.isChefSpecial && <Badge variant="accent" size="sm">Chef’s pick</Badge>}
                  {item.isFeatured && <Badge variant="cyan" size="sm">Featured</Badge>}
                  {!item.isChefSpecial && !item.isFeatured && <span className="text-xs text-muted">—</span>}
                </div>
              </Td>
              <Td>
                <div className="flex justify-end gap-1.5">
                  <RowAction
                    onClick={() => toggleAvailability.mutate({ id: item.id, isAvailable: !item.isAvailable })}
                    tone={item.isAvailable ? 'default' : 'accent'}
                    id={`toggle-availability-${item.id}`}
                  >
                    {item.isAvailable ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                    {item.isAvailable ? 'Hide' : 'Show'}
                  </RowAction>
                  <RowAction onClick={() => openEdit(item)} id={`edit-item-${item.id}`} aria-label={`Edit ${item.name}`}>
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </RowAction>
                  <RowAction tone="danger" onClick={() => setPendingDeleteItem(item)} id={`delete-item-${item.id}`} aria-label={`Delete ${item.name}`}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </RowAction>
                </div>
              </Td>
            </Tr>
          ))
        )}
      </tbody>
    </TableShell>
  );

  const pill = (active: boolean) =>
    cn(
      'pressable inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm sm:min-h-9',
      active ? 'border-ink bg-ink text-night' : 'border-line-strong text-muted hover:text-ink'
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-ink">Menu</h1>
          <p className="tabular mt-1 text-sm text-muted">
            {activeItems.length} on the menu · {disabledItems.length} hidden · {categories.length} categories
          </p>
        </div>
        <Button size="sm" onClick={openCreate} id="create-item-btn" leftIcon={<Plus className="h-4 w-4" />}>
          Add dish
        </Button>
      </div>

      <div className="space-y-3">
        <Input
          type="search"
          aria-label="Search dishes"
          placeholder="Search dishes"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search />}
          id="search-items-input"
          wrapperClassName="sm:max-w-sm"
        />
        <div className="scroll-row" role="group" aria-label="Filter by category">
          <button type="button" aria-pressed={categoryFilter === ''} onClick={() => setCategoryFilter('')} className={pill(categoryFilter === '')}>
            All
          </button>
          {categories.map((c) => (
            <button key={c.id} type="button" aria-pressed={categoryFilter === c.id} onClick={() => setCategoryFilter(c.id)} className={pill(categoryFilter === c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded" />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          <section aria-labelledby="active-dishes" className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="active-dishes" className="font-sans text-base font-medium text-ink">
                On the menu <span className="tabular text-muted">({activeItems.length})</span>
              </h2>
              <p className="text-sm text-muted">Customers can see and order these.</p>
            </div>
            {renderTable(activeItems, search ? 'No dishes match your search.' : 'No dishes on the menu yet.')}
          </section>

          {disabledItems.length > 0 && (
            <section aria-labelledby="hidden-dishes" className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="hidden-dishes" className="font-sans text-base font-medium text-ink">
                  Hidden <span className="tabular text-muted">({disabledItems.length})</span>
                </h2>
                <p className="text-sm text-muted">Not shown on the menu and can’t be ordered.</p>
              </div>
              {renderTable(disabledItems, '')}
            </section>
          )}
        </div>
      )}

      {/* Create / Edit dish */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingItem ? `Edit ${editingItem.name}` : 'Add dish'} maxWidth="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input label="Name" id="item-name" {...register('name', { required: 'Name is required' })} error={errors.name?.message} />

          <Textarea
            label="Description"
            id="item-description"
            rows={2}
            {...register('description', { required: 'Description is required' })}
            error={errors.description?.message}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Base price (Rs)"
              id="item-price"
              type="number"
              step="1"
              helperText="Used when the dish has no options."
              {...register('price', { required: true, min: 0 })}
              error={errors.price?.message}
            />
            <Select
              label="Category"
              id="item-category"
              value={watchedCategoryId || categories[0]?.id || ''}
              onChange={(e) => setValue('categoryId', e.target.value, { shouldDirty: true })}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>

          <fieldset className="space-y-3 rounded border border-line bg-deep p-4">
            <legend className="px-1 text-sm font-medium text-muted">Photo</legend>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded border border-line">
                  <img src={resolveImageUrl(imagePreview)} alt="Selected dish photo" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setValue('imageUrl', '', { shouldDirty: true });
                    }}
                    className="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-night/80 text-ink hover:bg-night"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded border border-dashed border-line-strong text-subtle">
                  <ImageIcon className="h-5 w-5" aria-hidden="true" />
                  <span className="sr-only">No photo</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="image-file-upload"
                  className={cn(
                    buttonClasses({ variant: 'secondary', size: 'sm' }),
                    'cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent',
                    uploadingImage && 'pointer-events-none opacity-50'
                  )}
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  {uploadingImage ? 'Uploading…' : imagePreview ? 'Replace photo' : 'Upload photo'}
                  <input id="image-file-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageFileChange} />
                </label>
                <p className="mt-1.5 text-xs text-muted">PNG, JPG or WebP, up to 5 MB.</p>
              </div>
            </div>
            <Input
              label="Or paste an image URL"
              id="item-image-url"
              placeholder="https://"
              value={imagePreview || ''}
              onChange={(e) => {
                setImagePreview(e.target.value);
                setValue('imageUrl', e.target.value, { shouldDirty: true });
              }}
            />
          </fieldset>

          {editingItem && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-line p-4">
              <p className="text-sm text-muted">
                {editingItem.variants && editingItem.variants.length > 0
                  ? `${editingItem.variants.length} option${editingItem.variants.length !== 1 ? 's' : ''} set up.`
                  : 'No options yet (e.g. Small, Large).'}
              </p>
              <RowAction
                onClick={() => {
                  closeModal();
                  openVariantModal(editingItem);
                }}
              >
                <Layers className="h-3.5 w-3.5" aria-hidden="true" /> Manage options
              </RowAction>
            </div>
          )}

          <Input label="Ingredients" id="item-ingredients" helperText="Separate with commas." {...register('ingredients')} />
          <Input label="Tags" id="item-tags" helperText="Separate with commas." {...register('tags')} />

          <fieldset className="grid gap-2 sm:grid-cols-3">
            <legend className="mb-2 text-sm font-medium text-muted">Visibility</legend>
            <Checkbox label="On the menu" id="item-available" {...register('isAvailable')} />
            <Checkbox label="Chef’s pick" id="item-chef-special" {...register('isChefSpecial')} />
            <Checkbox label="Featured" id="item-featured" {...register('isFeatured')} />
          </fieldset>

          <div className="flex justify-end gap-2 border-t border-line pt-5">
            <Button type="button" variant="ghost" onClick={closeModal} id="cancel-item-btn">
              Cancel
            </Button>
            <Button type="submit" isLoading={upsertItem.isPending} id="save-item-btn">
              {editingItem ? 'Save changes' : 'Add dish'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Options (variants) */}
      <Modal
        isOpen={!!variantModalItem && !variantFormOpen}
        onClose={closeVariantModal}
        title={variantModalItem ? `Options · ${variantModalItem.name}` : ''}
        description={variantModalItem ? `Base price ${formatCurrency(variantModalItem.price)}. Options replace it when set.` : undefined}
        maxWidth="lg"
      >
        {variantModalItem && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={openAddVariant} id="add-variant-btn" leftIcon={<Plus className="h-4 w-4" />}>
                Add option
              </Button>
            </div>

            {variantsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded" />
                ))}
              </div>
            ) : !Array.isArray(variantModalVariants) || variantModalVariants.length === 0 ? (
              <EmptyState compact title="No options yet" description="Add sizes like Small and Large, each with its own price." />
            ) : (
              <TableShell>
                <THead>
                  <tr>
                    <Th>Option</Th>
                    <Th className="text-right">Price</Th>
                    <Th>Available</Th>
                    <Th className="text-right">
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </THead>
                <tbody>
                  {variantModalVariants.map((v) => (
                    <Tr key={v.id}>
                      <Td className={cn(v.isAvailable === false && 'text-muted line-through')}>{v.name}</Td>
                      <Td className="tabular text-right">{formatCurrency(v.price)}</Td>
                      <Td>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={v.isAvailable !== false}
                          aria-label={`${v.name} available`}
                          onClick={() =>
                            toggleVariantAvailabilityMutation.mutate({
                              variantId: v.id,
                              isAvailable: v.isAvailable === false,
                            })
                          }
                          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-ink sm:min-h-0"
                        >
                          <Switch on={v.isAvailable !== false} />
                          {v.isAvailable !== false ? 'Yes' : 'No'}
                        </button>
                      </Td>
                      <Td>
                        <div className="flex justify-end gap-1.5">
                          <RowAction onClick={() => openEditVariant(v)} aria-label={`Edit ${v.name}`}>
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          </RowAction>
                          <RowAction tone="danger" onClick={() => setPendingDeleteVariant(v)} aria-label={`Delete ${v.name}`}>
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </RowAction>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </TableShell>
            )}

            <p className="text-sm text-muted">Customers choose one available option. Hidden options stay in past orders.</p>

            <div className="flex justify-end border-t border-line pt-4">
              <Button variant="secondary" onClick={closeVariantModal}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / edit option */}
      <Modal isOpen={variantFormOpen} onClose={closeVariantForm} title={editingVariant ? 'Edit option' : 'Add option'} description={variantModalItem?.name} maxWidth="sm">
        <form onSubmit={handleVariantSubmit} className="space-y-5">
          {variantFormError && (
            <Notice tone="danger" icon={<AlertTriangle />}>
              {variantFormError}
            </Notice>
          )}

          <Input
            label="Name"
            id="variant-name"
            value={variantName}
            onChange={(e) => setVariantName(e.target.value)}
            placeholder="e.g. Small, Large, 500ml"
            maxLength={60}
            helperText="Up to 60 characters."
            required
            data-autofocus
          />

          <Input
            label="Price (Rs)"
            id="variant-price"
            type="number"
            min="0"
            step="1"
            value={variantPrice}
            onChange={(e) => setVariantPrice(e.target.value)}
            placeholder="0"
            required
          />

          <Input
            label="Sort order"
            id="variant-sort"
            type="number"
            min="0"
            step="1"
            value={variantSortOrder}
            onChange={(e) => setVariantSortOrder(e.target.value)}
            helperText="Lower numbers appear first."
          />

          <div className="flex items-center justify-between gap-4 rounded border border-line p-4">
            <div>
              <p className="text-sm text-ink" id="variant-available-label">
                Available to customers
              </p>
              <p className="mt-0.5 text-sm text-muted">Turn off to hide without deleting.</p>
            </div>
            <button
              type="button"
              onClick={() => setVariantIsAvailable((v) => !v)}
              id="variant-available-toggle"
              role="switch"
              aria-checked={variantIsAvailable}
              aria-labelledby="variant-available-label"
              className="inline-flex min-h-11 items-center"
            >
              <Switch on={variantIsAvailable} />
            </button>
          </div>

          <div className="flex justify-end gap-2 border-t border-line pt-5">
            <Button type="button" variant="ghost" onClick={closeVariantForm}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSavingVariant} id="save-variant-btn">
              {editingVariant ? 'Save option' : 'Add option'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmations */}
      <Modal isOpen={!!pendingDeleteItem} onClose={() => setPendingDeleteItem(null)} title={`Delete “${pendingDeleteItem?.name ?? ''}”?`} maxWidth="sm">
        <p className="text-sm text-muted">It’s removed from the menu. Past orders that include it stay intact.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setPendingDeleteItem(null)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (pendingDeleteItem) deleteItem.mutate(pendingDeleteItem.id);
              setPendingDeleteItem(null);
            }}
          >
            Delete dish
          </Button>
        </div>
      </Modal>

      <Modal isOpen={!!pendingDeleteVariant} onClose={() => setPendingDeleteVariant(null)} title={`Remove “${pendingDeleteVariant?.name ?? ''}”?`} maxWidth="sm">
        <p className="text-sm text-muted">Past orders with this option stay readable.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setPendingDeleteVariant(null)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (pendingDeleteVariant) deleteVariantMutation.mutate(pendingDeleteVariant.id);
              setPendingDeleteVariant(null);
            }}
          >
            Remove option
          </Button>
        </div>
      </Modal>
    </div>
  );
}
