import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';

export default function CustomerLocationPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader
            title="Customer Location"
            subtitle="Pin location (Google Map), store latitude/longitude, and track via mobile app."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Set Customer Pin">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white">
                    <option>Select Customer</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="0.000000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="0.000000" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="flex-1 bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800">
                    Save Location
                  </button>
                  <button className="flex-1 bg-red-600 text-white py-2 rounded text-sm font-semibold hover:bg-red-500">
                    Reset
                  </button>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Map Preview" description="Hook Google Maps here later (UI placeholder).">
              <div className="h-72 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-500">
                Map will be embedded here.
              </div>
            </SectionCard>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

