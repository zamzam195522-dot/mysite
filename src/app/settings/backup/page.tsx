import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';

export default function BackupPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Backup" subtitle="Backup and restore options (UI skeleton)." />

          <SectionCard title="Backup Actions">
            <div className="flex flex-col md:flex-row gap-3">
              <button className="flex-1 bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800">
                Create Backup
              </button>
              <button className="flex-1 bg-gray-800 text-white py-2 rounded text-sm font-semibold hover:bg-gray-700">
                Download Latest Backup
              </button>
              <button className="flex-1 bg-red-600 text-white py-2 rounded text-sm font-semibold hover:bg-red-500">
                Restore Backup
              </button>
            </div>
          </SectionCard>
        </div>
      </section>
      <Footer />
    </main>
  );
}

