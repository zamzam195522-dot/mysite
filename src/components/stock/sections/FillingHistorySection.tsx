'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Row = {
  id: number;
  date: string;
  productName: string;
  oldStock: number;
  newStock: number;
  updateStock: number;
};

export default function FillingHistorySection() {
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [historyRows, setHistoryRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const qs = new URLSearchParams();
      if (fromDate) qs.set('from', fromDate);
      if (toDate) qs.set('to', toDate);
      const res = await apiFetch<{ success: true; rows: Row[] }>(
        `/api/stock/filling-history${qs.toString() ? `?${qs.toString()}` : ''}`,
      );
      setHistoryRows(res.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load filling history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div id="stock/filling-history" className="relative -top-24 h-0" />

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end md:space-x-4 space-y-4 md:space-y-0">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date:</label>
            <input
              type="date"
              className="w-48 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date:</label>
            <input
              type="date"
              className="w-48 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <button
            className="bg-red-600 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-red-500 disabled:opacity-60"
            type="button"
            onClick={() => void search()}
            disabled={isLoading}
          >
            Search
          </button>
        </div>

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="border border-gray-200 rounded overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-sky-900 text-white">
              <tr>
                <th className="px-3 py-2 text-left w-12">SNO</th>
                <th className="px-3 py-2 text-left w-32">Date</th>
                <th className="px-3 py-2 text-left">Product Name</th>
                <th className="px-3 py-2 text-left w-24">Old Stock</th>
                <th className="px-3 py-2 text-left w-24">New Stock</th>
                <th className="px-3 py-2 text-left w-28">Update Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                    Loading...
                  </td>
                </tr>
              ) : historyRows.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                    No filling history yet.
                  </td>
                </tr>
              ) : (
                historyRows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{idx + 1}</td>
                    <td className="px-3 py-2">{row.date}</td>
                    <td className="px-3 py-2">{row.productName}</td>
                    <td className="px-3 py-2">{row.oldStock}</td>
                    <td className="px-3 py-2">{row.newStock}</td>
                    <td className="px-3 py-2">{row.updateStock}</td>
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

