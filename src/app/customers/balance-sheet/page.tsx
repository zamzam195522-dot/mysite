import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';

export default function CustomerBalanceSheetPage() {
  const rows: Array<{ id: string; code: string; customer: string; outstanding: number; bottles: number; credit: number }> = [];

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Customer Balance Sheet" subtitle="Outstanding amount, bottles in market, and credit summary." />

          <SectionCard title="Balance Summary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Outstanding Amount', value: '0' },
                { label: 'Bottles in Market', value: '0' },
                { label: 'Credit Summary', value: '0' },
              ].map((x) => (
                <div key={x.label} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-700">{x.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{x.value}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Customer-wise Summary">
            <div className="border border-gray-200 rounded overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-sky-900 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left w-12">SNO</th>
                    <th className="px-3 py-2 text-left w-28">Acc#</th>
                    <th className="px-3 py-2 text-left">Customer</th>
                    <th className="px-3 py-2 text-left w-28">Outstanding</th>
                    <th className="px-3 py-2 text-left w-28">Bottles</th>
                    <th className="px-3 py-2 text-left w-28">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                        No customers yet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, idx) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2">{r.code}</td>
                        <td className="px-3 py-2">{r.customer}</td>
                        <td className="px-3 py-2">{r.outstanding}</td>
                        <td className="px-3 py-2">{r.bottles}</td>
                        <td className="px-3 py-2">{r.credit}</td>
                      </tr>
                    ))
                  )}
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

