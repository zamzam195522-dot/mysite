'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';

type CategoryRow = {
  id: number;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
};

export default function ProductCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const res = await apiFetch<{ success: true; categories: CategoryRow[] }>('/api/product-categories');
      setCategories(res.categories);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setName('');
    setStatus('ACTIVE');
  };

  const saveCategory = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a category name.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await apiFetch<{ success: true; category: CategoryRow }>('/api/product-categories', {
        method: 'POST',
        body: JSON.stringify({ name: trimmed, status }),
      });
      setCategories((prev) => [res.category, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const beginEdit = (c: CategoryRow) => {
    setEditing(c);
    setEditName(c.name);
    setEditStatus(c.status);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditName('');
    setEditStatus('ACTIVE');
  };

  const saveEdit = async () => {
    if (!editing) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      setError('Please enter a category name.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const res = await apiFetch<{ success: true; category: CategoryRow }>(
        `/api/product-categories/${editing.id}`,
        { method: 'PATCH', body: JSON.stringify({ name: trimmed, status: editStatus }) },
      );
      setCategories((prev) => prev.map((x) => (x.id === editing.id ? res.category : x)).sort((a, b) => a.name.localeCompare(b.name)));
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update category');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategory = async (c: CategoryRow) => {
    const ok = window.confirm(`Delete category "${c.name}"?`);
    if (!ok) return;

    try {
      setError(null);
      await apiFetch<{ success: true }>(`/api/product-categories/${c.id}`, { method: 'DELETE' });
      setCategories((prev) => prev.filter((x) => x.id !== c.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete category');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader
            title="Product Categories"
            subtitle="Organize products by category (19L, Disposable, Accessories)."
          />

          {error ? (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Add Category">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                  <input
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. Accessories"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={status}
                    onChange={(e) => setStatus(e.target.value === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  className="flex-1 bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800 disabled:opacity-60"
                  type="button"
                  onClick={() => void saveCategory()}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Category'}
                </button>
                <button
                  className="flex-1 bg-red-600 text-white py-2 rounded text-sm font-semibold hover:bg-red-500"
                  type="button"
                  onClick={resetForm}
                >
                  Reset
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Category List">
              <div className="flex items-center justify-end mb-3">
                <button
                  className="bg-gray-700 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-gray-600"
                  type="button"
                  onClick={() => void load()}
                >
                  Refresh
                </button>
              </div>

              <div className="border border-gray-200 rounded overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-sky-900 text-white">
                    <tr>
                      <th className="px-3 py-2 text-left w-12">SNO</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-left w-24">Status</th>
                      <th className="px-3 py-2 text-left w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-gray-500" colSpan={4}>
                          Loading...
                        </td>
                      </tr>
                    ) : categories.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-gray-500" colSpan={4}>
                          No categories yet.
                        </td>
                      </tr>
                    ) : (
                      categories.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">{idx + 1}</td>
                          <td className="px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2">{row.status}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                className="bg-sky-900 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-sky-800"
                                type="button"
                                onClick={() => beginEdit(row)}
                              >
                                Edit
                              </button>
                              <button
                                className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-red-500"
                                type="button"
                                onClick={() => void deleteCategory(row)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        </div>
      </section>

      {/* Edit modal */}
      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-2xl overflow-hidden">
            <div className="bg-sky-900 text-white px-6 py-3 flex items-center justify-between">
              <div className="font-semibold">Edit Category</div>
              <button
                onClick={cancelEdit}
                className="w-8 h-8 flex items-center justify-center rounded bg-sky-800 hover:bg-sky-700"
                aria-label="Close"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  className="flex-1 bg-gray-600 text-white py-2 rounded text-sm font-semibold hover:bg-gray-500"
                  type="button"
                  onClick={cancelEdit}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800 disabled:opacity-60"
                  type="button"
                  onClick={() => void saveEdit()}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Footer />
    </main>
  );
}

