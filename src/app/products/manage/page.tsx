'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';

type ProductRow = {
  id: number;
  name: string;
  price: number;
  type: string | null;
  categoryId: number | null;
  categoryName: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
};

type CategoryRow = {
  id: number;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
};

export default function ManageProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('');
  const [editPrice, setEditPrice] = useState('0');
  const [editCategoryId, setEditCategoryId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        apiFetch<{ success: true; products: ProductRow[] }>('/api/products'),
        apiFetch<{ success: true; categories: CategoryRow[] }>('/api/product-categories'),
      ]);
      setProducts(productsRes.products);
      setCategories(categoriesRes.categories);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const hay = `${p.name} ${p.categoryName ?? ''} ${p.type ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [products, search]);

  const beginEdit = (p: ProductRow) => {
    setEditing(p);
    setEditName(p.name ?? '');
    setEditType(p.type ?? '');
    setEditPrice(String(p.price ?? 0));
    setEditCategoryId(p.categoryId ? String(p.categoryId) : '');
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditName('');
    setEditType('');
    setEditPrice('0');
    setEditCategoryId('');
  };

  const saveEdit = async () => {
    if (!editing) return;
    const name = editName.trim();
    const type = editType.trim();
    const price = Number(editPrice);
    if (!name || !type || !Number.isFinite(price) || price < 0) {
      setError('Please enter valid name, type and price.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const categoryId =
        editCategoryId.trim() === '' ? null : Number(editCategoryId.trim());

      const res = await apiFetch<{ success: true; product: ProductRow }>(
        `/api/products/${editing.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ name, type, price, categoryId }),
        },
      );

      setProducts((prev) =>
        prev.map((p) => (p.id === editing.id ? res.product : p)),
      );
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProduct = async (p: ProductRow) => {
    const ok = window.confirm(`Delete "${p.name}"? (This will deactivate it)`);
    if (!ok) return;

    try {
      setError(null);
      await apiFetch<{ success: true }>(`/api/products/${p.id}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete product');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader
            title="Manage Products"
            subtitle="View product list, edit/delete, and set casual price."
          />

          <SectionCard title="Product List">
            <div className="flex flex-col md:flex-row md:items-end md:space-x-3 space-y-3 md:space-y-0 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Search by name, category, or type"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                className="bg-red-600 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-red-500"
                onClick={() => void load()}
                type="button"
              >
                Refresh
              </button>
              <a
                href="/products/add"
                className="bg-sky-900 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-sky-800 text-center"
              >
                Add New
              </a>
            </div>

            {error ? (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="border border-gray-200 rounded overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-sky-900 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left w-12">SNO</th>
                    <th className="px-3 py-2 text-left">Product Name</th>
                    <th className="px-3 py-2 text-left w-40">Category</th>
                    <th className="px-3 py-2 text-left w-36">Bottle Type</th>
                    <th className="px-3 py-2 text-left w-24">Price</th>
                    <th className="px-3 py-2 text-left w-48">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                        Loading...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                        No products yet.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2">{row.name}</td>
                        <td className="px-3 py-2">{row.categoryName ?? '-'}</td>
                        <td className="px-3 py-2">{row.type ?? '-'}</td>
                        <td className="px-3 py-2">{row.price}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-2">
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
                              onClick={() => void deleteProduct(row)}
                            >
                              Delete
                            </button>
                            <a
                              href="/customers/set-product-price"
                              className="bg-gray-700 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-gray-600"
                            >
                              Set Casual Price
                            </a>
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
      </section>

      {/* Edit modal */}
      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-2xl overflow-hidden">
            <div className="bg-sky-900 text-white px-6 py-3 flex items-center justify-between">
              <div className="font-semibold">Edit Product</div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name} ({c.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bottle Type</label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  placeholder="e.g. 19 LTR Bottle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                />
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

