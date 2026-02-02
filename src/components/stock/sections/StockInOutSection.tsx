'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';

type ProductOption = { id: number; name: string };
type SalesmanOption = { id: number; code: string; name: string; designation: string; status: 'ACTIVE' | 'INACTIVE' };

type MovementRow = {
  id: number;
  date: string;
  movementType: string;
  productName: string;
  qty: number;
  remarks: string | null;
  fromEmployeeId: number | null;
  fromEmployeeName: string | null;
  toEmployeeId: number | null;
  toEmployeeName: string | null;
};

export default function StockInOutSection() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [salesmen, setSalesmen] = useState<SalesmanOption[]>([]);
  const [entries, setEntries] = useState<MovementRow[]>([]);

  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [employeeId, setEmployeeId] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [qty, setQty] = useState<string>('0');
  const [status, setStatus] = useState<'IN' | 'OUT' | 'RETURN'>('OUT');
  const [remarks, setRemarks] = useState<string>('');

  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const [productsRes, employeesRes, movementsRes] = await Promise.all([
        apiFetch<{ success: true; products: ProductOption[] }>('/api/products'),
        apiFetch<{ success: true; employees: SalesmanOption[] }>('/api/employees'),
        apiFetch<{ success: true; movements: MovementRow[] }>(
          `/api/stock/movements?movementType=${status}&limit=200`,
        ),
      ]);
      setProducts(productsRes.products);
      setSalesmen(employeesRes.employees.filter((e) => e.designation === 'SALESMAN'));
      setEntries(movementsRes.movements);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load stock movements');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const salesmanOptions = useMemo(() => salesmen.filter((s) => s.status !== 'INACTIVE'), [salesmen]);

  const resetForm = () => {
    setEmployeeId('');
    setProductId('');
    setQty('0');
    setStatus('OUT');
    setRemarks('');
    setMessage(null);
    setError(null);
  };

  const save = async () => {
    const eid = Number(employeeId);
    const pid = Number(productId);
    const q = Math.floor(Number(qty));
    if (!Number.isInteger(eid) || eid <= 0) {
      setError('Select account / salesman.');
      return;
    }
    if (!Number.isInteger(pid) || pid <= 0) {
      setError('Select product.');
      return;
    }
    if (!Number.isInteger(q) || q <= 0) {
      setError('Enter valid qty.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setMessage(null);
      await apiFetch('/api/stock/movements', {
        method: 'POST',
        body: JSON.stringify({
          occurredOn: date,
          movementType: status,
          productId: pid,
          qty: q,
          employeeId: eid,
          remarks: remarks.trim() || null,
        }),
      });
      setMessage('Stock movement saved.');
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save stock movement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyFilter = async () => {
    try {
      setError(null);
      const qs = new URLSearchParams();
      qs.set('movementType', status);
      qs.set('limit', '200');
      if (filterEmployeeId) qs.set('employeeId', filterEmployeeId);
      if (filterDate) {
        qs.set('from', filterDate);
        qs.set('to', filterDate);
      }
      const res = await apiFetch<{ success: true; movements: MovementRow[] }>(`/api/stock/movements?${qs.toString()}`);
      setEntries(res.movements);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to filter movements');
    }
  };

  return (
    <div>
      <div id="stock/in-out" className="relative -top-24 h-0" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800 mb-2">Stock IN / OUT</h3>
          {error ? (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}
          {message ? (
            <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>
          ) : null}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date:</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account / Salesman:</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              disabled={isLoading}
            >
              <option>Select Account</option>
              {salesmanOptions.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product:</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              disabled={isLoading}
            >
              <option>Select Product</option>
              {products.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qty:</label>
              <input
                className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status:</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
                <option value="RETURN">RETURN</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks:</label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
          <div className="space-y-3 pt-2">
            <button
              className="w-full bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800 disabled:opacity-60"
              type="button"
              onClick={() => void save()}
              disabled={isSubmitting}
            >
              Save Entry
            </button>
            <button className="w-full bg-red-600 text-white py-2 rounded text-sm font-semibold hover:bg-red-500" type="button" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end md:space-x-4 space-y-4 md:space-y-0">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Account / Salesman:</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={filterEmployeeId}
                onChange={(e) => setFilterEmployeeId(e.target.value)}
                disabled={isLoading}
              >
                <option value="">All</option>
                {salesmanOptions.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date:</label>
              <input
                type="date"
                className="w-48 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <button className="bg-red-600 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-red-500" type="button" onClick={() => void applyFilter()}>
              Filter
            </button>
          </div>

          <div className="border border-gray-200 rounded overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-sky-900 text-white">
                <tr>
                  <th className="px-3 py-2 text-left w-12">SNO</th>
                  <th className="px-3 py-2 text-left w-32">Date</th>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-left w-20">Qty</th>
                  <th className="px-3 py-2 text-left w-24">Status</th>
                  <th className="px-3 py-2 text-left w-32">Account</th>
                  <th className="px-3 py-2 text-left w-40">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                      Loading...
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                      No stock movements yet.
                    </td>
                  </tr>
                ) : (
                  entries.map((e, idx) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{idx + 1}</td>
                      <td className="px-3 py-2">{e.date}</td>
                      <td className="px-3 py-2">{e.productName}</td>
                      <td className="px-3 py-2">{e.qty}</td>
                      <td className="px-3 py-2">{e.movementType}</td>
                      <td className="px-3 py-2">{e.toEmployeeName ?? e.fromEmployeeName ?? '-'}</td>
                      <td className="px-3 py-2">{e.remarks ?? '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

