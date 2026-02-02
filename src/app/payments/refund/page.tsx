'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';

export default function RefundDepositPage() {
  const [customers, setCustomers] = useState<Array<{ id: number; code: string; name: string; status: 'ACTIVE' | 'INACTIVE' }>>([]);
  const [customerId, setCustomerId] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<string>('0');
  const [remarks, setRemarks] = useState<string>('');

  const [refundHistory, setRefundHistory] = useState<Array<{ id: number; refundDate: string; customerName: string; amount: number; remarks: string | null }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const [customersRes, refundsRes] = await Promise.all([
        apiFetch<{ success: true; customers: any[] }>('/api/customers'),
        apiFetch<{ success: true; refunds: any[] }>('/api/customer-security-refunds?limit=100'),
      ]);
      setCustomers(customersRes.customers);
      setRefundHistory(
        refundsRes.refunds.map((r) => ({
          id: r.id,
          refundDate: r.refundDate,
          customerName: r.customerName,
          amount: Number(r.amount ?? 0),
          remarks: r.remarks ?? null,
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load refunds');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeCustomers = useMemo(() => customers.filter((c) => c.status !== 'INACTIVE'), [customers]);

  const saveRefund = async () => {
    const cid = Number(customerId);
    const amt = Number(amount);
    if (!Number.isInteger(cid) || cid <= 0) {
      setError('Select customer.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError('Select valid date.');
      return;
    }
    if (!Number.isFinite(amt) || amt < 0) {
      setError('Enter valid amount.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setMessage(null);
      await apiFetch('/api/customer-security-refunds', {
        method: 'POST',
        body: JSON.stringify({ customerId: cid, refundDate: date, amount: amt, remarks: remarks.trim() || null }),
      });
      setMessage('Refund saved.');
      setCustomerId('');
      setAmount('0');
      setRemarks('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save refund');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Refund Deposit" subtitle="Process security deposit refund and keep refund history." />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Refund Entry">
              {error ? (
                <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              ) : null}
              {message ? (
                <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>
              ) : null}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white" value={customerId} onChange={(e) => setCustomerId(e.target.value)} disabled={isLoading}>
                    <option value="">Select Customer</option>
                    {activeCustomers.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount</label>
                  <input className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </div>
              </div>
              <div className="mt-5 flex gap-3">
                <button className="flex-1 bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800 disabled:opacity-60" type="button" onClick={() => void saveRefund()} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Refund'}
                </button>
                <a
                  href="/payments/security-deposit"
                  className="flex-1 bg-gray-800 text-white py-2 rounded text-sm font-semibold hover:bg-gray-700 text-center"
                >
                  Back to Deposit
                </a>
              </div>
            </SectionCard>

            <SectionCard title="Refund History">
              <div className="border border-gray-200 rounded overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-sky-900 text-white">
                    <tr>
                      <th className="px-3 py-2 text-left w-12">SNO</th>
                      <th className="px-3 py-2 text-left w-32">Date</th>
                      <th className="px-3 py-2 text-left">Customer</th>
                      <th className="px-3 py-2 text-left w-28">Amount</th>
                      <th className="px-3 py-2 text-left w-40">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                          Loading...
                        </td>
                      </tr>
                    ) : refundHistory.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                          No refunds yet.
                        </td>
                      </tr>
                    ) : (
                      refundHistory.map((r, idx) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">{idx + 1}</td>
                          <td className="px-3 py-2">{r.refundDate}</td>
                          <td className="px-3 py-2">{r.customerName}</td>
                          <td className="px-3 py-2">{r.amount}</td>
                          <td className="px-3 py-2">{r.remarks ?? '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

