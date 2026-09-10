import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../api/client';
import { MenuCategory } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface CategoryForm {
  name: string;
  sortOrder: number;
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<MenuCategory | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data: categories = [], isLoading } = useQuery<MenuCategory[]>({
    queryKey: ['menu-categories-admin'],
    queryFn: async () => {
      const res = await apiRequest<{ categories: MenuCategory[] }>('/menu-categories');
      return res.categories || [];
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryForm>();

  const upsert = useMutation({
    mutationFn: (data: CategoryForm) => {
      if (editing) {
        return apiRequest(`/admin/menu/categories/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      }
      return apiRequest('/admin/menu/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories-admin'] });
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      toast.success(editing ? 'Category updated' : 'Category created');
      closeModal();
    },
    onError: () => toast.error('Failed to save category'),
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => apiRequest(`/admin/menu/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories-admin'] });
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      toast.success('Category deleted');
    },
    onError: () => toast.error('Cannot delete category — it may still have menu items.'),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', sortOrder: (categories.length + 1) * 10 });
    setShowModal(true);
  };

  const openEdit = (cat: MenuCategory) => {
    setEditing(cat);
    reset({ name: cat.name, sortOrder: cat.sortOrder });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    reset();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal">Categories</h1>
          <p className="text-stone-500 mt-1">Manage menu categories</p>
        </div>
        <Button onClick={openCreate} id="add-category-btn">
          <Plus className="w-4 h-4 mr-1.5" /> Add Category
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {[...categories].sort((a, b) => a.sortOrder - b.sortOrder).map((cat) => (
              <div key={cat.id} className="flex items-center justify-between px-5 py-4 hover:bg-stone-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-stone-300" />
                  <div>
                    <p className="font-semibold text-charcoal">{cat.name}</p>
                    <p className="text-xs text-stone-400">Sort order: {cat.sortOrder} · {cat._count?.items ?? 0} items</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-500 hover:text-charcoal transition-colors"
                    id={`edit-category-${cat.id}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${cat.name}"? This will fail if it has items.`)) {
                        deleteCategory.mutate(cat.id);
                      }
                    }}
                    className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                    id={`delete-category-${cat.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="text-center py-10 text-stone-400">No categories yet.</div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={closeModal} title={editing ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSubmit((d) => upsert.mutate(d))} className="space-y-4" id="category-form">
          <Input
            label="Category Name"
            id="category-name"
            placeholder="e.g. Starters, Main Course"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />
          <Input
            label="Sort Order"
            id="category-sort-order"
            type="number"
            {...register('sortOrder', { required: true, valueAsNumber: true })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal} id="cancel-category-btn">Cancel</Button>
            <Button type="submit" isLoading={upsert.isPending} id="save-category-btn">
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
