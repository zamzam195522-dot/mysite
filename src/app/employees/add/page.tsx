'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';
import { useState } from 'react';

export default function AddEmployeePage() {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [designation, setDesignation] = useState<'SALESMAN' | 'OFFICE_STAFF' | 'DRIVER' | 'OTHER'>('SALESMAN');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setContact('');
    setDesignation('SALESMAN');
    setStatus('ACTIVE');
    setUsername('');
    setPassword('');
    setError(null);
    setMessage(null);
  };

  const save = async () => {
    const n = name.trim();
    if (!n) {
      setError('Please enter employee name.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setMessage(null);
      await apiFetch('/api/employees', {
        method: 'POST',
        body: JSON.stringify({
          name: n,
          contact: contact.trim() || null,
          designation,
          status,
          username: username.trim() || undefined,
          password: password || undefined,
        }),
      });
      setMessage('Employee saved successfully.');
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Add Employee" subtitle="Create employee account and login credentials." />

          <SectionCard title="Employee Details">
            {error ? (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            {message ? (
              <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="Employee name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="+92..."
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                  value={designation}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === 'DRIVER') setDesignation('DRIVER');
                    else if (v === 'OFFICE_STAFF') setDesignation('OFFICE_STAFF');
                    else if (v === 'OTHER') setDesignation('OTHER');
                    else setDesignation('SALESMAN');
                  }}
                >
                  <option value="SALESMAN">Salesman</option>
                  <option value="OFFICE_STAFF">Office Staff</option>
                  <option value="DRIVER">Driver</option>
                  <option value="OTHER">Other</option>
                </select>
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

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Name</label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="Username (optional)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="Password (optional)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                Save Employee
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
        </div>
      </section>
      <Footer />
    </main>
  );
}

