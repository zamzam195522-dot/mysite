'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Row = {
  id: number;
  name: string;
  type: string | null;
  price: number;
  warehouseFilled: number;
  warehouseEmpty: number;
  warehouseTotal: number;
  damagedTotal: number;
  marketTotal: number;
};

export default function StockBalanceSection() {
  const [balances, setBalances] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const res = await apiFetch<{ success: true; rows: Row[] }>('/api/stock/balance');
      setBalances(res.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load stock balance');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <div id="stock/balance" className="relative -top-24 h-0" />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Warehouse / Market Stock Balance</h3>
        {error ? (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
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
                <th className="px-3 py-2 text-left">Product Name</th>
                <th className="px-3 py-2 text-left w-20">Price</th>
                <th className="px-3 py-2 text-left w-32">Bottle Type</th>
                <th className="px-3 py-2 text-left w-40">Filling Stock (Warehouse)</th>
                <th className="px-3 py-2 text-left w-40">Empty Stock (Warehouse)</th>
                <th className="px-3 py-2 text-left w-40">Total Stock (Warehouse)</th>
                <th className="px-3 py-2 text-left w-32">Damaged Stock</th>
                <th className="px-3 py-2 text-left w-40">Total Stock (Market)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={9}>
                    Loading...
                  </td>
                </tr>
              ) : balances.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={9}>
                    No stock balance yet.
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
                    <td className="px-3 py-2">{row.damagedTotal}</td>
                    <td className="px-3 py-2">{row.marketTotal}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

