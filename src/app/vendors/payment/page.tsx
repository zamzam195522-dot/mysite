'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';
import { useCallback, useEffect, useMemo, useState } from 'react';

type VendorOption = { id: number; name: string; status: 'ACTIVE' | 'INACTIVE' };
type VendorPaymentRow = {
  id: number;
  vendorId: number;
  vendorName: string;
  paymentDate: string;
  amount: number;
  remarks: string | null;
};

export default function VendorPaymentPage() {
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [recentPayments, setRecentPayments] = useState<VendorPaymentRow[]>([]);

  const [vendorId, setVendorId] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<string>('0');
  const [remarks, setRemarks] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const [vendorsRes, paymentsRes] = await Promise.all([
        apiFetch<{ success: true; vendors: VendorOption[] }>('/api/vendors'),
        apiFetch<{ success: true; payments: VendorPaymentRow[] }>('/api/vendor-payments?limit=25'),
      ]);
      setVendors(vendorsRes.vendors);
      setRecentPayments(paymentsRes.payments);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load vendor payments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const vendorOptions = useMemo(() => vendors.filter((v) => v.status !== 'INACTIVE'), [vendors]);

  const reset = () => {
    setVendorId('');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setAmount('0');
    setRemarks('');
    setMessage(null);
    setError(null);
  };

  const save = async () => {
    const vid = Number(vendorId);
    const amt = Number(amount);
    if (!Number.isInteger(vid) || vid <= 0) {
      setError('Please select vendor.');
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('Please enter valid amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setMessage(null);
      await apiFetch('/api/vendor-payments', {
        method: 'POST',
        body: JSON.stringify({
          vendorId: vid,
          paymentDate,
          amount: amt,
          remarks: remarks.trim() || null,
        }),
      });
      setMessage('Payment saved successfully.');
      reset();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Vendor Payment" subtitle="Record vendor payments and track payment history." />

          {error ? (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Payment Entry">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="">Select Vendor</option>
                    {vendorOptions.map((v) => (
                      <option key={v.id} value={String(v.id)}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    className="w-full border border-green-300 bg-green-50 rounded px-3 py-2 text-sm"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <input
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  className="flex-1 bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800 disabled:opacity-60"
                  type="button"
                  onClick={() => void save()}
                  disabled={isSubmitting}
                >
                  Save Payment
                </button>
                <button
                  className="flex-1 bg-red-600 text-white py-2 rounded text-sm font-semibold hover:bg-red-500"
                  type="button"
                  onClick={reset}
                >
                  Reset
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Recent Payments">
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
                      <th className="px-3 py-2 text-left w-32">Date</th>
                      <th className="px-3 py-2 text-left">Vendor</th>
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
                    ) : recentPayments.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                          No payments yet.
                        </td>
                      </tr>
                    ) : (
                      recentPayments.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">{idx + 1}</td>
                          <td className="px-3 py-2">{p.paymentDate}</td>
                          <td className="px-3 py-2">{p.vendorName}</td>
                          <td className="px-3 py-2">{p.amount}</td>
                          <td className="px-3 py-2">{p.remarks ?? '-'}</td>
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

