'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';

type BankRow = {
  id: number;
  name: string;
  accountNumber: string;
  branch: string | null;
  status: 'ACTIVE' | 'INACTIVE';
};

export default function BanksPage() {
  const [banks, setBanks] = useState<BankRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editing, setEditing] = useState<BankRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const res = await apiFetch<{ success: true; banks: BankRow[] }>('/api/banks');
      setBanks(res.banks);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load banks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setName('');
    setAccountNumber('');
    setBranch('');
    setStatus('ACTIVE');
  };

  const saveBank = async () => {
    const n = name.trim();
    const acc = accountNumber.trim();
    if (!n || !acc) {
      setError('Please enter bank name and account number.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await apiFetch<{ success: true; bank: BankRow }>('/api/banks', {
        method: 'POST',
        body: JSON.stringify({ name: n, accountNumber: acc, branch: branch.trim() || null, status }),
      });
      setBanks((prev) => [res.bank, ...prev].sort((a, b) => (a.name + a.accountNumber).localeCompare(b.name + b.accountNumber)));
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save bank');
    } finally {
      setIsSubmitting(false);
    }
  };

  const beginEdit = (b: BankRow) => {
    setEditing(b);
    setEditName(b.name);
    setEditAccountNumber(b.accountNumber);
    setEditBranch(b.branch ?? '');
    setEditStatus(b.status);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditName('');
    setEditAccountNumber('');
    setEditBranch('');
    setEditStatus('ACTIVE');
  };

  const saveEdit = async () => {
    if (!editing) return;
    const n = editName.trim();
    const acc = editAccountNumber.trim();
    if (!n || !acc) {
      setError('Please enter bank name and account number.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const res = await apiFetch<{ success: true; bank: BankRow }>(`/api/banks/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: n, accountNumber: acc, branch: editBranch.trim() || null, status: editStatus }),
      });
      setBanks((prev) => prev.map((x) => (x.id === editing.id ? res.bank : x)));
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update bank');
    } finally {
      setIsSaving(false);
    }
  };

  const deactivateBank = async (b: BankRow) => {
    const ok = window.confirm(`Deactivate "${b.name}"?`);
    if (!ok) return;
    try {
      setError(null);
      await apiFetch(`/api/banks/${b.id}`, { method: 'DELETE' });
      setBanks((prev) => prev.filter((x) => x.id !== b.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to deactivate bank');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Banks" subtitle="Manage bank accounts for payments and deposits." />

          {error ? (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Add Bank">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="Bank name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account #</label>
                  <input
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="Account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                  <input
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="Branch"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                    value={status}
                    onChange={(e) => setStatus(e.target.value === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  className="flex-1 bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800 disabled:opacity-60"
                  type="button"
                  onClick={() => void saveBank()}
                  disabled={isSubmitting}
                >
                  Save Bank
                </button>
                <button
                  className="flex-1 bg-red-600 text-white py-2 rounded text-sm font-semibold hover:bg-red-500"
                  type="button"
                  onClick={resetForm}
                >
                  Reset
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Bank List">
              <div className="border border-gray-200 rounded overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-sky-900 text-white">
                    <tr>
                      <th className="px-3 py-2 text-left w-12">SNO</th>
                      <th className="px-3 py-2 text-left">Bank</th>
                      <th className="px-3 py-2 text-left w-40">Account #</th>
                      <th className="px-3 py-2 text-left">Branch</th>
                      <th className="px-3 py-2 text-left w-24">Status</th>
                      <th className="px-3 py-2 text-left w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                          Loading...
                        </td>
                      </tr>
                    ) : banks.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                          No banks yet.
                        </td>
                      </tr>
                    ) : (
                      banks.map((b, idx) => (
                        <tr key={b.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">{idx + 1}</td>
                          <td className="px-3 py-2">{b.name}</td>
                          <td className="px-3 py-2">{b.accountNumber}</td>
                          <td className="px-3 py-2">{b.branch ?? '-'}</td>
                          <td className="px-3 py-2">{b.status}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                className="bg-sky-900 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-sky-800"
                                type="button"
                                onClick={() => beginEdit(b)}
                              >
                                Edit
                              </button>
                              <button
                                className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-red-500"
                                type="button"
                                onClick={() => void deactivateBank(b)}
                              >
                                Deactivate
                              </button>
                            </div>
                          </td>
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

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-2xl overflow-hidden">
            <div className="bg-sky-900 text-white px-6 py-3 flex items-center justify-between">
              <div className="font-semibold">Edit Bank</div>
              <button
                onClick={cancelEdit}
                className="w-8 h-8 flex items-center justify-center rounded bg-sky-800 hover:bg-sky-700"
                aria-label="Close"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account #</label>
                <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm" value={editAccountNumber} onChange={(e) => setEditAccountNumber(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm" value={editBranch} onChange={(e) => setEditBranch(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white" value={editStatus} onChange={(e) => setEditStatus(e.target.value === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button className="flex-1 bg-gray-600 text-white py-2 rounded text-sm font-semibold hover:bg-gray-500" type="button" onClick={cancelEdit} disabled={isSaving}>
                  Cancel
                </button>
                <button className="flex-1 bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800 disabled:opacity-60" type="button" onClick={() => void saveEdit()} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
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

