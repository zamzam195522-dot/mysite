import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import FillingHistorySection from '@/components/stock/sections/FillingHistorySection';

export default function FillingStockHistoryPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Filling Stock History" subtitle="Filter by date range and review old/new/updated stock." />
          <FillingHistorySection />
        </div>
      </section>
      <Footer />
    </main>
  );
}

