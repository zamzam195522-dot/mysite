'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';

type ProductOption = { id: number; name: string };
type BalanceRow = {
  id: number;
  name: string;
  type: string | null;
  price: number;
  warehouseFilled: number;
  warehouseEmpty: number;
  warehouseTotal: number;
};

export default function FillingStockSection() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [balances, setBalances] = useState<BalanceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [productId, setProductId] = useState<string>('');
  const [qty, setQty] = useState<string>('0');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const load = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const [productsRes, balanceRes] = await Promise.all([
        apiFetch<{ success: true; products: Array<{ id: number; name: string }> }>('/api/products'),
        apiFetch<{ success: true; rows: any[] }>('/api/stock/balance'),
      ]);
      setProducts(productsRes.products.map((p) => ({ id: p.id, name: p.name })));
      setBalances(
        balanceRes.rows.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type ?? null,
          price: Number(r.price ?? 0),
          warehouseFilled: Number(r.warehouseFilled ?? 0),
          warehouseEmpty: Number(r.warehouseEmpty ?? 0),
          warehouseTotal: Number(r.warehouseTotal ?? 0),
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load filling stock');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const balanceMap = useMemo(() => {
    const m = new Map<number, BalanceRow>();
    balances.forEach((b) => m.set(b.id, b));
    return m;
  }, [balances]);

  const submit = async () => {
    const pid = Number(productId);
    const q = Math.floor(Number(qty));
    if (!Number.isInteger(pid) || pid <= 0) {
      setError('Select product.');
      return;
    }
    if (!Number.isInteger(q) || q <= 0) {
      setError('Enter valid quantity.');
      return;
    }
    if (!date) {
      setError('Select date.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setMessage(null);
      await apiFetch('/api/stock/movements', {
        method: 'POST',
        body: JSON.stringify({ occurredOn: date, movementType: 'FILLING', productId: pid, qty: q }),
      });
      setMessage('Filling stock saved.');
      setProductId('');
      setQty('0');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save filling stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div id="stock/filling-stock" className="relative -top-24 h-0" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Add Filling Stock</h3>
          {error ? (
            <div className="mb-3 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="mb-3 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          ) : null}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name:</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Filling Stock Quantity:</label>
              <input
                className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="0"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date:</label>
              <input
                type="date"
                className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-3 pt-2">
              <button
                className="w-full bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800 disabled:opacity-60"
                type="button"
                onClick={() => void submit()}
                disabled={isSubmitting}
              >
                Update New Filling Stock
              </button>
              <button
                className="w-full bg-red-600 text-white py-2 rounded text-sm font-semibold hover:bg-red-500"
                type="button"
                onClick={() => void load()}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
          <h3 className="font-semibold text-gray-800 mb-4">Filling Stock Detail</h3>
          <div className="border border-gray-200 rounded overflow-x-auto flex-1">
            <table className="min-w-full text-sm">
              <thead className="bg-sky-900 text-white">
                <tr>
                  <th className="px-3 py-2 text-left w-12">SNO</th>
                  <th className="px-3 py-2 text-left">Product Name</th>
                  <th className="px-3 py-2 text-left w-20">Price</th>
                  <th className="px-3 py-2 text-left w-32">Bottle Type</th>
                  <th className="px-3 py-2 text-left w-24">Filling Stock</th>
                  <th className="px-3 py-2 text-left w-24">Empty Stock</th>
                  <th className="px-3 py-2 text-left w-24">Total Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                      Loading...
                    </td>
                  </tr>
                ) : balances.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                      No stock records yet.
                    </td>
                  </tr>
                ) : (
                  balances.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{idx + 1}</td>
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2">{row.price}</td>
                      <td className="px-3 py-2">{row.type ?? '-'}</td>
                      <td className="px-3 py-2">{row.warehouseFilled}</td>
                      <td className="px-3 py-2">{row.warehouseEmpty}</td>
                      <td className="px-3 py-2">{row.warehouseTotal}</td>
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

