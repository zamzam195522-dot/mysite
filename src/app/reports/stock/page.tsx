import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import StockBalanceSection from '@/components/stock/sections/StockBalanceSection';

export default function StockReportPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Stock Report" subtitle="Snapshot of warehouse, market, and damaged stock." />
          <StockBalanceSection />
        </div>
      </section>
      <Footer />
    </main>
  );
}

