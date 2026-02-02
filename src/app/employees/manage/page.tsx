'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';

type EmployeeRow = {
  id: number;
  code: string;
  name: string;
  contact: string | null;
  designation: 'SALESMAN' | 'DRIVER' | 'OFFICE_STAFF' | 'OTHER';
  status: 'ACTIVE' | 'INACTIVE';
  username?: string | null;
};

export default function ManageEmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [editing, setEditing] = useState<EmployeeRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editDesignation, setEditDesignation] = useState<EmployeeRow['designation']>('SALESMAN');
  const [editStatus, setEditStatus] = useState<EmployeeRow['status']>('ACTIVE');
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const res = await apiFetch<{ success: true; employees: EmployeeRow[] }>('/api/employees');
      setEmployees(res.employees);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load employees');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => {
      const hay = `${e.code} ${e.name} ${e.contact ?? ''} ${e.designation} ${e.status}`.toLowerCase();
      return hay.includes(q);
    });
  }, [employees, search]);

  const beginEdit = (e: EmployeeRow) => {
    setEditing(e);
    setEditName(e.name);
    setEditContact(e.contact ?? '');
    setEditDesignation(e.designation);
    setEditStatus(e.status);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditName('');
    setEditContact('');
    setEditDesignation('SALESMAN');
    setEditStatus('ACTIVE');
  };

  const saveEdit = async () => {
    if (!editing) return;
    const name = editName.trim();
    if (!name) {
      setError('Please enter employee name.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const res = await apiFetch<{ success: true; employee: EmployeeRow }>(`/api/employees/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          contact: editContact.trim() || null,
          designation: editDesignation,
          status: editStatus,
        }),
      });
      setEmployees((prev) => prev.map((x) => (x.id === editing.id ? res.employee : x)));
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update employee');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (e: EmployeeRow) => {
    try {
      setError(null);
      const nextStatus: EmployeeRow['status'] = e.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const res = await apiFetch<{ success: true; employee: EmployeeRow }>(`/api/employees/${e.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setEmployees((prev) => prev.map((x) => (x.id === e.id ? res.employee : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Manage Employees" subtitle="Search, view, and manage employee accounts." />

          {error ? (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <SectionCard title="Employee Accounts">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search By ID or Name</label>
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="Enter ID or Name"
                  value={search}
                  onChange={(ev) => setSearch(ev.target.value)}
                />
                <button
                  className="bg-gray-700 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-gray-600"
                  type="button"
                  onClick={() => void load()}
                >
                  Refresh
                </button>
                <a
                  href="/employees/add"
                  className="bg-sky-900 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-sky-800 text-center"
                >
                  Add New
                </a>
              </div>
            </div>

            <div className="border border-gray-200 rounded overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-sky-900 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left w-12">SNO</th>
                    <th className="px-3 py-2 text-left w-24">Acc#</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left w-40">Contact</th>
                    <th className="px-3 py-2 text-left w-32">Designation</th>
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
                        No employees yet.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((e, idx) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2">{e.code}</td>
                        <td className="px-3 py-2">{e.name}</td>
                        <td className="px-3 py-2">{e.contact ?? '-'}</td>
                        <td className="px-3 py-2">{e.designation}</td>
                        <td className="px-3 py-2">{e.status}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button
                              className="bg-sky-900 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-sky-800"
                              type="button"
                              onClick={() => beginEdit(e)}
                            >
                              Edit
                            </button>
                            <button
                              className="bg-gray-700 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-gray-600"
                              type="button"
                              onClick={() => void toggleStatus(e)}
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
          <div className="w-full max-w-xl rounded-lg bg-white shadow-2xl overflow-hidden">
            <div className="bg-sky-900 text-white px-6 py-3 flex items-center justify-between">
              <div className="font-semibold">Edit Employee</div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm" value={editName} onChange={(ev) => setEditName(ev.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm" value={editContact} onChange={(ev) => setEditContact(ev.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white" value={editDesignation} onChange={(ev) => setEditDesignation(ev.target.value as any)}>
                  <option value="SALESMAN">Salesman</option>
                  <option value="OFFICE_STAFF">Office Staff</option>
                  <option value="DRIVER">Driver</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white" value={editStatus} onChange={(ev) => setEditStatus(ev.target.value === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')}>
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

