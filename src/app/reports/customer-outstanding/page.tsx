'use client';

import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';

export default function CustomerOutstandingReportPage() {
  const [rows, setRows] = useState<Array<{ id: number; code: string; customer: string; outstandingAmount: number; bottleBalance: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const res = await apiFetch<{ success: true; rows: Array<{ id: number; code: string; customer: string; outstandingAmount: number; bottleBalance: number }> }>(
        '/api/reports/customer-outstanding',
      );
      setRows(res.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load outstanding report');
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
          <PageHeader title="Customer Outstanding Report" subtitle="Customer-wise outstanding amount and bottle balances." />

          <SectionCard title="Outstanding List">
            {error ? (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            <div className="flex items-center justify-end mb-3">
              <button className="bg-gray-700 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-gray-600" type="button" onClick={() => void load()}>
                Refresh
              </button>
            </div>
            <div className="border border-gray-200 rounded overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-sky-900 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left w-12">SNO</th>
                    <th className="px-3 py-2 text-left w-28">Acc#</th>
                    <th className="px-3 py-2 text-left">Customer</th>
                    <th className="px-3 py-2 text-left w-32">Outstanding Amount</th>
                    <th className="px-3 py-2 text-left w-32">Bottle Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                        Loading...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                        No outstanding records yet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, idx) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2">{r.code}</td>
                        <td className="px-3 py-2">{r.customer}</td>
                        <td className="px-3 py-2">{r.outstandingAmount}</td>
                        <td className="px-3 py-2">{r.bottleBalance}</td>
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

