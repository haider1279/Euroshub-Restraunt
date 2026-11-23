import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiRequest } from '../../api/client';
import { MenuCategory } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { TableShell, THead, Th, Td, Tr, TableMessage, RowAction } from '../../components/ui/DataTable';

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

  const [pendingDelete, setPendingDelete] = useState<MenuCategory | null>(null);
  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-ink">Categories</h1>
          <p className="mt-1 text-sm text-muted">Shown on the menu in sort order, lowest first.</p>
        </div>
        <Button onClick={openCreate} id="add-category-btn" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          Add category
        </Button>
      </div>

      <TableShell>
        <THead>
          <tr>
            <Th className="w-20 text-right">Order</Th>
            <Th>Name</Th>
            <Th className="text-right">Dishes</Th>
            <Th className="text-right">
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </THead>
        <tbody>
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-line">
                {[...Array(4)].map((_, j) => (
                  <Td key={j}>
                    <Skeleton className="h-5 w-full" />
                  </Td>
                ))}
              </tr>
            ))
          ) : sorted.length === 0 ? (
            <TableMessage colSpan={4}>No categories yet. Add one to start building the menu.</TableMessage>
          ) : (
            sorted.map((cat) => (
              <Tr key={cat.id}>
                <Td className="tabular text-right text-muted">{cat.sortOrder}</Td>
                <Td className="text-ink">{cat.name}</Td>
                <Td className="tabular text-right text-muted">{cat._count?.items ?? 0}</Td>
                <Td>
                  <div className="flex justify-end gap-1.5">
                    <RowAction onClick={() => openEdit(cat)} id={`edit-category-${cat.id}`} aria-label={`Edit ${cat.name}`}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                    </RowAction>
                    <RowAction tone="danger" onClick={() => setPendingDelete(cat)} id={`delete-category-${cat.id}`} aria-label={`Delete ${cat.name}`}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                    </RowAction>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </TableShell>

      <Modal isOpen={showModal} onClose={closeModal} title={editing ? 'Edit category' : 'Add category'}>
        <form onSubmit={handleSubmit((d) => upsert.mutate(d))} className="space-y-5" id="category-form">
          <Input
            label="Name"
            id="category-name"
            placeholder="e.g. Burgers"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />
          <Input
            label="Sort order"
            id="category-sort-order"
            type="number"
            helperText="Lower numbers appear first."
            {...register('sortOrder', { required: true, valueAsNumber: true })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={closeModal} id="cancel-category-btn">
              Cancel
            </Button>
            <Button type="submit" isLoading={upsert.isPending} id="save-category-btn">
              {editing ? 'Save changes' : 'Add category'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!pendingDelete} onClose={() => setPendingDelete(null)} title={`Delete “${pendingDelete?.name ?? ''}”?`} maxWidth="sm">
        <p className="text-sm text-muted">This fails if the category still has dishes. Move or delete them first.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setPendingDelete(null)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (pendingDelete) deleteCategory.mutate(pendingDelete.id);
              setPendingDelete(null);
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
