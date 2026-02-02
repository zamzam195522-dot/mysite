import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import StockInOutSection from '@/components/stock/sections/StockInOutSection';

export default function StockInOutPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Stock IN / OUT" subtitle="Record purchases/returns and stock out entries with remarks and date." />
          <StockInOutSection />
        </div>
      </section>
      <Footer />
    </main>
  );
}

