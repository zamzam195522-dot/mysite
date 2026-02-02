import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';

export default function PriceSettingsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Price Settings" subtitle="Manage default and special pricing rules." />

          <SectionCard title="Default Prices">
            <div className="border border-gray-200 rounded overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-sky-900 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left w-12">SNO</th>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-left w-28">Default Price</th>
                    <th className="px-3 py-2 text-left w-40">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-3 py-2">1</td>
                    <td className="px-3 py-2">19 LTR</td>
                    <td className="px-3 py-2">100</td>
                    <td className="px-3 py-2">
                      <button className="bg-sky-900 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-sky-800">
                        Update
                      </button>
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

