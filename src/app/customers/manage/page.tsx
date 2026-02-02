'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';

type AreaRow = { id: number; name: string; status: 'ACTIVE' | 'INACTIVE' };

type CustomerRow = {
  id: number;
  code: string;
  name: string;
  contact: string | null;
  address: string | null;
  areaId: number | null;
  areaName: string | null;
  deliveryDays: string | null;
  requiredBottles: number;
  openingBalance: number;
  status: 'ACTIVE' | 'INACTIVE';
};

export default function ManageCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editAreaId, setEditAreaId] = useState<string>('');
  const [editDeliveryDays, setEditDeliveryDays] = useState('');
  const [editRequiredBottles, setEditRequiredBottles] = useState('0');
  const [editOpeningBalance, setEditOpeningBalance] = useState('0');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const [customersRes, areasRes] = await Promise.all([
        apiFetch<{ success: true; customers: CustomerRow[] }>('/api/customers'),
        apiFetch<{ success: true; areas: AreaRow[] }>('/api/areas'),
      ]);
      setCustomers(customersRes.customers);
      setAreas(areasRes.areas);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const hay = `${c.code} ${c.name} ${c.contact ?? ''} ${c.address ?? ''} ${c.areaName ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [customers, search]);

  const beginEdit = (c: CustomerRow) => {
    setEditing(c);
    setEditName(c.name);
    setEditContact(c.contact ?? '');
    setEditAreaId(c.areaId ? String(c.areaId) : '');
    setEditDeliveryDays(c.deliveryDays ?? '');
    setEditRequiredBottles(String(c.requiredBottles ?? 0));
    setEditOpeningBalance(String(c.openingBalance ?? 0));
    setEditStatus(c.status);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditName('');
    setEditContact('');
    setEditAreaId('');
    setEditDeliveryDays('');
    setEditRequiredBottles('0');
    setEditOpeningBalance('0');
    setEditStatus('ACTIVE');
  };

  const saveEdit = async () => {
    if (!editing) return;
    const name = editName.trim();
    if (!name) {
      setError('Please enter customer name.');
      return;
    }
    const rb = Number(editRequiredBottles);
    const ob = Number(editOpeningBalance);
    if (!Number.isFinite(rb) || rb < 0 || !Number.isFinite(ob)) {
      setError('Please enter valid numeric values.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const res = await apiFetch<{ success: true; customer: CustomerRow }>(`/api/customers/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          contact: editContact.trim() || null,
          areaId: editAreaId.trim() === '' ? null : Number(editAreaId),
          deliveryDays: editDeliveryDays.trim() || null,
          requiredBottles: rb,
          openingBalance: ob,
          status: editStatus,
        }),
      });
      setCustomers((prev) => prev.map((x) => (x.id === editing.id ? res.customer : x)));
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update customer');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (c: CustomerRow) => {
    try {
      setError(null);
      const nextStatus: CustomerRow['status'] = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const res = await apiFetch<{ success: true; customer: CustomerRow }>(`/api/customers/${c.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setCustomers((prev) => prev.map((x) => (x.id === c.id ? res.customer : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Manage Customers" subtitle="Search, view, edit customers, and manage status." />

          {error ? (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <SectionCard title="Customer List">
            <div className="flex flex-col md:flex-row md:items-end md:space-x-3 space-y-3 md:space-y-0 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="Search by name, address, or ID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                className="bg-gray-700 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-gray-600"
                type="button"
                onClick={() => void load()}
              >
                Refresh
              </button>
              <a
                href="/customers/add"
                className="bg-sky-900 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-sky-800 text-center"
              >
                Add New
              </a>
            </div>

            <div className="border border-gray-200 rounded overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-sky-900 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left w-12">SNO</th>
                    <th className="px-3 py-2 text-left w-28">Acc#</th>
                    <th className="px-3 py-2 text-left">Customer Name</th>
                    <th className="px-3 py-2 text-left">Area</th>
                    <th className="px-3 py-2 text-left w-32">Contact</th>
                    <th className="px-3 py-2 text-left w-24">Status</th>
                    <th className="px-3 py-2 text-left w-40">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                        Loading...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                        No customers yet.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c, idx) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2">{c.code}</td>
                        <td className="px-3 py-2">{c.name}</td>
                        <td className="px-3 py-2">{c.areaName ?? '-'}</td>
                        <td className="px-3 py-2">{c.contact ?? '-'}</td>
                        <td className="px-3 py-2">{c.status}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button
                              className="bg-sky-900 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-sky-800"
                              type="button"
                              onClick={() => beginEdit(c)}
                            >
                              Edit
                            </button>
                            <button
                              className="bg-gray-700 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-gray-600"
                              type="button"
                              onClick={() => void toggleStatus(c)}
                            >
                              Activate/Deactivate
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
      </section>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-2xl overflow-hidden">
            <div className="bg-sky-900 text-white px-6 py-3 flex items-center justify-between">
              <div className="font-semibold">Edit Customer</div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                  <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm" value={editContact} onChange={(e) => setEditContact(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white" value={editAreaId} onChange={(e) => setEditAreaId(e.target.value)}>
                    <option value="">Select Area</option>
                    {areas.map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {a.name} ({a.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Days</label>
                  <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm" value={editDeliveryDays} onChange={(e) => setEditDeliveryDays(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Required Bottles</label>
                  <input className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm" value={editRequiredBottles} onChange={(e) => setEditRequiredBottles(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance</label>
                  <input className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm" value={editOpeningBalance} onChange={(e) => setEditOpeningBalance(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white" value={editStatus} onChange={(e) => setEditStatus(e.target.value === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
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

