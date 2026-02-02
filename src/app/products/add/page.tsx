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

export default function AddProductPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [type, setType] = useState('19 LTR Bottle');
  const [price, setPrice] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCategories = async () => {
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
    void loadCategories();
  }, []);

  const reset = () => {
    setName('');
    setCategoryId('');
    setType('19 LTR Bottle');
    setPrice('0');
    setMessage(null);
    setError(null);
  };

  const save = async () => {
    const trimmed = name.trim();
    const p = Number(price);
    if (!trimmed || !type.trim() || !Number.isFinite(p) || p < 0) {
      setError('Please enter valid product name, bottle type and price.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setMessage(null);

      const cid = categoryId.trim() === '' ? null : Number(categoryId.trim());
      await apiFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify({ name: trimmed, price: p, type: type.trim(), categoryId: cid }),
      });

      setMessage('Product saved successfully.');
      reset();
      await loadCategories();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Add New Product" subtitle="Create a new product with category and default price." />

          <SectionCard title="Product Information">
            {error ? (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            {message ? (
              <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="e.g. 19 LTR"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={isLoading}
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
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option>19 LTR Bottle</option>
                  <option>Returnable Bottle</option>
                  <option>Disposable Bottle</option>
                  <option>Accessories</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Price</label>
                <input
                  className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="0"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col md:flex-row md:space-x-3 space-y-3 md:space-y-0">
              <button
                className="flex-1 bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800 disabled:opacity-60"
                type="button"
                onClick={() => void save()}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Product'}
              </button>
              <button
                className="flex-1 bg-red-600 text-white py-2 rounded text-sm font-semibold hover:bg-red-500"
                type="button"
                onClick={reset}
              >
                Reset
              </button>
            </div>
          </SectionCard>
        </div>
      </section>
      <Footer />
    </main>
  );
}

