'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';

export default function SecurityDepositPage() {
  const [customers, setCustomers] = useState<Array<{ id: number; code: string; name: string; status: 'ACTIVE' | 'INACTIVE' }>>([]);
  const [customerId, setCustomerId] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<string>('0');
  const [remarks, setRemarks] = useState<string>('');

  const [depositHistory, setDepositHistory] = useState<Array<{ id: number; depositDate: string; customerName: string; amount: number; remarks: string | null }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const [customersRes, depositsRes] = await Promise.all([
        apiFetch<{ success: true; customers: any[] }>('/api/customers'),
        apiFetch<{ success: true; deposits: any[] }>('/api/customer-security-deposits?limit=100'),
      ]);
      setCustomers(customersRes.customers);
      setDepositHistory(
        depositsRes.deposits.map((d) => ({
          id: d.id,
          depositDate: d.depositDate,
          customerName: d.customerName,
          amount: Number(d.amount ?? 0),
          remarks: d.remarks ?? null,
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load deposits');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeCustomers = useMemo(() => customers.filter((c) => c.status !== 'INACTIVE'), [customers]);

  const saveDeposit = async () => {
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
      await apiFetch('/api/customer-security-deposits', {
        method: 'POST',
        body: JSON.stringify({ customerId: cid, depositDate: date, amount: amt, remarks: remarks.trim() || null }),
      });
      setMessage('Deposit saved.');
      setCustomerId('');
      setAmount('0');
      setRemarks('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save deposit');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Security Deposit" subtitle="Deposit entry, refund entry, and deposit history." />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Deposit Entry">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </div>
              </div>
              <div className="mt-5 flex gap-3">
                <button className="flex-1 bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800 disabled:opacity-60" type="button" onClick={() => void saveDeposit()} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Deposit'}
                </button>
                <a
                  href="/payments/refund"
                  className="flex-1 bg-gray-800 text-white py-2 rounded text-sm font-semibold hover:bg-gray-700 text-center"
                >
                  Refund Deposit
                </a>
              </div>
            </SectionCard>

            <SectionCard title="Deposit History">
              <div className="border border-gray-200 rounded overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-sky-900 text-white">
                    <tr>
                      <th className="px-3 py-2 text-left w-12">SNO</th>
                      <th className="px-3 py-2 text-left w-32">Date</th>
                      <th className="px-3 py-2 text-left">Customer</th>
                      <th className="px-3 py-2 text-left w-24">Amount</th>
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
                    ) : depositHistory.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                          No deposits yet.
                        </td>
                      </tr>
                    ) : (
                      depositHistory.map((d, idx) => (
                        <tr key={d.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">{idx + 1}</td>
                          <td className="px-3 py-2">{d.depositDate}</td>
                          <td className="px-3 py-2">{d.customerName}</td>
                          <td className="px-3 py-2">{d.amount}</td>
                          <td className="px-3 py-2">{d.remarks ?? '-'}</td>
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

