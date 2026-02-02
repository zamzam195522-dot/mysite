import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import StockBalanceSection from '@/components/stock/sections/StockBalanceSection';

export default function StockBalancePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Check Stock Balance" subtitle="Warehouse stock, market stock, and damaged stock overview." />
          <StockBalanceSection />
        </div>
      </section>
      <Footer />
    </main>
  );
}

