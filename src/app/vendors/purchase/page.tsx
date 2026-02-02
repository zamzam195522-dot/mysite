'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';
import { useEffect, useMemo, useState } from 'react';

export default function PurchaseStockPage() {
  const [vendors, setVendors] = useState<Array<{ id: number; name: string; status: 'ACTIVE' | 'INACTIVE' }>>([]);
  const [products, setProducts] = useState<Array<{ id: number; name: string; price: number; type: string | null }>>([]);

  const [vendorId, setVendorId] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [productId, setProductId] = useState<string>('');
  const [qty, setQty] = useState<string>('0');
  const [rate, setRate] = useState<string>('0');
  const [remarks, setRemarks] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const [vendorsRes, productsRes] = await Promise.all([
        apiFetch<{ success: true; vendors: Array<{ id: number; name: string; status: 'ACTIVE' | 'INACTIVE' }> }>(
          '/api/vendors',
        ),
        apiFetch<{ success: true; products: Array<{ id: number; name: string; price: number; type: string | null }> }>(
          '/api/products',
        ),
      ]);
      setVendors(vendorsRes.vendors);
      setProducts(productsRes.products);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load vendors/products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const vendorOptions = useMemo(() => vendors.filter((v) => v.status !== 'INACTIVE'), [vendors]);

  const reset = () => {
    setVendorId('');
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setProductId('');
    setQty('0');
    setRate('0');
    setRemarks('');
    setError(null);
    setMessage(null);
  };

  const save = async () => {
    const vid = Number(vendorId);
    const pid = Number(productId);
    const q = Number(qty);
    const r = Number(rate);

    if (!Number.isInteger(vid) || vid <= 0) {
      setError('Please select vendor.');
      return;
    }
    if (!Number.isInteger(pid) || pid <= 0) {
      setError('Please select product.');
      return;
    }
    if (!Number.isFinite(q) || q <= 0) {
      setError('Please enter valid quantity.');
      return;
    }
    if (!Number.isFinite(r) || r < 0) {
      setError('Please enter valid rate.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setMessage(null);
      await apiFetch('/api/vendor-purchases', {
        method: 'POST',
        body: JSON.stringify({
          vendorId: vid,
          purchaseDate,
          productId: pid,
          qty: q,
          rate: r,
          remarks: remarks.trim() || null,
        }),
      });
      setMessage('Purchase saved successfully.');
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save purchase');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Purchase Stock" subtitle="Select vendor, add product quantity and rate, then save purchase." />

          {error ? (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          ) : null}

          <SectionCard title="Purchase Entry">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">Select Vendor</option>
                  {vendorOptions.map((v) => (
                    <option key={v.id} value={String(v.id)}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                <input
                  className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800 disabled:opacity-60"
                type="button"
                onClick={() => void save()}
                disabled={isSubmitting}
              >
                Save Purchase
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

