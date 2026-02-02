'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';

export default function SalesmanWiseReportPage() {
  const [salesmanId, setSalesmanId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [employees, setEmployees] = useState<Array<{ id: number; name: string; designation: string; status: 'ACTIVE' | 'INACTIVE' }>>([]);
  const [rows, setRows] = useState<Array<{ employeeId: number; salesman: string; sales: number; payments: number; receivable: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = async () => {
    const res = await apiFetch<{ success: true; employees: any[] }>('/api/employees');
    setEmployees(res.employees.filter((e) => e.designation === 'SALESMAN'));
  };

  const generate = async () => {
    try {
      setError(null);
      setIsGenerating(true);
      const qs = new URLSearchParams();
      if (fromDate) qs.set('from', fromDate);
      if (toDate) qs.set('to', toDate);
      const res = await apiFetch<{ success: true; rows: typeof rows }>(`/api/reports/salesman?${qs.toString()}`);
      const filtered = salesmanId ? res.rows.filter((r) => String(r.employeeId) === salesmanId) : res.rows;
      setRows(filtered);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        setError(null);
        setIsLoading(true);
        await loadEmployees();
        await generate();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load page');
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Salesman-wise Report" subtitle="Sales and collections summary by salesman." />

          <SectionCard title="Filters">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Salesman</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white" value={salesmanId} onChange={(e) => setSalesmanId(e.target.value)} disabled={isLoading}>
                  <option value="">All Salesmen</option>
                  {employees
                    .filter((e) => e.status !== 'INACTIVE')
                    .map((e) => (
                      <option key={e.id} value={String(e.id)}>
                        {e.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input type="date" className="w-48 border border-gray-300 rounded px-3 py-2 text-sm" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input type="date" className="w-48 border border-gray-300 rounded px-3 py-2 text-sm" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
              <button className="bg-red-600 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-red-500 disabled:opacity-60" type="button" onClick={() => void generate()} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Salesman Summary">
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
                    <th className="px-3 py-2 text-left">Salesman</th>
                    <th className="px-3 py-2 text-left w-28">Sales</th>
                    <th className="px-3 py-2 text-left w-28">Payments</th>
                    <th className="px-3 py-2 text-left w-28">Receivable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                        No rows.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, idx) => (
                      <tr key={r.employeeId} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2">{r.salesman}</td>
                        <td className="px-3 py-2">{r.sales}</td>
                        <td className="px-3 py-2">{r.payments}</td>
                        <td className="px-3 py-2">{r.receivable}</td>
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

