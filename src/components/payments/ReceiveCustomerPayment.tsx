'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';

type CustomerRow = { id: number; code: string; name: string; address: string | null; contact: string | null; status: 'ACTIVE' | 'INACTIVE' };
type EmployeeRow = { id: number; code: string; name: string; designation: string; status: 'ACTIVE' | 'INACTIVE' };
type BankRow = { id: number; name: string; accountNumber: string; status: 'ACTIVE' | 'INACTIVE' };

export default function ReceiveCustomerPayment() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [banks, setBanks] = useState<BankRow[]>([]);

  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const [method, setMethod] = useState<'CASH' | 'BANK' | 'CHEQUE'>('CASH');
  const [bankId, setBankId] = useState<string>('');
  const [receiverEmployeeId, setReceiverEmployeeId] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState<string>('Daily Cash');
  const [receivedAmount, setReceivedAmount] = useState<string>('0');
  const [discountTaxAmount, setDiscountTaxAmount] = useState<string>('0');
  const [chequeNo, setChequeNo] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const [customersRes, employeesRes, banksRes] = await Promise.all([
        apiFetch<{ success: true; customers: any[] }>('/api/customers'),
        apiFetch<{ success: true; employees: EmployeeRow[] }>('/api/employees'),
        apiFetch<{ success: true; banks: any[] }>('/api/banks'),
      ]);

      setCustomers(
        customersRes.customers.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          address: c.address ?? null,
          contact: c.contact ?? null,
          status: c.status,
        })),
      );
      setEmployees(employeesRes.employees);
      setBanks(
        banksRes.banks.map((b) => ({
          id: b.id,
          name: b.name,
          accountNumber: b.accountNumber,
          status: b.status,
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load payment screen data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = customers.filter((c) => c.status !== 'INACTIVE');
    if (!q) return list;
    return list.filter((c) => `${c.code} ${c.name} ${c.address ?? ''}`.toLowerCase().includes(q));
  }, [customers, search]);

  const selectedCustomer = useMemo(
    () => (selectedCustomerId ? customers.find((c) => c.id === selectedCustomerId) ?? null : null),
    [customers, selectedCustomerId],
  );

  const receiverOptions = useMemo(
    () => employees.filter((e) => e.status !== 'INACTIVE'),
    [employees],
  );

  const bankOptions = useMemo(
    () => banks.filter((b) => b.status !== 'INACTIVE'),
    [banks],
  );

  const reset = () => {
    setMethod('CASH');
    setBankId('');
    setReceiverEmployeeId('');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMode('Daily Cash');
    setReceivedAmount('0');
    setDiscountTaxAmount('0');
    setChequeNo('');
    setRemarks('');
    setMessage(null);
    setError(null);
  };

  const save = async () => {
    if (!selectedCustomerId) {
      setError('Select a customer from the list first.');
      return;
    }

    const received = Number(receivedAmount);
    const disc = Number(discountTaxAmount);
    if (!Number.isFinite(received) || received < 0 || !Number.isFinite(disc)) {
      setError('Enter valid amounts.');
      return;
    }

    const bank = bankId.trim() === '' ? null : Number(bankId.trim());
    const receiver = receiverEmployeeId.trim() === '' ? null : Number(receiverEmployeeId.trim());

    try {
      setIsSaving(true);
      setError(null);
      setMessage(null);

      await apiFetch('/api/customer-payments', {
        method: 'POST',
        body: JSON.stringify({
          customerId: selectedCustomerId,
          receiverEmployeeId: receiver,
          paymentDate,
          method,
          bankId: bank,
          chequeNo: chequeNo.trim() || null,
          paymentMode: paymentMode.trim() || null,
          receivedAmount: received,
          discountTaxAmount: disc,
          remarks: remarks.trim() || null,
        }),
      });

      setMessage('Payment saved.');
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save payment');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-white rounded-xl shadow-md border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Payment Entry</h2>

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}
        {message ? (
          <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account #</label>
            <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm" value={selectedCustomer?.code ?? ''} readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm" value={selectedCustomer?.name ?? ''} readOnly />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Receiver</label>
          <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white" value={receiverEmployeeId} onChange={(e) => setReceiverEmployeeId(e.target.value)} disabled={isLoading}>
            <option value="">Select Receiver</option>
            {receiverOptions.map((e) => (
              <option key={e.id} value={String(e.id)}>
                {e.code} — {e.name} ({e.designation})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-700">
          {(['CASH', 'BANK', 'CHEQUE'] as const).map((m) => (
            <label key={m} className="inline-flex items-center gap-2">
              <input type="radio" name="paymentType" checked={method === m} onChange={() => setMethod(m)} />
              {m}
            </label>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank</label>
          <select className="w-full border border-green-300 bg-green-50 rounded px-3 py-2 text-sm" value={bankId} onChange={(e) => setBankId(e.target.value)} disabled={isLoading || method === 'CASH'}>
            <option value="">Select</option>
            {bankOptions.map((b) => (
              <option key={b.id} value={String(b.id)}>
                {b.name} ({b.accountNumber})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
            <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
            <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} placeholder="e.g. Daily Cash" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Received</label>
            <input className="w-full border border-green-300 bg-green-50 rounded px-3 py-2 text-sm" value={receivedAmount} onChange={(e) => setReceivedAmount(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax / Discount</label>
            <input className="w-full border border-orange-300 bg-orange-50 rounded px-3 py-2 text-sm" value={discountTaxAmount} onChange={(e) => setDiscountTaxAmount(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cheque No</label>
            <input className="w-full border border-red-300 bg-red-50 rounded px-3 py-2 text-sm" value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} disabled={method !== 'CHEQUE'} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button className="flex-1 bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800 disabled:opacity-60" type="button" onClick={() => void save()} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button className="flex-1 bg-red-600 text-white py-2 rounded text-sm font-semibold hover:bg-red-500" type="button" onClick={reset}>
            Cancel
          </button>
        </div>
      </div>

      <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search By ID or Customer Name or Address</label>
          <div className="flex gap-2">
            <input className="flex-1 border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm" placeholder="Search term" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="bg-gray-700 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-gray-600" type="button" onClick={() => void load()}>
              Refresh
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-sky-900 text-white">
              <tr>
                <th className="px-3 py-2 text-left w-12">SNO</th>
                <th className="px-3 py-2 text-left w-24">Acc#</th>
                <th className="px-3 py-2 text-left">Customer Name</th>
                <th className="px-3 py-2 text-left">Address</th>
                <th className="px-3 py-2 text-left w-28">Contact</th>
                <th className="px-3 py-2 text-left w-24">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.slice(0, 200).map((c, idx) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedCustomerId === c.id ? 'bg-sky-50' : ''}`}
                    onClick={() => setSelectedCustomerId(c.id)}
                  >
                    <td className="px-3 py-2">{idx + 1}</td>
                    <td className="px-3 py-2">{c.code}</td>
                    <td className="px-3 py-2">{c.name}</td>
                    <td className="px-3 py-2">{c.address ?? '-'}</td>
                    <td className="px-3 py-2">{c.contact ?? '-'}</td>
                    <td className="px-3 py-2">{c.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

