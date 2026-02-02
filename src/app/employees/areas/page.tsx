'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';
import { useEffect, useState } from 'react';

export default function AreasManagementPage() {
  const [areas, setAreas] = useState<Array<{ id: number; name: string; status: 'ACTIVE' | 'INACTIVE' }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editing, setEditing] = useState<{ id: number; name: string; status: 'ACTIVE' | 'INACTIVE' } | null>(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const res = await apiFetch<{ success: true; areas: Array<{ id: number; name: string; status: 'ACTIVE' | 'INACTIVE' }> }>(
        '/api/areas',
      );
      setAreas(res.areas);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load areas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setName('');
    setStatus('ACTIVE');
  };

  const saveArea = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter area name.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await apiFetch<{ success: true; area: { id: number; name: string; status: 'ACTIVE' | 'INACTIVE' } }>(
        '/api/areas',
        { method: 'POST', body: JSON.stringify({ name: trimmed, status }) },
      );
      setAreas((prev) => [res.area, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save area');
    } finally {
      setIsSubmitting(false);
    }
  };

  const beginEdit = (a: { id: number; name: string; status: 'ACTIVE' | 'INACTIVE' }) => {
    setEditing(a);
    setEditName(a.name);
    setEditStatus(a.status);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditName('');
    setEditStatus('ACTIVE');
  };

  const saveEdit = async () => {
    if (!editing) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      setError('Please enter area name.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const res = await apiFetch<{ success: true; area: { id: number; name: string; status: 'ACTIVE' | 'INACTIVE' } }>(
        `/api/areas/${editing.id}`,
        { method: 'PATCH', body: JSON.stringify({ name: trimmed, status: editStatus }) },
      );
      setAreas((prev) => prev.map((x) => (x.id === editing.id ? res.area : x)).sort((a, b) => a.name.localeCompare(b.name)));
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update area');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteArea = async (a: { id: number; name: string }) => {
    const ok = window.confirm(`Delete "${a.name}"? (This will deactivate it)`);
    if (!ok) return;
    try {
      setError(null);
      await apiFetch(`/api/areas/${a.id}`, { method: 'DELETE' });
      setAreas((prev) => prev.filter((x) => x.id !== a.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete area');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Areas Management" subtitle="Create and manage delivery areas for employee assignments." />

          {error ? (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Add Area">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area Name</label>
                  <input
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    placeholder="e.g. North Zone"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                  onClick={() => void saveArea()}
                  disabled={isSubmitting}
                >
                  Save Area
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

            <SectionCard title="Area List">
              <div className="border border-gray-200 rounded overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-sky-900 text-white">
                    <tr>
                      <th className="px-3 py-2 text-left w-12">SNO</th>
                      <th className="px-3 py-2 text-left">Area</th>
                      <th className="px-3 py-2 text-left w-24">Status</th>
                      <th className="px-3 py-2 text-left w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-gray-500" colSpan={4}>
                          Loading...
                        </td>
                      </tr>
                    ) : areas.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-gray-500" colSpan={4}>
                          No areas yet.
                        </td>
                      </tr>
                    ) : (
                      areas.map((a, idx) => (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">{idx + 1}</td>
                          <td className="px-3 py-2">{a.name}</td>
                          <td className="px-3 py-2">{a.status}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                className="bg-sky-900 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-sky-800"
                                type="button"
                                onClick={() => beginEdit(a)}
                              >
                                Edit
                              </button>
                              <button
                                className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-red-500"
                                type="button"
                                onClick={() => void deleteArea(a)}
                              >
                                Delete
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
              <div className="font-semibold">Edit Area</div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Area Name</label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  className="flex-1 bg-gray-600 text-white py-2 rounded text-sm font-semibold hover:bg-gray-500"
                  type="button"
                  onClick={cancelEdit}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800 disabled:opacity-60"
                  type="button"
                  onClick={() => void saveEdit()}
                  disabled={isSaving}
                >
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
