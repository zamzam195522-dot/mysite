export default function FillingStockSection() {
  const products: Array<{
    id: string;
    name: string;
    price: number;
    type: string;
    filling: number;
    empty: number;
    total: number;
  }> = [];

  return (
    <div>
      {/* Anchor for dropdown link */}
      <div id="products/filling-stock" className="relative -top-24 h-0" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Add Filling Stock</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name:</label>
              <input
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="19 LTR"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filling Stock Quantity:</label>
              <input
                className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date:</label>
              <input
                type="date"
                className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="space-y-3 pt-2">
              <button className="w-full bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800">
                Update New Filling Stock
              </button>
              <button className="w-full bg-red-600 text-white py-2 rounded text-sm font-semibold hover:bg-red-500">
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Right table */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
          <h3 className="font-semibold text-gray-800 mb-4">Filling Stock Detail</h3>
          <div className="border border-gray-200 rounded overflow-x-auto flex-1">
            <table className="min-w-full text-sm">
              <thead className="bg-sky-900 text-white">
                <tr>
                  <th className="px-3 py-2 text-left w-12">SNO</th>
                  <th className="px-3 py-2 text-left">Product Name</th>
                  <th className="px-3 py-2 text-left w-20">Price</th>
                  <th className="px-3 py-2 text-left w-32">Bottle Type</th>
                  <th className="px-3 py-2 text-left w-24">Filling Stock</th>
                  <th className="px-3 py-2 text-left w-24">Empty Stock</th>
                  <th className="px-3 py-2 text-left w-24">Total Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                      No stock records yet.
                    </td>
                  </tr>
                ) : (
                  products.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{idx + 1}</td>
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2">{row.price}</td>
                      <td className="px-3 py-2">{row.type}</td>
                      <td className="px-3 py-2">{row.filling}</td>
                      <td className="px-3 py-2">{row.empty}</td>
                      <td className="px-3 py-2">{row.total}</td>
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

