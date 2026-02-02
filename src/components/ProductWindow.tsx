import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type ProductWindowProps = {
  onClose: () => void;
};

export default function ProductWindow({ onClose }: ProductWindowProps) {
  const [products, setProducts] = useState<Array<{ id: number; name: string; price: number; type: string | null }>>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadProducts = async () => {
    const res = await apiFetch<{ success: true; products: Array<{ id: number; name: string; price: number; type: string | null }> }>(
      '/api/products',
    );
    setProducts(res.products);
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const resetForm = () => {
    setSelectedId(null);
    setName('');
    setPrice('');
    setType('');
  };

  const handleSave = async () => {
    setMessage(null);
    if (!name || !price || !type) {
      setMessage('Please fill all fields before saving.');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify({ name, price: Number(price), type }),
      });

      setMessage('Product saved successfully.');
      resetForm();
      await loadProducts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    setMessage(null);
    if (!selectedId) {
      setMessage('Select a product row to edit first.');
      return;
    }
    if (!name || !price || !type) {
      setMessage('Please fill all fields before updating.');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiFetch(`/api/products/${selectedId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, price: Number(price), type }),
      });
      setMessage('Product updated successfully.');
      resetForm();
      await loadProducts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong while updating.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Top bar */}
        <div className="bg-sky-900 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
              <span className="text-sky-900 font-bold text-lg">DW</span>
            </div>
            <div>
              <p className="font-semibold text-sm md:text-base">
                Drinking Water Inventory Software
              </p>
              <p className="text-xs text-sky-100">User</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4 text-sm">
            {[
              'Dashboard',
              'Products',
              'Customers',
              'Vendor',
              'Employee',
              'Reports',
              'Expenditure',
              'Transaction',
              'Setting',
            ].map((item) => (
              <button
                key={item}
                className={`px-3 py-1 rounded ${
                  item === 'Products' ? 'bg-sky-700' : 'hover:bg-sky-800/60'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="ml-4 w-8 h-8 flex items-center justify-center rounded bg-sky-800 hover:bg-sky-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-sky-50">
          <h2 className="text-xl font-semibold text-sky-900 mb-4">
            NEW PRODUCT
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: form */}
            <div className="bg-white border border-gray-300 rounded-md p-4 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">New Product</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name:
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. 19 LTR"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price:
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="100"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Type:
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="" disabled>
                      Select Type
                    </option>
                    <option>19 LTR Bottle</option>
                    <option>Returnable Bottle</option>
                    <option>Disposable Bottle</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    className="bg-sky-900 text-white py-2 rounded text-sm font-medium hover:bg-sky-800"
                    type="button"
                    onClick={resetForm}
                  >
                    New Product
                  </button>
                  <button
                    className="bg-sky-900 text-white py-2 rounded text-sm font-medium hover:bg-sky-800"
                    type="button"
                    onClick={() => void loadProducts()}
                  >
                    Get (Refresh List)
                  </button>
                  <button
                    className="bg-sky-700 text-white py-2 rounded text-sm font-medium hover:bg-sky-600 disabled:opacity-60"
                    type="button"
                    onClick={handleSave}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    className="bg-sky-700 text-white py-2 rounded text-sm font-medium hover:bg-sky-600 disabled:opacity-60"
                    type="button"
                    onClick={handleUpdate}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Updating...' : 'Update'}
                  </button>
                </div>

                <button
                  className="mt-4 w-full bg-red-600 text-white py-2 rounded text-sm font-semibold hover:bg-red-500"
                  type="button"
                  onClick={() => {
                    resetForm();
                    setMessage(null);
                    void loadProducts();
                  }}
                >
                  Refresh
                </button>

                {message && (
                  <p className="mt-3 text-sm text-gray-700">
                    {message}
                  </p>
                )}
              </div>
            </div>

            {/* Right: products table */}
            <div className="bg-white border border-gray-300 rounded-md p-4 shadow-sm flex flex-col">
              <h3 className="font-semibold text-gray-800 mb-4">Products Detail</h3>
              <div className="border border-gray-200 rounded overflow-hidden flex-1">
                <table className="min-w-full text-sm">
                  <thead className="bg-sky-900 text-white">
                    <tr>
                      <th className="px-3 py-2 text-left w-12">SNO</th>
                      <th className="px-3 py-2 text-left">Product Name</th>
                      <th className="px-3 py-2 text-left w-24">Price</th>
                      <th className="px-3 py-2 text-left w-32">Bottle Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-gray-500 text-sm">
                          No products yet.
                        </td>
                      </tr>
                    ) : (
                      products.map((row, idx) => (
                        <tr
                          key={row.id}
                          className={`hover:bg-gray-50 cursor-pointer ${selectedId === row.id ? 'bg-sky-50' : ''}`}
                          onClick={() => {
                            setSelectedId(row.id);
                            setName(row.name);
                            setPrice(String(row.price ?? 0));
                            setType(row.type ?? '');
                          }}
                        >
                          <td className="px-3 py-2">{idx + 1}</td>
                          <td className="px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2">{row.price}</td>
                          <td className="px-3 py-2">{row.type ?? '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer bar */}
          <div className="mt-6 flex flex-col md:flex-row items-center justify-between text-xs text-gray-600">
            <p>Copyright all rights reserved by SOFTWEPK</p>
            <div className="mt-2 md:mt-0 flex items-center space-x-4">
              <span>App Code</span>
              <span>Help Line</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

