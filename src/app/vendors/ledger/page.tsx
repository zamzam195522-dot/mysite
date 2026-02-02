'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';
import { useEffect, useMemo, useState } from 'react';

export default function VendorLedgerPage() {
  const [vendors, setVendors] = useState<Array<{ id: number; name: string; status: 'ACTIVE' | 'INACTIVE' }>>([]);
  const [vendorId, setVendorId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [ledgerRows, setLedgerRows] = useState<
    Array<{ date: string; type: string; refNo: string; description: string; debit: number; credit: number; balance: number }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVendors = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const res = await apiFetch<{ success: true; vendors: Array<{ id: number; name: string; status: 'ACTIVE' | 'INACTIVE' }> }>(
        '/api/vendors',
      );
      setVendors(res.vendors);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load vendors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadVendors();
  }, []);

  const vendorOptions = useMemo(() => vendors.filter((v) => v.status !== 'INACTIVE'), [vendors]);

  const search = async () => {
    const vid = Number(vendorId);
    if (!Number.isInteger(vid) || vid <= 0) {
      setError('Please select vendor.');
      return;
    }

    const qs = new URLSearchParams();
    if (fromDate) qs.set('from', fromDate);
    if (toDate) qs.set('to', toDate);

    try {
      setIsSearching(true);
      setError(null);
      const res = await apiFetch<{ success: true; ledger: typeof ledgerRows }>(
        `/api/vendors/${vid}/ledger${qs.toString() ? `?${qs.toString()}` : ''}`,
      );
      setLedgerRows(res.ledger);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load ledger');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Vendor Ledger" subtitle="Purchase history, payment history, and outstanding balance." />

          <SectionCard title="Vendor Ledger">
            {error ? (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
              <div className="flex-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input
                  type="date"
                  className="w-48 border border-gray-300 rounded px-3 py-2 text-sm"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="date"
                  className="w-48 border border-gray-300 rounded px-3 py-2 text-sm"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <button
                className="bg-red-600 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-red-500 disabled:opacity-60"
                type="button"
                onClick={() => void search()}
                disabled={isSearching}
              >
                Search
              </button>
            </div>

            <div className="border border-gray-200 rounded overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-sky-900 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left w-12">SNO</th>
                    <th className="px-3 py-2 text-left w-32">Date</th>
                    <th className="px-3 py-2 text-left w-28">Type</th>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-left w-24">Debit</th>
                    <th className="px-3 py-2 text-left w-24">Credit</th>
                    <th className="px-3 py-2 text-left w-24">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isSearching ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                        Loading...
                      </td>
                    </tr>
                  ) : ledgerRows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                        No ledger entries yet.
                      </td>
                    </tr>
                  ) : (
                    ledgerRows.map((r, idx) => (
                      <tr key={`${r.refNo}-${idx}`} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2">{r.date}</td>
                        <td className="px-3 py-2">{r.type}</td>
                        <td className="px-3 py-2">{r.description}</td>
                        <td className="px-3 py-2">{r.debit}</td>
                        <td className="px-3 py-2">{r.credit}</td>
                        <td className="px-3 py-2">{r.balance}</td>
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

