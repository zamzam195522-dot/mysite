import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function EmployeesPage() {
  const employees: Array<{ id: string; code: string; firstName: string; lastName: string }> = [];
  const assignableEmployees: Array<{ id: string; label: string }> = [];
  const areas: Array<{ id: string; name: string }> = [];
  const employeeAreaRows: Array<{ id: string; areaName: string; customerCount: number }> = [];

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* New Employee */}
      <section className="py-10">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left + middle: form */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-sky-900 mb-6">NEW EMPLOYEE</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-4">
                <h2 className="font-semibold text-gray-800">New Employee Account</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Join Date:
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name:
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name:
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Last Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIC:
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="NIC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact:
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Contact Number"
                  />
                </div>
              </div>

              {/* Middle column */}
              <div className="space-y-4">
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
                    Employee Designation:
                  </label>
                  <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <option>Select</option>
                  </select>
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
                New Employee
              </button>
              <button className="flex-1 bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800">
                Edit
              </button>
              <button className="flex-1 bg-red-600 text-white py-2 rounded text-sm font-semibold hover:bg-red-500">
                Refresh
              </button>
            </div>
          </div>

          {/* Right: Employee Accounts table */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex flex-col">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search By ID or Name
              </label>
              <div className="flex space-x-2">
                <input
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Enter ID or Name"
                />
                <button className="bg-red-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-red-500">
                  Search
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded overflow-x-auto flex-1">
              <table className="min-w-full text-sm">
                <thead className="bg-sky-900 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left w-12">SNO</th>
                    <th className="px-3 py-2 text-left w-24">Acc#</th>
                    <th className="px-3 py-2 text-left">First Name</th>
                    <th className="px-3 py-2 text-left">Last Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={4}>
                        No employees yet.
                      </td>
                    </tr>
                  ) : (
                    employees.map((e, idx) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2">{e.code}</td>
                        <td className="px-3 py-2">{e.firstName}</td>
                        <td className="px-3 py-2">{e.lastName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Area Assign */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-sky-900 mb-6">AREA ASSIGN</h2>
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Area Assign to Employee */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Area Assign To Employee</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Employee
                </label>
                <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                  <option>SELECT EMPLOYEE</option>
                  {assignableEmployees.map((e) => (
                    <option key={e.id}>{e.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Area
                </label>
                <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                  <option>SELECT AREA</option>
                  {areas.map((a) => (
                    <option key={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3 pt-2">
                <button className="w-full bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800">
                  Assign Area
                </button>
                <button className="w-full bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800">
                  Add New Area
                </button>
                <button className="w-full bg-red-600 text-white py-2 rounded text-sm font-semibold hover:bg-red-500">
                  Refresh
                </button>
              </div>
            </div>

            {/* Right: Employee Area List */}
            <div className="lg:col-span-2 flex flex-col">
              <h3 className="font-semibold text-gray-800 mb-4">Employee Area List</h3>
              <div className="border border-gray-200 rounded overflow-x-auto flex-1">
                <table className="min-w-full text-sm">
                  <thead className="bg-sky-900 text-white">
                    <tr>
                      <th className="px-3 py-2 text-left w-12">SNO</th>
                      <th className="px-3 py-2 text-left">Area Name</th>
                      <th className="px-3 py-2 text-left w-40">Total Customer Count in Area</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employeeAreaRows.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-gray-500" colSpan={3}>
                          No assigned areas yet.
                        </td>
                      </tr>
                    ) : (
                      employeeAreaRows.map((r, idx) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">{idx + 1}</td>
                          <td className="px-3 py-2">{r.areaName}</td>
                          <td className="px-3 py-2">{r.customerCount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

