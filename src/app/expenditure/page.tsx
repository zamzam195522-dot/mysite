'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';

export default function ExpenditurePage() {
  const [heads, setHeads] = useState<Array<{ id: number; name: string; status: 'ACTIVE' | 'INACTIVE' }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // New expense form (left)
  const [headId, setHeadId] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New head modal
  const [isHeadModalOpen, setIsHeadModalOpen] = useState(false);
  const [newHeadName, setNewHeadName] = useState('');
  const [newHeadStatus, setNewHeadStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isCreatingHead, setIsCreatingHead] = useState(false);

  // Filters (right)
  const [filterHeadId, setFilterHeadId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [groupWise, setGroupWise] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState(false);
  const [rows, setRows] = useState<any[]>([]);

  const activeHeads = useMemo(() => heads.filter((h) => h.status !== 'INACTIVE'), [heads]);

  const loadHeads = async () => {
    const res = await apiFetch<{ success: true; heads: Array<{ id: number; name: string; status: 'ACTIVE' | 'INACTIVE' }> }>(
      '/api/expense-heads',
    );
    setHeads(res.heads);
  };

  const runSearch = async () => {
    const qs = new URLSearchParams();
    if (filterHeadId) qs.set('headId', filterHeadId);
    if (fromDate) qs.set('from', fromDate);
    if (toDate) qs.set('to', toDate);
    qs.set('groupWise', groupWise ? 'true' : 'false');

    const res = await apiFetch<{ success: true; groupWise: boolean; rows: any[] }>(`/api/expenses?${qs.toString()}`);
    setRows(res.rows);
  };

  const loadInitial = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await Promise.all([loadHeads(), runSearch()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load expenditure data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveExpense = async () => {
    const hid = Number(headId);
    const amt = Number(amount);
    if (!Number.isInteger(hid) || hid <= 0) {
      setError('Please select expenditure head.');
      return;
    }
    if (!expenseDate) {
      setError('Please select date.');
      return;
    }
    if (!Number.isFinite(amt) || amt < 0) {
      setError('Please enter valid amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setMessage(null);
      await apiFetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          headId: hid,
          expenseDate,
          description: description.trim() || null,
          amount: amt,
        }),
      });
      setMessage('Expense saved.');
      setDescription('');
      setAmount('0');
      await runSearch();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const createHead = async () => {
    const n = newHeadName.trim();
    if (!n) {
      setError('Please enter head name.');
      return;
    }

    try {
      setIsCreatingHead(true);
      setError(null);
      setMessage(null);
      await apiFetch('/api/expense-heads', {
        method: 'POST',
        body: JSON.stringify({ name: n, status: newHeadStatus }),
      });
      await loadHeads();
      setIsHeadModalOpen(false);
      setNewHeadName('');
      setNewHeadStatus('ACTIVE');
      setMessage('New head created.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create head');
    } finally {
      setIsCreatingHead(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader
            title="Expenditure"
            subtitle="Add expenses by head, and review expenditure details with filters."
          />

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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Add Expenditure */}
            <div className="lg:col-span-4">
              <SectionCard title="Add Expenditure">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-end justify-between gap-3 mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Select Expenditure Head
                      </label>
                      <button
                        className="bg-sky-900 text-white px-4 py-2 rounded text-xs font-semibold hover:bg-sky-800"
                        type="button"
                        onClick={() => setIsHeadModalOpen(true)}
                      >
                        New Head
                      </button>
                    </div>
                    <select
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      value={headId}
                      onChange={(e) => setHeadId(e.target.value)}
                      disabled={isLoading}
                    >
                      <option>Select Head</option>
                      {activeHeads.map((h) => (
                        <option key={h.id} value={String(h.id)}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expense Description</label>
                    <input
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expense Amount</label>
                    <input
                      className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  <button
                    className="w-full bg-sky-900 text-white py-3 rounded text-sm font-semibold hover:bg-sky-800 disabled:opacity-60"
                    type="button"
                    onClick={() => void saveExpense()}
                    disabled={isSubmitting}
                  >
                    Save Expense
                  </button>
                </div>
              </SectionCard>
            </div>

            {/* Right: Filters + Expenditure Details */}
            <div className="lg:col-span-8">
              <SectionCard title="Expenditure Details">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end mb-4">
                  <div className="lg:col-span-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expenditure Head</label>
                    <div className="flex items-center gap-3">
                      <select
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        value={filterHeadId}
                        onChange={(e) => setFilterHeadId(e.target.value)}
                        disabled={isLoading}
                      >
                        <option value="">ALL</option>
                        {heads.map((h) => (
                          <option key={h.id} value={String(h.id)}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary focus:ring-sky-500"
                          checked={groupWise}
                          onChange={(e) => setGroupWise(e.target.checked)}
                        />
                        GroupWise
                      </label>
                    </div>
                  </div>

                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>

                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>

                  <div className="lg:col-span-1">
                    <button
                      className="w-full bg-red-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-red-500 disabled:opacity-60"
                      type="button"
                      onClick={async () => {
                        try {
                          setIsSearching(true);
                          setError(null);
                          await runSearch();
                        } catch (e) {
                          setError(e instanceof Error ? e.message : 'Search failed');
                        } finally {
                          setIsSearching(false);
                        }
                      }}
                      disabled={isSearching}
                    >
                      Search
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-sky-900 text-white">
                      <tr>
                        <th className="px-3 py-2 text-left w-12">SNO</th>
                        <th className="px-3 py-2 text-left">Head Name</th>
                        <th className="px-3 py-2 text-left w-32">Date</th>
                        <th className="px-3 py-2 text-left">Description</th>
                        <th className="px-3 py-2 text-left w-28">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {isLoading || isSearching ? (
                        <tr>
                          <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                            Loading...
                          </td>
                        </tr>
                      ) : rows.length === 0 ? (
                        <tr>
                          <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                            No expenses yet.
                          </td>
                        </tr>
                      ) : (
                        rows.map((r, idx) => (
                          <tr key={`${idx}-${r.id ?? r.headId ?? r.headName}`} className="hover:bg-gray-50">
                            <td className="px-3 py-2">{idx + 1}</td>
                            <td className="px-3 py-2">{r.headName}</td>
                            <td className="px-3 py-2">{r.date ?? '-'}</td>
                            <td className="px-3 py-2">{r.description ?? '-'}</td>
                            <td className="px-3 py-2">{r.amount}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </section>

      {/* New head modal */}
      {isHeadModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-2xl overflow-hidden">
            <div className="bg-sky-900 text-white px-6 py-3 flex items-center justify-between">
              <div className="font-semibold">New Expenditure Head</div>
              <button
                onClick={() => setIsHeadModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded bg-sky-800 hover:bg-sky-700"
                aria-label="Close"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Head Name</label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={newHeadName}
                  onChange={(e) => setNewHeadName(e.target.value)}
                  placeholder="e.g. Fuel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                  value={newHeadStatus}
                  onChange={(e) => setNewHeadStatus(e.target.value === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  className="flex-1 bg-gray-600 text-white py-2 rounded text-sm font-semibold hover:bg-gray-500"
                  type="button"
                  onClick={() => setIsHeadModalOpen(false)}
                  disabled={isCreatingHead}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800 disabled:opacity-60"
                  type="button"
                  onClick={() => void createHead()}
                  disabled={isCreatingHead}
                >
                  {isCreatingHead ? 'Creating...' : 'Create Head'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <Footer />
    </main>
  );
}

