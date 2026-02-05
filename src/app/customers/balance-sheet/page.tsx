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
  contact: string;
  address: string;
  status: string;
  outstanding: string;
  bottles: number;
  bottles19ltr: number;
  credit: string;
  amountReceived: string;
}

interface BalanceTotals {
  outstanding: string;
  bottles: number;
  bottles19ltr: number;
  credit: string;
  amountReceived: string;
}

export default function CustomerBalanceSheetPage() {
  const [customers, setCustomers] = useState<CustomerBalance[]>([]);
  const [totals, setTotals] = useState<BalanceTotals>({ outstanding: '0', bottles: 0, bottles19ltr: 0, credit: '0', amountReceived: '0' });
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
      setTotals(data.totals || { outstanding: '0', bottles: 0, bottles19ltr: 0, credit: '0', amountReceived: '0' });
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Outstanding Amount', value: totals.outstanding },
                { label: 'Total Bottles', value: totals.bottles },
                { label: '19 LTR Bottles', value: totals.bottles19ltr },
                { label: 'Credit Summary', value: totals.credit },
                { label: 'Amount Received', value: totals.amountReceived },
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
                    <th className="px-3 py-2 text-left w-20">Acc#</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Address</th>
                    <th className="px-3 py-2 text-left">Contact</th>
                    <th className="px-3 py-2 text-left w-16">Status</th>
                    <th className="px-3 py-2 text-left w-24">Balance</th>
                    <th className="px-3 py-2 text-left w-20">Bottle</th>
                    <th className="px-3 py-2 text-left w-24">19 LTR</th>
                    <th className="px-3 py-2 text-left w-24">Balance</th>
                    <th className="px-3 py-2 text-left w-28">Amount Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={11}>
                        Loading...
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={11}>
                        No customers found.
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer, idx) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2">{customer.code}</td>
                        <td className="px-3 py-2 font-medium">{customer.customer}</td>
                        <td className="px-3 py-2 text-gray-600">{customer.address}</td>
                        <td className="px-3 py-2">{customer.contact}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${customer.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                            }`}>
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-semibold">{customer.outstanding}</td>
                        <td className="px-3 py-2">{customer.bottles}</td>
                        <td className="px-3 py-2">{customer.bottles19ltr}</td>
                        <td className="px-3 py-2 font-semibold">{customer.credit}</td>
                        <td className="px-3 py-2 font-semibold text-green-600">{customer.amountReceived}</td>
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

