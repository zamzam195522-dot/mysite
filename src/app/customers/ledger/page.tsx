import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CustomerLedgerPage() {
  const ledgerRows: Array<{
    id: string;
    orderDate: string;
    invoice: string;
    billNo: string;
    product: string;
    price: number;
    saleQty: number;
    returnQty: number;
    amount: number;
    payment: number;
  }> = [];

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <section className="py-10">
        <div className="container mx-auto px-4 bg-white rounded-xl shadow-md border border-gray-200 p-6 space-y-6">
          <h1 className="text-2xl font-bold text-sky-900">CUSTOMER LEDGER</h1>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left: Generate Customer Ledger */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="font-semibold text-gray-800">Generate Customer Ledger</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer ID
                </label>
                <div className="flex space-x-2">
                  <input
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Customer ID"
                  />
                  <button className="bg-red-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-red-500">
                    Search
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ledger Type
                </label>
                <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                  <option>Select Ledger</option>
                </select>
              </div>
            </div>

            {/* Right: Details, table, totals */}
            <div className="lg:col-span-3 space-y-4">
              {/* Customer detail + balances */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-800">Customer Detail</p>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Customer ID
                    </label>
                    <input className="w-full border border-gray-300 rounded px-2 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input className="w-full border border-gray-300 rounded px-2 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input className="w-full border border-gray-300 rounded px-2 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Contact #
                    </label>
                    <input className="w-full border border-gray-300 rounded px-2 py-2 text-sm" />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-800">Security / Outstanding</p>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Security Balance
                    </label>
                    <input className="w-full border border-gray-300 rounded px-2 py-2 text-sm" defaultValue="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Outstanding Bottle
                    </label>
                    <input className="w-full border border-gray-300 rounded px-2 py-2 text-sm" defaultValue="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Outstanding Balance
                    </label>
                    <input className="w-full border border-gray-300 rounded px-2 py-2 text-sm" defaultValue="0" />
                  </div>
                </div>
              </div>

              {/* Ledger table */}
              <div className="border border-gray-200 rounded overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-sky-900 text-white">
                    <tr>
                      <th className="px-3 py-2 text-left w-10">No</th>
                      <th className="px-3 py-2 text-left w-32">Order Date</th>
                      <th className="px-3 py-2 text-left w-24">Invoice</th>
                      <th className="px-3 py-2 text-left w-24">Bill No</th>
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2 text-left w-20">Price</th>
                      <th className="px-3 py-2 text-left w-24">Sale Qty</th>
                      <th className="px-3 py-2 text-left w-32">Return 19 LTR Qty</th>
                      <th className="px-3 py-2 text-left w-24">Amount</th>
                      <th className="px-3 py-2 text-left w-24">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {ledgerRows.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-gray-500" colSpan={10}>
                          No ledger entries yet.
                        </td>
                      </tr>
                    ) : (
                      ledgerRows.map((r, idx) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">{idx + 1}</td>
                          <td className="px-3 py-2">{r.orderDate}</td>
                          <td className="px-3 py-2">{r.invoice}</td>
                          <td className="px-3 py-2">{r.billNo}</td>
                          <td className="px-3 py-2">{r.product}</td>
                          <td className="px-3 py-2">{r.price}</td>
                          <td className="px-3 py-2">{r.saleQty}</td>
                          <td className="px-3 py-2">{r.returnQty}</td>
                          <td className="px-3 py-2">{r.amount}</td>
                          <td className="px-3 py-2">{r.payment}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals row */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                  <div>
                    <label className="block font-medium text-gray-700 mb-0.5">
                      Total Sale Water Bottle
                    </label>
                    <input className="w-full border border-gray-300 rounded px-2 py-1.5" defaultValue="0" />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-0.5">
                      Total Return Empty Bottle
                    </label>
                    <input className="w-full border border-gray-300 rounded px-2 py-1.5" defaultValue="0" />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-0.5">
                      Bottle Balance
                    </label>
                    <input className="w-full border border-gray-300 rounded px-2 py-1.5" defaultValue="0" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div>
                    <label className="block font-medium text-gray-700 mb-0.5">
                      Billing Amount
                    </label>
                    <input className="w-full border border-green-300 bg-green-50 rounded px-2 py-1.5" defaultValue="0" />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-0.5">
                      Total Amount
                    </label>
                    <input className="w-full border border-gray-300 rounded px-2 py-1.5" defaultValue="0" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div>
                    <label className="block font-medium text-gray-700 mb-0.5">
                      Payment Received
                    </label>
                    <input className="w-full border border-gray-300 rounded px-2 py-1.5" defaultValue="0" />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-0.5">
                      Tax / Discount
                    </label>
                    <input className="w-full border border-yellow-300 bg-yellow-50 rounded px-2 py-1.5" defaultValue="0" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div>
                    <label className="block font-medium text-gray-700 mb-0.5">
                      Balance
                    </label>
                    <input className="w-full border border-red-300 bg-red-50 rounded px-2 py-1.5" defaultValue="0" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

