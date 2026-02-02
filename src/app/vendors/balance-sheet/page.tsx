'use client';

import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';

type VendorBalanceRow = {
  id: number;
  code: string;
  vendor: string;
  totalPurchases: number;
  totalPayments: number;
  outstanding: number;
};

type VendorBalanceSummary = {
  totalPurchases: number;
  totalPayments: number;
  outstanding: number;
};

export default function VendorBalanceSheetPage() {
  const [vendorRows, setVendorRows] = useState<VendorBalanceRow[]>([]);
  const [summary, setSummary] = useState<VendorBalanceSummary>({
    totalPurchases: 0,
    totalPayments: 0,
    outstanding: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const res = await apiFetch<{ success: true; summary: VendorBalanceSummary; rows: VendorBalanceRow[] }>(
        '/api/vendors/balance-sheet',
      );
      setSummary(res.summary);
      setVendorRows(res.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load vendor balance sheet');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Vendor Balance Sheet" subtitle="Vendor outstanding balance and summary." />

          {error ? (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <SectionCard title="Outstanding Summary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Total Purchases', value: String(summary.totalPurchases) },
                { label: 'Total Payments', value: String(summary.totalPayments) },
                { label: 'Outstanding Balance', value: String(summary.outstanding) },
              ].map((x) => (
                <div key={x.label} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-700">{x.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{x.value}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Vendor-wise Outstanding">
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
                    <th className="px-3 py-2 text-left">Vendor</th>
                    <th className="px-3 py-2 text-left w-32">Total Purchases</th>
                    <th className="px-3 py-2 text-left w-32">Total Payments</th>
                    <th className="px-3 py-2 text-left w-32">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                        Loading...
                      </td>
                    </tr>
                  ) : vendorRows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                        No vendor balances yet.
                      </td>
                    </tr>
                  ) : (
                    vendorRows.map((r, idx) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2">{r.vendor}</td>
                        <td className="px-3 py-2">{r.totalPurchases}</td>
                        <td className="px-3 py-2">{r.totalPayments}</td>
                        <td className="px-3 py-2">{r.outstanding}</td>
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

