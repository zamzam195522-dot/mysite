'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';
import { useEffect, useState } from 'react';

export default function AddCustomerPage() {
  const [areas, setAreas] = useState<Array<{ id: number; name: string; status: 'ACTIVE' | 'INACTIVE' }>>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [areaId, setAreaId] = useState<string>('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [requiredBottles, setRequiredBottles] = useState('0');
  const [securityDeposit, setSecurityDeposit] = useState('0');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const loadAreas = async () => {
    try {
      setError(null);
      setIsLoadingAreas(true);
      const res = await apiFetch<{ success: true; areas: Array<{ id: number; name: string; status: 'ACTIVE' | 'INACTIVE' }> }>(
        '/api/areas',
      );
      setAreas(res.areas);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load areas');
    } finally {
      setIsLoadingAreas(false);
    }
  };

  useEffect(() => {
    void loadAreas();
  }, []);

  const reset = () => {
    setName('');
    setContact('');
    setAreaId('');
    setDeliveryDays('');
    setRequiredBottles('0');
    setSecurityDeposit('0');
    setOpeningBalance('0');
    setStatus('ACTIVE');
    setUsername('');
    setPassword('');
    setError(null);
    setMessage(null);
  };

  const save = async () => {
    const n = name.trim();
    if (!n) {
      setError('Please enter customer name.');
      return;
    }

    const rb = Number(requiredBottles);
    const sd = Number(securityDeposit);
    const ob = Number(openingBalance);

    if (!Number.isFinite(rb) || rb < 0 || !Number.isFinite(sd) || sd < 0 || !Number.isFinite(ob)) {
      setError('Please enter valid numeric values.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setMessage(null);

      await apiFetch('/api/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: n,
          contact: contact.trim() || null,
          areaId: areaId.trim() === '' ? null : Number(areaId),
          deliveryDays: deliveryDays.trim() || null,
          requiredBottles: rb,
          securityDeposit: sd,
          openingBalance: ob,
          status,
          username: username.trim() || undefined,
          password: password || undefined,
        }),
      });

      setMessage('Customer saved successfully.');
      reset();
      await loadAreas();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Add Customer" subtitle="Create customer profile, delivery settings, deposit, and opening balance." />

          <SectionCard title="Customer Information">
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
                  placeholder="Customer Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="+91..."
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                  disabled={isLoadingAreas}
                >
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
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="e.g. Mon, Wed, Fri"
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Bottles</label>
                <input
                  className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm"
                  value={requiredBottles}
                  onChange={(e) => setRequiredBottles(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit</label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance</label>
                <input
                  className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
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
                Save Customer
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Login for Mobile App" description="Optional: enable customer login credentials.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </SectionCard>

            <SectionCard title="Quick Actions">
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="/customers/manage" className="flex-1 bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800 text-center">
                  Manage Customers
                </a>
                <a href="/customers/ledger" className="flex-1 bg-gray-800 text-white py-2 rounded text-sm font-semibold hover:bg-gray-700 text-center">
                  Open Ledger
                </a>
              </div>
            </SectionCard>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

