import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { MenuItem, MenuCategory, ProductVariant } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { broadcastSync } from '../../utils/sync';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Star,
  Sparkles,
  Upload,
  X,
  ImageIcon,
  AlertTriangle,
  Layers,
  Tag,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

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
    queryFn: () =>
      apiRequest<ProductVariant[]>(`/admin/menu-items/${variantModalItem!.id}/variants`),
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
    const nextOrder =
      variantModalVariants.length > 0
        ? Math.max(...variantModalVariants.map((v) => v.sortOrder ?? 0)) + 1
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

  const renderItemCard = (item: MenuItem) => (
    <div
      key={item.id}
      className={`bg-white rounded-2xl border ${
        item.isAvailable ? 'border-stone-200' : 'border-amber-200 bg-amber-50/20'
      } overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between`}
    >
      <div className="relative">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-36 object-cover" />
        ) : (
          <div className="w-full h-36 bg-stone-100 flex items-center justify-center text-stone-400 text-sm font-medium">
            <ImageIcon className="w-6 h-6 mr-1.5 opacity-60" /> No Image Set
          </div>
        )}
        {!item.isAvailable && (
          <div className="absolute top-2 right-2">
            <span className="bg-amber-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm">
              Disabled
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-charcoal text-sm leading-tight">{item.name}</h3>
            <span className="font-bold text-terracotta text-sm flex-shrink-0">
              {item.variants && item.variants.length > 1
                ? `From ${formatCurrency(item.variants[0].price)}`
                : formatCurrency(item.price)}
            </span>
          </div>
          <p className="text-xs text-stone-500 mb-2 line-clamp-2">{item.description}</p>

          {item.variants && item.variants.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {item.variants.slice(0, 3).map((v) => (
                <span
                  key={v.id || v.name}
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                    v.isAvailable !== false
                      ? 'bg-stone-100 text-stone-600 border-stone-200'
                      : 'bg-amber-50 text-amber-600 border-amber-200 line-through opacity-60'
                  }`}
                >
                  {v.name}: {formatCurrency(v.price)}
                </span>
              ))}
              {item.variants.length > 3 && (
                <span className="text-[10px] bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded border border-stone-200">
                  +{item.variants.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {item.isAvailable ? (
              <Badge variant="success" size="sm">
                Active in Menu
              </Badge>
            ) : (
              <Badge variant="warning" size="sm">
                Hidden from Public
              </Badge>
            )}
            {item.isChefSpecial && (
              <Badge variant="terracotta" size="sm">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" /> Chef Special
              </Badge>
            )}
            {item.isFeatured && (
              <Badge variant="warning" size="sm">
                <Star className="w-2.5 h-2.5 mr-0.5" /> Featured
              </Badge>
            )}
          </div>
        </div>

        {/* Manage Options button */}
        <button
          onClick={() => openVariantModal(item)}
          className="w-full text-xs py-1.5 rounded-lg border border-terracotta/40 text-terracotta bg-terracotta/5 hover:bg-terracotta/10 font-medium transition-colors flex items-center justify-center gap-1.5 mb-2"
          id={`manage-variants-${item.id}`}
        >
          <Layers className="w-3 h-3" />
          Manage Options
          {item.variants && item.variants.length > 0 && (
            <span className="bg-terracotta text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {item.variants.length}
            </span>
          )}
        </button>

        <div className="flex gap-2 pt-1 border-t border-stone-100">
          <button
            onClick={() => toggleAvailability.mutate({ id: item.id, isAvailable: !item.isAvailable })}
            className={`flex-1 text-xs py-1.5 rounded-lg border font-medium transition-colors flex items-center justify-center gap-1.5 ${
              item.isAvailable
                ? 'border-stone-200 text-stone-600 hover:bg-stone-50'
                : 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
            }`}
            id={`toggle-availability-${item.id}`}
          >
            {item.isAvailable ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {item.isAvailable ? 'Disable' : 'Enable'}
          </button>
          <button
            onClick={() => openEdit(item)}
            className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
            title="Edit dish"
            id={`edit-item-${item.id}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Soft-delete "${item.name}"? Historical customer order records will be safely preserved.`))
                deleteItem.mutate(item.id);
            }}
            className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
            title="Delete dish"
            id={`delete-item-${item.id}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal">Menu Management</h1>
          <p className="text-stone-500 mt-1">
            {activeItems.length} active dishes • {disabledItems.length} disabled dishes • {categories.length} categories
          </p>
        </div>
        <Button variant="primary" onClick={openCreate} id="create-item-btn">
          <Plus className="w-4 h-4 mr-1.5" /> Add Menu Item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by dish name or ingredients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
            id="search-items-input"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              categoryFilter === ''
                ? 'bg-charcoal text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === c.id
                  ? 'bg-charcoal text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="space-y-10">
          {/* Section 1: Active Menu */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h2 className="text-xl font-serif font-bold text-charcoal flex items-center gap-2">
                Active Menu ({activeItems.length})
              </h2>
              <span className="text-xs text-stone-400">Visible and orderable by customers</span>
            </div>

            {activeItems.length === 0 ? (
              <div className="p-8 bg-white border border-stone-200 rounded-2xl text-center text-stone-500 text-xs">
                No active dishes found matching your filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeItems.map(renderItemCard)}
              </div>
            )}
          </div>

          {/* Section 2: Disabled Items */}
          {disabledItems.length > 0 && (
            <div className="space-y-4 pt-4 border-t-2 border-dashed border-stone-200">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h2 className="text-xl font-serif font-bold text-charcoal">
                    Disabled Items ({disabledItems.length})
                  </h2>
                </div>
                <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-medium">
                  Hidden from customer menu & cart
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {disabledItems.map(renderItemCard)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingItem ? `Edit ${editingItem.name}` : 'Create Menu Item'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Dish Name"
            id="item-name"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />

          <Textarea
            label="Appetizing Description"
            id="item-description"
            rows={2}
            {...register('description', { required: 'Description is required' })}
            error={errors.description?.message}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Base Price (PKR)"
              id="item-price"
              type="number"
              step="1"
              {...register('price', { required: true, min: 0 })}
              error={errors.price?.message}
            />

            <div>
              <label htmlFor="item-category" className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                id="item-category"
                value={watchedCategoryId || categories[0]?.id || ''}
                onChange={(e) => setValue('categoryId', e.target.value, { shouldDirty: true })}
                className="block w-full rounded-md border border-bistro-border bg-white text-sm px-3.5 py-2.5 text-charcoal focus:border-terracotta focus:ring-terracotta focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Image Upload & Management Area */}
          <div className="space-y-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
              Dish Photography
            </label>

            <div className="flex items-center gap-3">
              {imagePreview ? (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-stone-200 flex-shrink-0 bg-stone-100">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setValue('imageUrl', '', { shouldDirty: true });
                    }}
                    className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white p-0.5 rounded-full"
                    title="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 flex-shrink-0">
                  <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                  <span className="text-[10px]">No image</span>
                </div>
              )}

              <div className="flex-1 space-y-1.5">
                <label
                  htmlFor="image-file-upload"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 cursor-pointer shadow-sm transition-colors ${
                    uploadingImage ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-terracotta" />
                  {uploadingImage ? 'Uploading...' : imagePreview ? 'Replace Image' : 'Upload Image File'}
                </label>
                <input
                  id="image-file-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileChange}
                />
                <p className="text-[11px] text-stone-400">
                  Upload high-quality PNG, JPG, or WebP (max 5MB).
                </p>
              </div>
            </div>

            {/* Optional URL input */}
            <div className="pt-1">
              <Input
                label="Or Direct Image URL"
                id="item-image-url"
                placeholder="https://... (or leave blank to use uploaded file)"
                value={imagePreview || ''}
                onChange={(e) => {
                  setImagePreview(e.target.value);
                  setValue('imageUrl', e.target.value, { shouldDirty: true });
                }}
              />
            </div>
          </div>

          {/* Variants notice inside item edit modal */}
          {editingItem && (
            <div className="p-3 bg-terracotta/5 border border-terracotta/20 rounded-xl flex items-start gap-3">
              <Layers className="w-4 h-4 text-terracotta flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-terracotta">Variants &amp; Pricing</p>
                <p className="text-xs text-charcoal-600 mt-0.5">
                  {editingItem.variants && editingItem.variants.length > 0
                    ? `${editingItem.variants.length} option${editingItem.variants.length !== 1 ? 's' : ''} configured.`
                    : 'No options yet. Add options like Small, Large, Regular with individual prices.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { closeModal(); openVariantModal(editingItem); }}
                className="text-xs font-semibold text-terracotta underline whitespace-nowrap hover:no-underline flex-shrink-0"
              >
                Manage Options →
              </button>
            </div>
          )}

          <Input
            label="Ingredients (comma-separated)"
            id="item-ingredients"
            placeholder="Pizza Dough, BBQ Chicken, Mozzarella, Red Onions"
            {...register('ingredients')}
          />

          <Input
            label="Tags (comma-separated)"
            id="item-tags"
            placeholder="pizza, spicy, signature"
            {...register('tags')}
          />

          <div className="flex flex-wrap gap-4 pt-1 bg-stone-50 p-3 rounded-xl border border-stone-200">
            <label className="flex items-center gap-2 text-xs font-semibold text-charcoal cursor-pointer">
              <input type="checkbox" {...register('isAvailable')} id="item-available" className="rounded accent-terracotta" />
              Available for Customer Orders
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-charcoal cursor-pointer">
              <input type="checkbox" {...register('isChefSpecial')} id="item-chef-special" className="rounded accent-terracotta" />
              Chef Special
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-charcoal cursor-pointer">
              <input type="checkbox" {...register('isFeatured')} id="item-featured" className="rounded accent-terracotta" />
              Featured
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal} id="cancel-item-btn">
              Cancel
            </Button>
            <Button type="submit" isLoading={upsertItem.isPending} id="save-item-btn">
              {editingItem ? 'Update Dish' : 'Create Dish'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Variants Management Modal ──────────────────────────────────────── */}
      <Modal
        isOpen={!!variantModalItem && !variantFormOpen}
        onClose={closeVariantModal}
        title={variantModalItem ? `Options & Pricing — ${variantModalItem.name}` : ''}
        maxWidth="lg"
      >
        {variantModalItem && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
              <div>
                <p className="text-xs font-semibold text-charcoal">Base Price</p>
                <p className="text-sm font-bold text-terracotta">{formatCurrency(variantModalItem.price)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-stone-500">Used when no options are configured</p>
                <p className="text-[11px] text-stone-400">Options override this price for customers</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-charcoal flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-terracotta" />
                  Variants &amp; Pricing
                </h3>
                <button
                  onClick={openAddVariant}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-terracotta text-white rounded-lg text-xs font-semibold hover:bg-terracotta/90 transition-colors shadow-sm"
                  id="add-variant-btn"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Option
                </button>
              </div>

              {variantsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
                </div>
              ) : variantModalVariants.length === 0 ? (
                <div className="p-8 bg-stone-50 border border-dashed border-stone-300 rounded-xl text-center">
                  <Layers className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-stone-500">No options configured yet</p>
                  <p className="text-xs text-stone-400 mt-1">
                    Add options like Small, Medium, Large — or Regular, Double, Party — each with its own price.
                  </p>
                  <button
                    onClick={openAddVariant}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-terracotta text-white rounded-lg text-xs font-semibold hover:bg-terracotta/90 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add First Option
                  </button>
                </div>
              ) : (
                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-stone-100 text-[10px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-4">Option Name</div>
                    <div className="col-span-3">Price</div>
                    <div className="col-span-2 text-center">Available</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>
                  <div className="divide-y divide-stone-100">
                    {variantModalVariants.map((v, idx) => (
                      <div
                        key={v.id}
                        className={`grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors hover:bg-stone-50 ${
                          v.isAvailable === false ? 'opacity-60 bg-amber-50/40' : ''
                        }`}
                      >
                        <div className="col-span-1 text-center text-xs text-stone-400 font-medium">{idx + 1}</div>
                        <div className="col-span-4">
                          <span className={`text-sm font-semibold text-charcoal ${v.isAvailable === false ? 'line-through text-stone-400' : ''}`}>
                            {v.name}
                          </span>
                        </div>
                        <div className="col-span-3">
                          <span className="text-sm font-bold text-terracotta">{formatCurrency(v.price)}</span>
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <button
                            onClick={() =>
                              toggleVariantAvailabilityMutation.mutate({
                                variantId: v.id,
                                isAvailable: v.isAvailable === false,
                              })
                            }
                            className={`p-1 rounded-md transition-colors ${
                              v.isAvailable !== false
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-stone-400 hover:bg-stone-100'
                            }`}
                            title={v.isAvailable !== false ? 'Click to disable' : 'Click to enable'}
                          >
                            {v.isAvailable !== false ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditVariant(v)}
                            className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-500 hover:text-charcoal transition-colors"
                            title="Edit option"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove option "${v.name}"?\n\nHistorical orders will remain readable.`)) {
                                deleteVariantMutation.mutate(v.id);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                            title="Delete option"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {variantModalVariants.length > 0 && (
              <p className="text-[11px] text-stone-400 leading-relaxed">
                <strong>Tip:</strong> Customers see all enabled options and must choose one.
                Disabling hides from customers without deleting.
                Deleted options are removed permanently but historical orders remain intact.
              </p>
            )}

            <div className="flex justify-end pt-2 border-t border-stone-100">
              <Button variant="secondary" onClick={closeVariantModal}>Done</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Add / Edit Option Sub-Modal ────────────────────────────────────── */}
      <Modal
        isOpen={variantFormOpen}
        onClose={closeVariantForm}
        title={editingVariant ? 'Edit Option' : 'Add New Option'}
        maxWidth="sm"
      >
        <form onSubmit={handleVariantSubmit} className="space-y-4">
          {variantModalItem && (
            <p className="text-xs text-stone-500 -mt-1">
              Configuring option for <strong className="text-charcoal">{variantModalItem.name}</strong>
            </p>
          )}

          {variantFormError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700">{variantFormError}</p>
            </div>
          )}

          <div>
            <label htmlFor="variant-name" className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
              Option Name <span className="text-red-500">*</span>
            </label>
            <input
              id="variant-name"
              type="text"
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
              placeholder="e.g. Small, Regular, Double, 500ml, Party"
              maxLength={60}
              className="block w-full rounded-md border border-bistro-border bg-white text-sm px-3.5 py-2.5 text-charcoal focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:outline-none"
              autoFocus
            />
            <p className="mt-1 text-[11px] text-stone-400">Any name. Max 60 characters.</p>
          </div>

          <div>
            <label htmlFor="variant-price" className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
              Price (PKR) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-medium">PKR</span>
              <input
                id="variant-price"
                type="number"
                min="0"
                step="1"
                value={variantPrice}
                onChange={(e) => setVariantPrice(e.target.value)}
                placeholder="0"
                className="block w-full rounded-md border border-bistro-border bg-white text-sm pl-12 pr-3.5 py-2.5 text-charcoal focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="variant-sort" className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
              Sort Order
            </label>
            <input
              id="variant-sort"
              type="number"
              min="0"
              step="1"
              value={variantSortOrder}
              onChange={(e) => setVariantSortOrder(e.target.value)}
              className="block w-full rounded-md border border-bistro-border bg-white text-sm px-3.5 py-2.5 text-charcoal focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-stone-400">Lower numbers appear first (0, 1, 2…)</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
            <div>
              <p className="text-xs font-semibold text-charcoal">Available to Customers</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Disable to hide without deleting</p>
            </div>
            <button
              type="button"
              onClick={() => setVariantIsAvailable((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-1 ${
                variantIsAvailable ? 'bg-terracotta' : 'bg-stone-300'
              }`}
              id="variant-available-toggle"
              aria-checked={variantIsAvailable}
              role="switch"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  variantIsAvailable ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <Button type="button" variant="secondary" onClick={closeVariantForm}>Cancel</Button>
            <Button type="submit" isLoading={isSavingVariant} id="save-variant-btn">
              {isSavingVariant ? 'Saving...' : editingVariant ? 'Update Option' : 'Add Option'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
