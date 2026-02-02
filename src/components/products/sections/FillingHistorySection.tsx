export default function FillingHistorySection() {
  const historyRows: Array<{ id: string; date: string; name: string; old: number; newer: number; update: number }> = [];

  return (
    <div>
      <div id="products/filling-history" className="relative -top-24 h-0" />

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end md:space-x-4 space-y-4 md:space-y-0">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date:</label>
            <input
              type="date"
              className="w-48 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date:</label>
            <input
              type="date"
              className="w-48 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <button className="bg-red-600 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-red-500">
            Search
          </button>
        </div>

        <div className="border border-gray-200 rounded overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-sky-900 text-white">
              <tr>
                <th className="px-3 py-2 text-left w-12">SNO</th>
                <th className="px-3 py-2 text-left w-32">Date</th>
                <th className="px-3 py-2 text-left">Product Name</th>
                <th className="px-3 py-2 text-left w-24">Old Stock</th>
                <th className="px-3 py-2 text-left w-24">New Stock</th>
                <th className="px-3 py-2 text-left w-28">Update Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {historyRows.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                    No filling history yet.
                  </td>
                </tr>
              ) : (
                historyRows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{idx + 1}</td>
                    <td className="px-3 py-2">{row.date}</td>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">{row.old}</td>
                    <td className="px-3 py-2">{row.newer}</td>
                    <td className="px-3 py-2">{row.update}</td>
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

