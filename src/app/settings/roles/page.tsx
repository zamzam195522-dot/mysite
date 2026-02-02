import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';

export default function UserRolesPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="User Roles" subtitle="Manage user roles and permissions (UI skeleton)." />

          <SectionCard title="Roles">
            <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="e.g. Admin" />
              </div>
              <button className="bg-sky-900 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-sky-800">
                Add Role
              </button>
            </div>

            <div className="border border-gray-200 rounded overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-sky-900 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left w-12">SNO</th>
                    <th className="px-3 py-2 text-left">Role</th>
                    <th className="px-3 py-2 text-left w-40">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-3 py-2">1</td>
                    <td className="px-3 py-2">Admin</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button className="bg-sky-900 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-sky-800">
                          Edit
                        </button>
                        <button className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-red-500">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      </section>
      <Footer />
    </main>
  );
}

