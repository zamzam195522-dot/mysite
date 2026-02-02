'use client';

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardPreview() {
  const stats = [
    { 
      label: 'Total Revenue', 
      value: '₹0', 
      description: 'Based on 100 Charges', 
      color: 'text-green-600',
      iconBg: 'bg-green-100',
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      label: 'Total Products', 
      value: '2', 
      description: 'Total Products created', 
      color: 'text-purple-600',
      iconBg: 'bg-purple-100',
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    { 
      label: 'Total Customers', 
      value: '+0', 
      description: 'Total Customers of ZamZam', 
      color: 'text-blue-600',
      iconBg: 'bg-blue-100',
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      label: 'Total Employees', 
      value: '6', 
      description: 'Total Employees of ZamZam', 
      color: 'text-orange-600',
      iconBg: 'bg-orange-100',
      icon: (
        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 42000 },
    { month: 'Feb', revenue: 38000 },
    { month: 'Mar', revenue: 45000 },
    { month: 'Apr', revenue: 41000 },
    { month: 'May', revenue: 47000 },
    { month: 'Jun', revenue: 45000 },
  ];

  const consumptionData = [
    { month: 'Jan', consumption: 12500 },
    { month: 'Feb', consumption: 11800 },
    { month: 'Mar', consumption: 13200 },
    { month: 'Apr', consumption: 12800 },
    { month: 'May', consumption: 14500 },
    { month: 'Jun', consumption: 13800 },
  ];

  return (
    <section id="dashboard" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Dashboard Overview
          </h2>
          <p className="text-xl text-gray-600">
            Real-time insights into your business performance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-md border border-gray-100 relative overflow-hidden"
            >
              <div className={`absolute top-4 right-4 ${stat.iconBg} p-2 rounded-lg`}>
                {stat.icon}
              </div>
              <p className="text-gray-600 text-sm mb-2 font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-800 mb-2">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.description}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0EA5E9"
                  strokeWidth={3}
                  dot={{ fill: '#0EA5E9', r: 5 }}
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Water Consumption</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={consumptionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="consumption" fill="#0284C7" name="Consumption (Liters)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { action: 'New customer registered', time: '2 hours ago', type: 'customer' },
              { action: 'Payment received - $450', time: '4 hours ago', type: 'payment' },
              { action: 'Meter reading updated', time: '6 hours ago', type: 'meter' },
              { action: 'Bill generated for 25 customers', time: '1 day ago', type: 'billing' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'customer' ? 'bg-blue-500' :
                    activity.type === 'payment' ? 'bg-green-500' :
                    activity.type === 'meter' ? 'bg-purple-500' : 'bg-orange-500'
                  }`}></div>
                  <span className="text-gray-700">{activity.action}</span>
                </div>
                <span className="text-gray-500 text-sm">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
