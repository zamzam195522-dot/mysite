'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { printInvoice } from '@/lib/printInvoice';

type ProductOption = { id: number; name: string };
type CustomerOption = { id: number; code: string; name: string; status: 'ACTIVE' | 'INACTIVE' };
type SalesmanOption = { id: number; code: string; name: string; status: 'ACTIVE' | 'INACTIVE' };

type LineItem = {
  productId: number;
  productName: string;
  unitPrice: number;
  saleQty: number;
  returnQty: number;
};

export default function NewOrder() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [salesmen, setSalesmen] = useState<SalesmanOption[]>([]);

  const [customerId, setCustomerId] = useState<string>('');
  const [salesmanEmployeeId, setSalesmanEmployeeId] = useState<string>('');
  const [orderDate, setOrderDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [invoiceNo, setInvoiceNo] = useState<string>('');
  const [billBookNo, setBillBookNo] = useState<string>('');

  const [productId, setProductId] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>('0');
  const [saleQty, setSaleQty] = useState<string>('0');
  const [returnQty, setReturnQty] = useState<string>('0');

  const [items, setItems] = useState<LineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK' | 'CREDIT'>('CASH');
  const [receivedAmount, setReceivedAmount] = useState<string>('');

  // Cache for resolved prices to avoid repeated API calls
  const [priceCache, setPriceCache] = useState<Map<string, { price: number; source: 'CUSTOMER' | 'DEFAULT' | 'NONE' }>>(new Map());
  const [currentPriceSource, setCurrentPriceSource] = useState<'CUSTOMER' | 'DEFAULT' | 'NONE' | null>(null);

  const load = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const [productsRes, customersRes, employeesRes] = await Promise.all([
        apiFetch<{ success: true; products: Array<{ id: number; name: string }> }>('/api/products'),
        apiFetch<{ success: true; customers: Array<{ id: number; code: string; name: string; status: 'ACTIVE' | 'INACTIVE' }> }>(
          '/api/customers',
        ),
        apiFetch<{ success: true; employees: Array<{ id: number; code: string; name: string; designation: string; status: 'ACTIVE' | 'INACTIVE' }> }>(
          '/api/employees',
        ),
      ]);

      setProducts(productsRes.products.map((p) => ({ id: p.id, name: p.name })));
      setCustomers(customersRes.customers.map((c) => ({ id: c.id, code: c.code, name: c.name, status: c.status })));
      setSalesmen(
        employeesRes.employees
          .filter((e) => e.designation === 'SALESMAN')
          .map((e) => ({ id: e.id, code: e.code, name: e.name, status: e.status })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // Clear price cache when customer changes to ensure fresh pricing
  useEffect(() => {
    // Clear all cache entries when customer changes
    setPriceCache(new Map());
    setCurrentPriceSource(null);
  }, [customerId]);

  const productNameById = useMemo(() => {
    const m = new Map<number, string>();
    products.forEach((p) => m.set(p.id, p.name));
    return m;
  }, [products]);

  const computedAmount = useMemo(() => {
    const p = Number(unitPrice);
    const q = Number(saleQty);
    if (!Number.isFinite(p) || !Number.isFinite(q)) return 0;
    return p * q;
  }, [unitPrice, saleQty]);

  const clearItem = () => {
    setProductId('');
    setUnitPrice('0');
    setSaleQty('0');
    setReturnQty('0');
  };

  const resolvePrice = async (cid: string, pid: string) => {
    if (!pid) return;

    const cacheKey = `${cid}-${pid}`;

    // Check cache first
    if (priceCache.has(cacheKey)) {
      const cached = priceCache.get(cacheKey)!;
      setUnitPrice(String(cached.price));
      setCurrentPriceSource(cached.source);
      return;
    }

    try {
      const qs = new URLSearchParams({ productId: pid });
      if (cid) qs.set('customerId', cid);
      const res = await apiFetch<{ success: true; price: number; source: 'CUSTOMER' | 'DEFAULT' | 'NONE' }>(
        `/api/pricing?${qs.toString()}`,
      );

      const priceData = { price: res.price ?? 0, source: res.source as 'CUSTOMER' | 'DEFAULT' | 'NONE' };

      // Update cache
      setPriceCache(prev => new Map(prev).set(cacheKey, priceData));

      // Update unit price and source
      setUnitPrice(String(priceData.price));
      setCurrentPriceSource(priceData.source);
    } catch {
      // ignore; user can type price manually
      setCurrentPriceSource(null);
    }
  };

  const addItem = async () => {
    const pid = Number(productId);
    const cid = customerId;
    if (!cid) {
      setError('Select customer first.');
      return;
    }
    if (!Number.isInteger(pid) || pid <= 0) {
      setError('Select product.');
      return;
    }

    const p = Number(unitPrice);
    const q = Math.floor(Number(saleQty));
    const r = Math.floor(Number(returnQty));
    if (!Number.isFinite(p) || p < 0) {
      setError('Enter valid price.');
      return;
    }
    if (!Number.isFinite(q) || q < 0 || !Number.isFinite(r) || r < 0) {
      setError('Enter valid quantities.');
      return;
    }
    if (q === 0 && r === 0) {
      setError('Enter sale qty or return qty.');
      return;
    }

    // Ensure price is populated (customer-wise)
    await resolvePrice(cid, String(pid));

    setItems((prev) => [
      ...prev,
      {
        productId: pid,
        productName: productNameById.get(pid) ?? `#${pid}`,
        unitPrice: p,
        saleQty: q,
        returnQty: r,
      },
    ]);
    clearItem();
  };

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.unitPrice * it.saleQty, 0),
    [items],
  );

  const saveBill = async () => {
    const cid = Number(customerId);
    if (!Number.isInteger(cid) || cid <= 0) {
      setError('Select customer.');
      return;
    }
    if (!orderDate) {
      setError('Select order date.');
      return;
    }
    if (items.length === 0) {
      setError('Add at least one item.');
      return;
    }
    if (paymentMethod !== 'CREDIT' && !receivedAmount) {
      setError('Enter received amount for cash/online payment.');
      return;
    }
    if (receivedAmount && Number(receivedAmount) < subtotal) {
      setError('Received amount cannot be less than total amount.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setMessage(null);

      const sid =
        salesmanEmployeeId.trim() === '' ? null : Number(salesmanEmployeeId.trim());

      const res = await apiFetch<{
        success: true;
        invoiceId: number;
        invoiceNo: string;
        invoiceData: any;
      }>(
        '/api/sales-invoices',
        {
          method: 'POST',
          body: JSON.stringify({
            customerId: cid,
            salesmanEmployeeId: sid,
            orderDate,
            invoiceNo: invoiceNo.trim() || null,
            billBookNo: billBookNo.trim() || null,
            paymentMethod,
            receivedAmount: paymentMethod !== 'CREDIT' ? Number(receivedAmount) : null,
            items: items.map((it) => ({
              productId: it.productId,
              unitPrice: it.unitPrice,
              saleQty: it.saleQty,
              returnQty: it.returnQty,
            })),
          }),
        },
      );

      setMessage(`Saved invoice ${res.invoiceNo}.`);

      // Auto-print for cash payments
      if (paymentMethod === 'CASH') {
        printInvoice(res.invoiceData);
      }

      // Reset form
      setItems([]);
      setInvoiceNo('');
      setBillBookNo('');
      setReceivedAmount('');
      setPaymentMethod('CASH');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save bill');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-200 p-6 space-y-4">
        <h1 className="text-2xl font-bold text-sky-900">NEW ORDER</h1>

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}
        {message ? (
          <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>
        ) : null}

        <div className="mt-4 border border-gray-200 rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">New Bill</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  void resolvePrice(customerId, e.target.value);
                }}
                disabled={isLoading}
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer-wise Price</label>
              <div className="relative">
                <input
                  className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                />
                {currentPriceSource && (
                  <div className={`absolute -top-2 -right-2 px-2 py-1 text-xs font-semibold rounded ${currentPriceSource === 'CUSTOMER'
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : currentPriceSource === 'DEFAULT'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-100 text-gray-800 border border-gray-300'
                    }`}>
                    {currentPriceSource}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">S-Quantity</label>
              <input
                className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={saleQty}
                onChange={(e) => setSaleQty(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">R-Quantity (19 LTR)</label>
              <input
                className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={returnQty}
                onChange={(e) => setReturnQty(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Amount</label>
              <input
                className="w-full border border-gray-300 bg-gray-100 rounded px-3 py-3 text-sm text-center"
                value={String(computedAmount)}
                readOnly
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:space-x-4 space-y-3 md:space-y-0 pt-2">
            <button className="flex-1 bg-gray-500 text-white py-2 rounded text-sm font-semibold hover:bg-gray-600" type="button" onClick={clearItem}>
              Clear Item
            </button>
            <button className="flex-1 bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800" type="button" onClick={() => void addItem()}>
              Add Item In List
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 space-y-4">
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">Billing - Customer Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Select Customer</label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  void resolvePrice(e.target.value, productId);
                }}
                disabled={isLoading}
              >
                <option value="">Select Customer</option>
                {customers
                  .filter((c) => c.status !== 'INACTIVE')
                  .map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.code} — {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Select Salesman</label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={salesmanEmployeeId}
                onChange={(e) => setSalesmanEmployeeId(e.target.value)}
                disabled={isLoading}
              >
                <option value="">Select Salesman</option>
                {salesmen
                  .filter((s) => s.status !== 'INACTIVE')
                  .map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.code} — {s.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Order Date</label>
              <input type="date" className="w-full border border-gray-300 rounded px-2 py-2 text-sm" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Invoice # (optional)</label>
              <input className="w-full border border-gray-300 rounded px-2 py-2 text-sm" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="Auto if empty" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Bill Book # (optional)</label>
              <input className="w-full border border-yellow-300 bg-yellow-50 rounded px-2 py-2 text-sm" value={billBookNo} onChange={(e) => setBillBookNo(e.target.value)} />
            </div>
            <div className="flex items-end justify-end text-sm font-semibold text-gray-800">
              Total: {subtotal}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value as 'CASH' | 'BANK' | 'CREDIT');
                  if (e.target.value === 'CREDIT') {
                    setReceivedAmount('');
                  }
                }}
              >
                <option value="CASH">Cash</option>
                <option value="BANK">Bank</option>
                <option value="CREDIT">Credit</option>
              </select>
            </div>

            {paymentMethod !== 'CREDIT' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Received Amount</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  placeholder="Enter received amount"
                  min={subtotal}
                  step="0.01"
                />
              </div>
            )}
          </div>
        </div>

        <div className="border border-gray-200 rounded overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-sky-900 text-white">
              <tr>
                <th className="px-3 py-2 text-left">Product Name</th>
                <th className="px-3 py-2 text-left w-20">Price</th>
                <th className="px-3 py-2 text-left w-24">Quantity</th>
                <th className="px-3 py-2 text-left w-28">Return Quantity</th>
                <th className="px-3 py-2 text-left w-24">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                    No items yet.
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => (
                  <tr key={`${it.productId}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{it.productName}</td>
                    <td className="px-3 py-2">{it.unitPrice}</td>
                    <td className="px-3 py-2">{it.saleQty}</td>
                    <td className="px-3 py-2">{it.returnQty}</td>
                    <td className="px-3 py-2">{it.unitPrice * it.saleQty}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col md:flex-row md:space-x-4 space-y-3 md:space-y-0 pt-2">
          <button
            className="flex-1 bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800 disabled:opacity-60"
            type="button"
            onClick={() => void saveBill()}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Bill'}
          </button>
          <button className="flex-1 bg-red-600 text-white py-2 rounded text-sm font-semibold hover:bg-red-500" type="button" onClick={() => setItems([])}>
            Clear List
          </button>
        </div>
      </div>
    </div>
  );
}

