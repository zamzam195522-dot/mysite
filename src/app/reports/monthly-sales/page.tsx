'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';

export default function MonthlySalesReportPage() {
  const [month, setMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [employeeId, setEmployeeId] = useState<string>('');
  const [employees, setEmployees] = useState<Array<{ id: number; name: string; designation: string; status: 'ACTIVE' | 'INACTIVE' }>>([]);
  const [rows, setRows] = useState<Array<{ productId: number; product: string; qty: number; amount: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = async () => {
    const res = await apiFetch<{ success: true; employees: any[] }>('/api/employees');
    setEmployees(res.employees);
  };

  const generate = async () => {
    try {
      setError(null);
      setIsGenerating(true);
      const qs = new URLSearchParams({ month });
      if (employeeId) qs.set('employeeId', employeeId);
      const res = await apiFetch<{ success: true; rows: typeof rows }>(`/api/reports/monthly-sales?${qs.toString()}`);
      setRows(res.rows);
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
          <PageHeader title="Monthly Sales Report" subtitle="Monthly product-wise and employee-wise totals." />

          <SectionCard title="Filters">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <input type="month" className="w-48 border border-gray-300 rounded px-3 py-2 text-sm" value={month} onChange={(e) => setMonth(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} disabled={isLoading}>
                  <option value="">All Employees</option>
                  {employees
                    .filter((e) => e.status !== 'INACTIVE')
                    .map((e) => (
                      <option key={e.id} value={String(e.id)}>
                        {e.name} ({e.designation})
                      </option>
                    ))}
                </select>
              </div>
              <button className="bg-red-600 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-red-500 disabled:opacity-60" type="button" onClick={() => void generate()} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Monthly Summary">
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
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-left w-24">Qty</th>
                    <th className="px-3 py-2 text-left w-28">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={4}>
                        No rows.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, idx) => (
                      <tr key={r.productId} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{idx + 1}</td>
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

