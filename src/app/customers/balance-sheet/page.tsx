'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';

interface CustomerBalance {
  id: string;
  code: string;
  customer: string;
  outstanding: string;
  bottles: number;
  credit: string;
}

interface BalanceTotals {
  outstanding: string;
  bottles: number;
  credit: string;
}

export default function CustomerBalanceSheetPage() {
  const [customers, setCustomers] = useState<CustomerBalance[]>([]);
  const [totals, setTotals] = useState<BalanceTotals>({ outstanding: '0', bottles: 0, credit: '0' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchBalanceData();
  }, []);

  const fetchBalanceData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/customers/balance-sheet');
      if (!response.ok) throw new Error('Failed to fetch balance data');

      const data = await response.json();
      setCustomers(data.customers || []);
      setTotals(data.totals || { outstanding: '0', bottles: 0, credit: '0' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Customer Balance Sheet" subtitle="Outstanding amount, bottles in market, and credit summary." />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <SectionCard title="Balance Summary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Outstanding Amount', value: totals.outstanding },
                { label: 'Bottles in Market', value: totals.bottles },
                { label: 'Credit Summary', value: totals.credit },
              ].map((x) => (
                <div key={x.label} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-700">{x.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{x.value}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Customer-wise Summary">
            <div className="border border-gray-200 rounded overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-sky-900 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left w-12">SNO</th>
                    <th className="px-3 py-2 text-left w-28">Acc#</th>
                    <th className="px-3 py-2 text-left">Customer</th>
                    <th className="px-3 py-2 text-left w-28">Outstanding</th>
                    <th className="px-3 py-2 text-left w-28">Bottles</th>
                    <th className="px-3 py-2 text-left w-28">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                        Loading...
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                        No customers found.
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer, idx) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2">{customer.code}</td>
                        <td className="px-3 py-2">{customer.customer}</td>
                        <td className="px-3 py-2">{customer.outstanding}</td>
                        <td className="px-3 py-2">{customer.bottles}</td>
                        <td className="px-3 py-2">{customer.credit}</td>
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

