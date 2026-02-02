'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';

export default function SalesHistoryPage() {
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');

  const [customers, setCustomers] = useState<Array<{ id: number; code: string; name: string; status: 'ACTIVE' | 'INACTIVE' }>>([]);
  const [rows, setRows] = useState<Array<{ invoiceId: number; date: string; customerId: number; customer: string; productId: number; product: string; qty: number; amount: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    const res = await apiFetch<{ success: true; customers: Array<{ id: number; code: string; name: string; status: 'ACTIVE' | 'INACTIVE' }> }>(
      '/api/customers',
    );
    setCustomers(res.customers);
  }, []);

  const search = useCallback(async () => {
    try {
      setError(null);
      setIsSearching(true);
      const qs = new URLSearchParams();
      if (fromDate) qs.set('from', fromDate);
      if (toDate) qs.set('to', toDate);
      if (customerId) qs.set('customerId', customerId);
      const res = await apiFetch<{ success: true; rows: typeof rows }>(`/api/sales-history${qs.toString() ? `?${qs.toString()}` : ''}`);
      setRows(res.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sales history');
    } finally {
      setIsSearching(false);
    }
  }, [customerId, fromDate, toDate]);

  useEffect(() => {
    void (async () => {
      try {
        setError(null);
        setIsLoading(true);
        await loadCustomers();
        await search();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load page');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [loadCustomers, search]);

  const customerOptions = useMemo(() => customers.filter((c) => c.status !== 'INACTIVE'), [customers]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Sales History" subtitle="View date-wise, customer-wise, and product-wise sales." />

          <SectionCard title="Filters">
            <div className="flex flex-col md:flex-row md:items-end md:space-x-4 space-y-4 md:space-y-0">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input type="date" className="w-48 border border-gray-300 rounded px-3 py-2 text-sm" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input type="date" className="w-48 border border-gray-300 rounded px-3 py-2 text-sm" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white" value={customerId} onChange={(e) => setCustomerId(e.target.value)} disabled={isLoading}>
                  <option value="">All Customers</option>
                  {customerOptions.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <button className="bg-red-600 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-red-500 disabled:opacity-60" type="button" onClick={() => void search()} disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Sales List">
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
                    <th className="px-3 py-2 text-left w-32">Date</th>
                    <th className="px-3 py-2 text-left">Customer</th>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-left w-20">Qty</th>
                    <th className="px-3 py-2 text-left w-24">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                        Loading...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                        No sales yet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, idx) => (
                      <tr key={`${r.invoiceId}-${r.productId}`} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2">{r.date}</td>
                        <td className="px-3 py-2">{r.customer}</td>
                        <td className="px-3 py-2">{r.product}</td>
                        <td className="px-3 py-2">{r.qty}</td>
                        <td className="px-3 py-2">{r.amount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      </section>
      <Footer />
    </main>
  );
}

