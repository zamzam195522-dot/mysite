'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';
import { useState } from 'react';

export default function AddVendorPage() {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setContact('');
    setAddress('');
    setStatus('ACTIVE');
    setError(null);
    setMessage(null);
  };

  const save = async () => {
    const n = name.trim();
    if (!n) {
      setError('Please enter vendor name.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setMessage(null);
      await apiFetch('/api/vendors', {
        method: 'POST',
        body: JSON.stringify({
          name: n,
          contact: contact.trim() || null,
          address: address.trim() || null,
          status,
        }),
      });
      setMessage('Vendor saved successfully.');
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save vendor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Add Vendor" subtitle="Create vendor profile for purchases and payments." />

          <SectionCard title="Vendor Details">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="Vendor name"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
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

            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800 disabled:opacity-60"
                type="button"
                onClick={() => void save()}
                disabled={isSubmitting}
              >
                Save Vendor
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

