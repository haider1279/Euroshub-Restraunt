import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { MenuItem, MenuCategory } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, Star, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface MenuItemForm {
  name: string;
  description: string;
  price: number;
  categoryId: string;
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

  const { data: categories = [] } = useQuery<MenuCategory[]>({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const res = await apiRequest<{ categories: MenuCategory[] }>('/menu-categories');
      return res.categories || [];
    },
  });

  const { data: itemsData, isLoading } = useQuery<{ items: MenuItem[] }>({
    queryKey: ['admin-menu-items', categoryFilter],
    queryFn: () => {
      const params = new URLSearchParams({ pageSize: '100' });
      if (categoryFilter) params.set('categoryId', categoryFilter);
      return apiRequest<{ items: MenuItem[] }>(`/menu-items?${params}`);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<MenuItemForm>();

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
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast.success(editingItem ? 'Menu item updated' : 'Menu item created');
      closeModal();
    },
    onError: () => toast.error('Failed to save menu item'),
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => apiRequest(`/admin/menu/items/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast.success('Menu item removed');
    },
    onError: () => toast.error('Failed to delete item'),
  });

  const toggleAvailability = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      apiRequest(`/admin/menu/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isAvailable }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
    onError: () => toast.error('Failed to update availability'),
  });

  const openCreate = () => {
    setEditingItem(null);
    reset({
      isAvailable: true,
      isFeatured: false,
      isPopular: false,
      isChefSpecial: false,
      price: 700,
    });
    setShowModal(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    reset({
      name: item.name,
      description: item.description,
      price: Number(item.price),
      categoryId: item.categoryId,
      ingredients: (item.ingredients || []).join(', '),
      tags: (item.tags || []).join(', '),
      isAvailable: item.isAvailable,
      isFeatured: item.isFeatured,
      isPopular: item.isPopular,
      isChefSpecial: item.isChefSpecial || false,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    reset();
  };

  const onSubmit = (form: MenuItemForm) => {
    upsertItem.mutate({
      ...form,
      price: Number(form.price),
      ingredients: form.ingredients.split(',').map((s) => s.trim()).filter(Boolean),
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
    });
  };

  const filteredItems = (itemsData?.items || []).filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal">Menu Management</h1>
          <p className="text-stone-500 mt-1">
            {itemsData?.items?.length ?? 0} dishes across {categories.length} categories
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
            placeholder="Search items..."
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
            All
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

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)
          : filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 bg-stone-100 flex items-center justify-center text-stone-400 text-sm font-medium">
                    No Image Set
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-charcoal text-sm leading-tight">
                        {item.name}
                      </h3>
                      <span className="font-bold text-terracotta text-sm flex-shrink-0">
                        {item.variants && item.variants.length > 1
                          ? `From ${formatCurrency(item.variants[0].price)}`
                          : formatCurrency(item.price)}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mb-2 line-clamp-2">{item.description}</p>

                    {item.variants && item.variants.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.variants.map((v) => (
                          <span
                            key={v.id || v.name}
                            className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded border border-stone-200"
                          >
                            {v.name}: {formatCurrency(v.price)}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                      {item.isAvailable ? (
                        <Badge variant="success" size="sm">
                          Available
                        </Badge>
                      ) : (
                        <Badge variant="danger" size="sm">
                          Sold Out
                        </Badge>
                      )}
                      {item.isChefSpecial && (
                        <Badge variant="terracotta" size="sm">
                          <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                          Chef Special
                        </Badge>
                      )}
                      {item.isFeatured && (
                        <Badge variant="warning" size="sm">
                          <Star className="w-2.5 h-2.5 mr-0.5" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-stone-100">
                    <button
                      onClick={() =>
                        toggleAvailability.mutate({ id: item.id, isAvailable: !item.isAvailable })
                      }
                      className="flex-1 text-xs py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 font-medium text-stone-600 transition-colors flex items-center justify-center gap-1"
                      id={`toggle-availability-${item.id}`}
                    >
                      {item.isAvailable ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {item.isAvailable ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
                      id={`edit-item-${item.id}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Soft-delete "${item.name}"? Historical orders will be preserved.`))
                          deleteItem.mutate(item.id);
                      }}
                      className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                      id={`delete-item-${item.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingItem ? `Edit ${editingItem.name}` : 'Create Menu Item'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Name"
            id="item-name"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />
          <Textarea
            label="Description"
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
            <Select
              label="Category"
              id="item-category"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              value={editingItem?.categoryId || categories[0]?.id || ''}
              onChange={(val: any) =>
                setValue('categoryId', typeof val === 'string' ? val : val?.target?.value || '')
              }
            />
          </div>
          <Input
            label="Ingredients (comma-separated)"
            id="item-ingredients"
            placeholder="chicken, mozzarella, onions"
            {...register('ingredients')}
          />
          <Input
            label="Tags (comma-separated)"
            id="item-tags"
            placeholder="pizza, spicy, signature"
            {...register('tags')}
          />
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('isAvailable')} id="item-available" className="rounded" />
              Available
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('isChefSpecial')} id="item-chef-special" className="rounded" />
              Chef Special
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('isFeatured')} id="item-featured" className="rounded" />
              Featured
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal} id="cancel-item-btn">
              Cancel
            </Button>
            <Button type="submit" isLoading={upsertItem.isPending} id="save-item-btn">
              {editingItem ? 'Update Item' : 'Create Item'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
