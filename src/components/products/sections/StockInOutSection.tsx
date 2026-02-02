export default function StockInOutSection() {
  const entries: Array<{
    id: string;
    date: string;
    product: string;
    qty: number;
    status: string;
    salesman: string;
    remarks: string;
  }> = [];

  return (
    <div>
      <div id="products/stock-inout" className="relative -top-24 h-0" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800 mb-2">Stock IN / OUT</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date:</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salesman:</label>
            <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500">
              <option>Select Salesman</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product:</label>
            <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500">
              <option>Select Product</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qty:</label>
              <input className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status:</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                <option>Select Status</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks:</label>
            <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div className="space-y-3 pt-2">
            <button className="w-full bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800">
              Set New Stock
            </button>
            <button className="w-full bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800">
              Update Stock
            </button>
            <button className="w-full bg-red-600 text-white py-2 rounded text-sm font-semibold hover:bg-red-500">
              Cancel
            </button>
          </div>
        </div>

        {/* Right filter + table */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end md:space-x-4 space-y-4 md:space-y-0">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Salesman:</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                <option>All Salesman</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date:</label>
              <input
                type="date"
                className="w-48 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <button className="bg-red-600 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-red-500">
              Select
            </button>
          </div>
          <div className="border border-gray-200 rounded overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-sky-900 text-white">
                <tr>
                  <th className="px-3 py-2 text-left w-12">SNO</th>
                  <th className="px-3 py-2 text-left w-32">Date</th>
                  <th className="px-3 py-2 text-left">Product Name</th>
                  <th className="px-3 py-2 text-left w-20">Qty</th>
                  <th className="px-3 py-2 text-left w-24">Status</th>
                  <th className="px-3 py-2 text-left w-32">Salesman</th>
                  <th className="px-3 py-2 text-left w-40">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.length === 0 ? (
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
                      <td className="px-3 py-2">{e.product}</td>
                      <td className="px-3 py-2">{e.qty}</td>
                      <td className="px-3 py-2">{e.status}</td>
                      <td className="px-3 py-2">{e.salesman}</td>
                      <td className="px-3 py-2">{e.remarks}</td>
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

