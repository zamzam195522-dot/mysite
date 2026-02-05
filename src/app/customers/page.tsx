'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  type: string;
}

interface CustomerProductPrice {
  id: number;
  customerId: number;
  customerCode: string;
  customerName: string;
  productId: number;
  productName: string;
  price: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export default function CustomersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customerPrices, setCustomerPrices] = useState<CustomerProductPrice[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customerPrice, setCustomerPrice] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCustomerPrices();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      // Error fetching products
    }
  };

  const fetchCustomerPrices = async () => {
    try {
      const response = await fetch('/api/customer-product-prices');
      const data = await response.json();
      if (data.success) {
        setCustomerPrices(data.prices);
      }
    } catch (error) {
      // Error fetching customer prices
    }
  };

  const handleSetCustomerPrice = async () => {
    if (!selectedCustomerId || !selectedProductId || !customerPrice) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/customer-product-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: Number(selectedCustomerId),
          productId: Number(selectedProductId),
          price: Number(customerPrice),
          effectiveFrom: effectiveFrom || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Customer price set successfully!');
        setSelectedCustomerId('');
        setSelectedProductId('');
        setCustomerPrice('');
        setEffectiveFrom('');
        fetchCustomerPrices();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      // Error setting customer price
      alert('Error setting customer price');
    }
  };
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          {/* Customer Specific Pricing Section */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-6">CUSTOMER SPECIFIC PRICING</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer ID:
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Customer ID"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product:
                </label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (₹{product.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Price:
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Price"
                  value={customerPrice}
                  onChange={(e) => setCustomerPrice(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective From (Optional):
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={handleSetCustomerPrice}
              className="bg-sky-900 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-sky-800"
            >
              Set Customer Price
            </button>
          </div>

          {/* Existing Customer Prices Table */}
          {customerPrices.length > 0 && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-sky-900 mb-4">Existing Customer Prices</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Customer</th>
                      <th className="text-left py-2 px-2">Product</th>
                      <th className="text-left py-2 px-2">Price</th>
                      <th className="text-left py-2 px-2">Effective From</th>
                      <th className="text-left py-2 px-2">Effective To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerPrices.slice(0, 10).map((price) => (
                      <tr key={price.id} className="border-b">
                        <td className="py-2 px-2">{price.customerName} ({price.customerCode})</td>
                        <td className="py-2 px-2">{price.productName}</td>
                        <td className="py-2 px-2">₹{price.price}</td>
                        <td className="py-2 px-2">{price.effectiveFrom}</td>
                        <td className="py-2 px-2">{price.effectiveTo || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left + middle: New Customer */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h1 className="text-2xl font-bold text-sky-900 mb-6">NEW CUSTOMER</h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column */}
                <div className="space-y-4">
                  <h2 className="font-semibold text-gray-800">New Customer Account</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Open Date:
                    </label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name:
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Customer Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact #:
                    </label>
                    <div className="flex space-x-2">
                      <input
                        className="w-20 border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        defaultValue="+91"
                      />
                      <input
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="Phone Number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address:
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Status:
                    </label>
                    <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Middle column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Security Deposit Amount:
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      defaultValue="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Security Remarks:
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Remarks"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Opening Bottle:
                      </label>
                      <input
                        className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        defaultValue="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Opening Balance:
                      </label>
                      <input
                        className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        defaultValue="0"
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Customer Login Info</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          User Name:
                        </label>
                        <input
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="User Name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password:
                        </label>
                        <input
                          type="password"
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="Password"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col md:flex-row md:space-x-4 space-y-3 md:space-y-0">
                <button className="flex-1 bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800">
                  Save
                </button>
                <button className="flex-1 bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800">
                  Edit
                </button>
                <button className="flex-1 bg-red-600 text-white py-2 rounded text-sm font-semibold hover:bg-red-500">
                  Refresh
                </button>
              </div>
            </div>

            {/* Right: search / area / days */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search By Customer ID
                </label>
                <div className="flex space-x-2">
                  <input
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Customer ID"
                  />
                  <button className="bg-red-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-red-500">
                    Search
                  </button>
                  <button className="bg-red-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-red-500">
                    Advance Search
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Area
                </label>
                <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                  <option>Select Area</option>
                </select>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">Delivery Days</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <label key={day} className="inline-flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-sky-500" />
                      <span>{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  Required Bottle Qty For Order Delivery:
                </p>
                <input
                  className="w-full border border-yellow-300 bg-yellow-50 rounded px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  defaultValue="0"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

