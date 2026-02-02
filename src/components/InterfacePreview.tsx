export default function InterfacePreview() {
  const interfaces = [
    {
      title: 'Customer Management',
      description: 'View and manage all your customers in one place',
      preview: (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800">Customers</h4>
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm">+ Add New</button>
          </div>
          <div className="space-y-3">
            {[
              { name: 'John Smith', address: '123 Main St', status: 'Active', balance: '$120' },
              { name: 'Sarah Johnson', address: '456 Oak Ave', status: 'Active', balance: '$0' },
              { name: 'Mike Davis', address: '789 Pine Rd', status: 'Active', balance: '$85' },
            ].map((customer, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{customer.name}</p>
                  <p className="text-sm text-gray-600">{customer.address}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs ${customer.status === 'Active' ? 'bg-green-100 text-green-800' : ''}`}>
                    {customer.status}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">Balance: {customer.balance}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Transactions',
      description: 'View and manage all financial transactions',
      preview: (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800">Transactions</h4>
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm">+ New Transaction</button>
          </div>
          <div className="space-y-3">
            {[
              { id: 'TXN-001', customer: 'John Smith', amount: '$100.00', type: 'Payment', date: '2024-01-15', status: 'Completed' },
              { id: 'TXN-002', customer: 'Sarah Johnson', amount: '$75.50', type: 'Refund', date: '2024-01-14', status: 'Pending' },
              { id: 'TXN-003', customer: 'Mike Davis', amount: '$150.00', type: 'Payment', date: '2024-01-13', status: 'Completed' },
            ].map((transaction, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{transaction.id}</p>
                  <p className="text-sm text-gray-600">{transaction.customer} • {transaction.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">{transaction.amount}</p>
                  <span className={`px-2 py-1 rounded text-xs ${
                    transaction.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Product Management',
      description: 'Manage your product catalog and inventory items',
      preview: (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800">Products</h4>
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm">+ Add Product</button>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Water Tank 500L', category: 'Equipment', price: '$250.00', stock: '45', status: 'In Stock' },
              { name: 'Water Filter System', category: 'Equipment', price: '$180.00', stock: '12', status: 'In Stock' },
              { name: 'Delivery Hose', category: 'Accessories', price: '$35.00', stock: '3', status: 'Low Stock' },
            ].map((product, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.category} • Stock: {product.stock}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">{product.price}</p>
                  <span className={`px-2 py-1 rounded text-xs ${
                    product.status === 'In Stock' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {product.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Vendor Management',
      description: 'Manage vendor relationships and supplier information',
      preview: (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800">Vendors</h4>
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm">+ Add Vendor</button>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Aqua Supplies Co.', contact: 'John Doe', phone: '+1 234-567-8900', status: 'Active' },
              { name: 'WaterTech Solutions', contact: 'Jane Smith', phone: '+1 234-567-8901', status: 'Active' },
              { name: 'Hydro Equipment Ltd.', contact: 'Bob Wilson', phone: '+1 234-567-8902', status: 'Active' },
            ].map((vendor, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{vendor.name}</p>
                  <p className="text-sm text-gray-600">{vendor.contact} • {vendor.phone}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs ${
                    vendor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {vendor.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Employee Management',
      description: 'Manage employee profiles, roles, and access permissions',
      preview: (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800">Employees</h4>
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm">+ Add Employee</button>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Alice Johnson', role: 'Manager', email: 'alice@aquamanage.com', status: 'Active' },
              { name: 'David Brown', role: 'Field Technician', email: 'david@aquamanage.com', status: 'Active' },
              { name: 'Emily Davis', role: 'Accountant', email: 'emily@aquamanage.com', status: 'Active' },
            ].map((employee, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{employee.name}</p>
                  <p className="text-sm text-gray-600">{employee.role} • {employee.email}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs ${
                    employee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {employee.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="interface-preview" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Interface Preview
          </h2>
          <p className="text-xl text-gray-600">
            See how easy it is to manage your water business
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {interfaces.map((interfaceItem, index) => (
            <div key={index} className="transform hover:scale-105 transition-transform duration-300">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {interfaceItem.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {interfaceItem.description}
                </p>
              </div>
              {interfaceItem.preview}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
