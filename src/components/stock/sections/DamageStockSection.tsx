'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type ProductOption = { id: number; name: string };
type DamageRow = { id: number; date: string; productName: string; qty: number; remarks: string | null };

export default function DamageStockSection() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [damageRows, setDamageRows] = useState<DamageRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [productId, setProductId] = useState<string>('');
  const [qty, setQty] = useState<string>('0');
  const [remarks, setRemarks] = useState<string>('');

  const load = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const [productsRes, movementsRes] = await Promise.all([
        apiFetch<{ success: true; products: ProductOption[] }>('/api/products'),
        apiFetch<{ success: true; movements: any[] }>('/api/stock/movements?movementType=DAMAGE&limit=200'),
      ]);
      setProducts(productsRes.products);
      setDamageRows(
        movementsRes.movements.map((m) => ({
          id: m.id,
          date: m.date,
          productName: m.productName,
          qty: Number(m.qty ?? 0),
          remarks: m.remarks ?? null,
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load damage stock');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    const pid = Number(productId);
    const q = Math.floor(Number(qty));
    if (!Number.isInteger(pid) || pid <= 0) {
      setError('Select product.');
      return;
    }
    if (!Number.isInteger(q) || q <= 0) {
      setError('Enter valid qty.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setMessage(null);
      await apiFetch('/api/stock/movements', {
        method: 'POST',
        body: JSON.stringify({
          occurredOn: date,
          movementType: 'DAMAGE',
          productId: pid,
          qty: q,
          remarks: remarks.trim() || null,
        }),
      });
      setMessage('Damage entry saved.');
      setProductId('');
      setQty('0');
      setRemarks('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save damage entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div id="stock/damage" className="relative -top-24 h-0" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">Add Damage Stock</h3>
          {error ? (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}
          {message ? (
            <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>
          ) : null}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date:</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product:</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Qty:</label>
            <input
              className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks:</label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
          <div className="space-y-3 pt-2">
            <button
              className="w-full bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800 disabled:opacity-60"
              type="button"
              onClick={() => void save()}
              disabled={isSubmitting}
            >
              Save Damage Entry
            </button>
            <button className="w-full bg-red-600 text-white py-2 rounded text-sm font-semibold hover:bg-red-500" type="button" onClick={() => void load()}>
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Damage Stock History</h3>
          <div className="border border-gray-200 rounded overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-sky-900 text-white">
                <tr>
                  <th className="px-3 py-2 text-left w-12">SNO</th>
                  <th className="px-3 py-2 text-left w-32">Date</th>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-left w-20">Qty</th>
                  <th className="px-3 py-2 text-left w-48">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                      Loading...
                    </td>
                  </tr>
                ) : damageRows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                      No damage entries yet.
                    </td>
                  </tr>
                ) : (
                  damageRows.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{idx + 1}</td>
                      <td className="px-3 py-2">{r.date}</td>
                      <td className="px-3 py-2">{r.productName}</td>
                      <td className="px-3 py-2">{r.qty}</td>
                      <td className="px-3 py-2">{r.remarks ?? '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

