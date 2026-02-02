import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';

export default function AssignAreasPage() {
  const salesmen: Array<{ id: string; label: string }> = [];
  const areas: Array<{ id: string; name: string }> = [];
  const assignedAreas: Array<{ id: string; areaName: string; customerCount: number }> = [];

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Assign Areas" subtitle="Assign one or more areas to salesmen and view assigned customer counts." />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SectionCard title="Assign Area to Employee">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Salesman</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white">
                    <option>SELECT EMPLOYEE</option>
                    {salesmen.map((s) => (
                      <option key={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Area(s)</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white">
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
                  <button className="w-full bg-red-600 text-white py-2 rounded text-sm font-semibold hover:bg-red-500">
                    Refresh
                  </button>
                </div>
              </div>
            </SectionCard>

            <div className="lg:col-span-2">
              <SectionCard title="Assigned Areas" description="List of areas assigned to the selected salesman with customer counts.">
                <div className="border border-gray-200 rounded overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-sky-900 text-white">
                      <tr>
                        <th className="px-3 py-2 text-left w-12">SNO</th>
                        <th className="px-3 py-2 text-left">Area Name</th>
                        <th className="px-3 py-2 text-left w-40">Assigned Customers Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {assignedAreas.length === 0 ? (
                        <tr>
                          <td className="px-3 py-6 text-center text-gray-500" colSpan={3}>
                            No assigned areas yet.
                          </td>
                        </tr>
                      ) : (
                        assignedAreas.map((a, idx) => (
                          <tr key={a.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">{idx + 1}</td>
                            <td className="px-3 py-2">{a.areaName}</td>
                            <td className="px-3 py-2">{a.customerCount}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

