'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { apiFetch } from '@/lib/api';

export default function SetProductPricePage() {
  const [customers, setCustomers] = useState<Array<{ id: number; code: string; name: string; address: string | null; status: 'ACTIVE' | 'INACTIVE' }>>([]);
  const [products, setProducts] = useState<Array<{ id: number; name: string; price: number }>>([]);
  const [customerPrices, setCustomerPrices] = useState<Array<{ productId: number; price: number; effectiveFrom: string }>>([]);

  const [searchCustomerCode, setSearchCustomerCode] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const [productId, setProductId] = useState<string>('');
  const [price, setPrice] = useState<string>('0');
  const [effectiveFrom, setEffectiveFrom] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const [customersRes, productsRes] = await Promise.all([
        apiFetch<{ success: true; customers: any[] }>('/api/customers'),
        apiFetch<{ success: true; products: Array<{ id: number; name: string; price: number }> }>('/api/products'),
      ]);

      setCustomers(
        customersRes.customers.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          address: c.address ?? null,
          status: c.status,
        })),
      );
      setProducts(productsRes.products.map((p) => ({ id: p.id, name: p.name, price: Number(p.price ?? 0) })));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load page');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCustomerPrices = useCallback(async (customerId: number) => {
    const res = await apiFetch<{ success: true; prices: Array<{ productId: number; price: number; effectiveFrom: string }> }>(
      `/api/customer-product-prices?customerId=${customerId}`,
    );
    // Reduce to latest per product
    const latest = new Map<number, { productId: number; price: number; effectiveFrom: string }>();
    for (const p of res.prices) {
      if (!latest.has(p.productId)) latest.set(p.productId, p);
    }
    setCustomerPrices(Array.from(latest.values()));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeCustomers = useMemo(() => customers.filter((c) => c.status !== 'INACTIVE'), [customers]);
  const selectedCustomer = useMemo(
    () => (selectedCustomerId ? activeCustomers.find((c) => c.id === selectedCustomerId) ?? null : null),
    [activeCustomers, selectedCustomerId],
  );

  const customerPriceMap = useMemo(() => {
    const m = new Map<number, { price: number; effectiveFrom: string }>();
    for (const p of customerPrices) m.set(p.productId, { price: p.price, effectiveFrom: p.effectiveFrom });
    return m;
  }, [customerPrices]);

  const shownProducts = useMemo(() => {
    return products.map((p) => {
      const cp = selectedCustomerId ? customerPriceMap.get(p.id) : undefined;
      return {
        ...p,
        customerPrice: cp?.price ?? null,
        effectiveFrom: cp?.effectiveFrom ?? null,
        finalPrice: cp?.price ?? p.price ?? 0,
        source: cp ? 'CUSTOMER' : 'DEFAULT',
      };
    });
  }, [customerPriceMap, products, selectedCustomerId]);

  const pickCustomerByCode = () => {
    const q = searchCustomerCode.trim().toLowerCase();
    if (!q) return;
    const found = activeCustomers.find((c) => c.code.toLowerCase() === q) ?? null;
    if (!found) {
      setError('Customer not found.');
      return;
    }
    setSelectedCustomerId(found.id);
    setError(null);
    setMessage(null);
    void loadCustomerPrices(found.id);
  };

  const setOrUpdate = async () => {
    if (!selectedCustomerId) {
      setError('Select a customer first.');
      return;
    }
    const pid = Number(productId);
    const pr = Number(price);
    if (!Number.isInteger(pid) || pid <= 0) {
      setError('Select product.');
      return;
    }
    if (!Number.isFinite(pr) || pr < 0) {
      setError('Enter valid price.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) {
      setError('Invalid effective date.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setMessage(null);
      await apiFetch('/api/customer-product-prices', {
        method: 'POST',
        body: JSON.stringify({
          customerId: selectedCustomerId,
          productId: pid,
          price: pr,
          effectiveFrom,
        }),
      });
      setMessage('Customer-wise product price saved.');
      setProductId('');
      setPrice('0');
      await loadCustomerPrices(selectedCustomerId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save price');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Set Product Price" subtitle="Set customer-wise product pricing (overrides default price)." />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SectionCard title="Set / Update Customer-wise Price">
              {error ? (
                <div className="mb-3 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              ) : null}
              {message ? (
                <div className="mb-3 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>
              ) : null}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                    value={selectedCustomerId ? String(selectedCustomerId) : ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      const id = v ? Number(v) : null;
                      setSelectedCustomerId(id && Number.isInteger(id) ? id : null);
                      setMessage(null);
                      setError(null);
                      if (id) void loadCustomerPrices(id);
                    }}
                    disabled={isLoading}
                  >
                    <option value="">Select Customer</option>
                    {activeCustomers.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Or search by Customer Code</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                      placeholder="CUST-001"
                      value={searchCustomerCode}
                      onChange={(e) => setSearchCustomerCode(e.target.value)}
                    />
                    <button className="bg-red-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-red-500" type="button" onClick={pickCustomerByCode}>
                      Search
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
                    <select
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      disabled={isLoading || !selectedCustomerId}
                    >
                      <option value="">Select Product</option>
                      {products.map((p) => (
                        <option key={p.id} value={String(p.id)}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                      <input className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm" value={price} onChange={(e) => setPrice(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Effective From</label>
                      <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
                    </div>
                  </div>

                  <button
                    className="w-full bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800 disabled:opacity-60"
                    type="button"
                    onClick={() => void setOrUpdate()}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Customer Price'}
                  </button>
                </div>
              </div>
            </SectionCard>

            <div className="lg:col-span-2">
              <SectionCard title="Customer Products & Prices" description="Default price vs customer price override.">
                <div className="border border-gray-200 rounded-lg p-4 space-y-2 mb-4">
                  <h2 className="text-sm font-semibold text-gray-800">Customer Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Customer</label>
                      <input className="w-full border border-gray-300 rounded px-2 py-2 text-sm" value={selectedCustomer ? `${selectedCustomer.code}` : ''} readOnly />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                      <input className="w-full border border-gray-300 rounded px-2 py-2 text-sm" value={selectedCustomer?.name ?? ''} readOnly />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                      <input className="w-full border border-gray-300 rounded px-2 py-2 text-sm" value={selectedCustomer?.address ?? ''} readOnly />
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-sky-900 text-white">
                      <tr>
                        <th className="px-3 py-2 text-left w-12">SNO</th>
                        <th className="px-3 py-2 text-left">Product</th>
                        <th className="px-3 py-2 text-left w-28">Default</th>
                        <th className="px-3 py-2 text-left w-28">Customer</th>
                        <th className="px-3 py-2 text-left w-28">Final</th>
                        <th className="px-3 py-2 text-left w-24">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {shownProducts.length === 0 ? (
                        <tr>
                          <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                            No products.
                          </td>
                        </tr>
                      ) : (
                        shownProducts.map((p, idx) => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">{idx + 1}</td>
                            <td className="px-3 py-2">{p.name}</td>
                            <td className="px-3 py-2">{p.price}</td>
                            <td className="px-3 py-2">{p.customerPrice ?? '-'}</td>
                            <td className="px-3 py-2">{p.finalPrice}</td>
                            <td className="px-3 py-2">{selectedCustomerId ? p.source : '-'}</td>
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

      <Footer />
    </main>
  );
}

