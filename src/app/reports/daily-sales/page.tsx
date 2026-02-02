'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';

export default function DailySalesReportPage() {
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [employeeId, setEmployeeId] = useState<string>('');
  const [employees, setEmployees] = useState<Array<{ id: number; name: string; designation: string; status: 'ACTIVE' | 'INACTIVE' }>>([]);

  const [summary, setSummary] = useState<{ cashInHand: number; receivableAmount: number; totalSalesAmount: number }>({
    cashInHand: 0,
    receivableAmount: 0,
    totalSalesAmount: 0,
  });
  const [rows, setRows] = useState<Array<{ product: string; qty: number; amount: number }>>([]);
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
      const qs = new URLSearchParams({ date });
      if (employeeId) qs.set('employeeId', employeeId);
      const res = await apiFetch<{ success: true; summary: typeof summary; rows: typeof rows }>(`/api/reports/daily-sales?${qs.toString()}`);
      setSummary(res.summary);
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
          <PageHeader title="Daily Sales Report" subtitle="Product-wise, employee-wise, cash in hand, receivables." />

          <SectionCard title="Filters">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" className="w-48 border border-gray-300 rounded px-3 py-2 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
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

          <SectionCard title="Summary">
            {error ? (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Cash in Hand', value: String(summary.cashInHand) },
                { label: 'Receivable Amount', value: String(summary.receivableAmount) },
                { label: 'Total Sales Amount', value: String(summary.totalSalesAmount) },
              ].map((x) => (
                <div key={x.label} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-700">{x.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{x.value}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Product Summary">
            <div className="border border-gray-200 rounded overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-sky-900 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left w-12">SNO</th>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-left w-24">Qty</th>
                    <th className="px-3 py-2 text-left w-32">Amount</th>
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
                      <tr key={`${r.product}-${idx}`} className="hover:bg-gray-50">
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

