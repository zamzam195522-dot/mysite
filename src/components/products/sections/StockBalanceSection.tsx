export default function StockBalanceSection() {
  const balances: Array<{ id: string; name: string; price: number; type: string }> = [];

  return (
    <div>
      <div id="products/stock-balance" className="relative -top-24 h-0" />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Total Stock Balance</h3>
        <div className="border border-gray-200 rounded overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-sky-900 text-white">
              <tr>
                <th className="px-3 py-2 text-left w-12">SNO</th>
                <th className="px-3 py-2 text-left">Product Name</th>
                <th className="px-3 py-2 text-left w-20">Price</th>
                <th className="px-3 py-2 text-left w-32">Bottle Type</th>
                <th className="px-3 py-2 text-left w-40">Filling Stock in Warehouse</th>
                <th className="px-3 py-2 text-left w-40">Empty Stock in Warehouse</th>
                <th className="px-3 py-2 text-left w-40">Total Stock in Warehouse</th>
                <th className="px-3 py-2 text-left w-32">Total Damage Stock</th>
                <th className="px-3 py-2 text-left w-40">Total Stock in Market</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {balances.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={9}>
                    No stock balance yet.
                  </td>
                </tr>
              ) : (
                balances.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{idx + 1}</td>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">{row.price}</td>
                    <td className="px-3 py-2">{row.type}</td>
                    <td className="px-3 py-2">0</td>
                    <td className="px-3 py-2">0</td>
                    <td className="px-3 py-2">0</td>
                    <td className="px-3 py-2">0</td>
                    <td className="px-3 py-2">0</td>
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

