'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';

export default function DailyAreaListPage() {
  const [day, setDay] = useState<string>('Monday');
  const [salesmanId, setSalesmanId] = useState<string>('');
  const [employees, setEmployees] = useState<Array<{ id: number; name: string; designation: string; status: 'ACTIVE' | 'INACTIVE' }>>([]);
  const [routeRows, setRouteRows] = useState<Array<{ id: number; customer: string; area: string; bottles: number; salesman: string }>>([]);
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
      const qs = new URLSearchParams({ day });
      if (salesmanId) qs.set('salesmanId', salesmanId);
      const res = await apiFetch<{ success: true; rows: typeof routeRows }>(`/api/reports/daily-area?${qs.toString()}`);
      setRouteRows(res.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate route sheet');
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
          <PageHeader title="Daily Area List" subtitle="Day-wise route, salesman-wise list, and printable route sheet." />

          <SectionCard title="Route Filters">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                <select className="w-48 border border-gray-300 rounded px-3 py-2 text-sm bg-white" value={day} onChange={(e) => setDay(e.target.value)}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
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
              <button className="bg-red-600 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-red-500 disabled:opacity-60" type="button" onClick={() => void generate()} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
              <button className="bg-sky-900 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-sky-800">
                Print Route Sheet
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Route Sheet">
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
                    <th className="px-3 py-2 text-left">Customer</th>
                    <th className="px-3 py-2 text-left">Area</th>
                    <th className="px-3 py-2 text-left w-24">Bottles</th>
                    <th className="px-3 py-2 text-left w-32">Salesman</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading || isGenerating ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                        Loading...
                      </td>
                    </tr>
                  ) : routeRows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                        No route entries yet.
                      </td>
                    </tr>
                  ) : (
                    routeRows.map((r, idx) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2">{r.customer}</td>
                        <td className="px-3 py-2">{r.area}</td>
                        <td className="px-3 py-2">{r.bottles}</td>
                        <td className="px-3 py-2">{r.salesman}</td>
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

