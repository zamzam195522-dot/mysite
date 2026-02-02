import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import FillingStockSection from '@/components/stock/sections/FillingStockSection';

export default function FillingStockPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Filling Stock" subtitle="Add filling entries and update product-wise filling quantities." />
          <FillingStockSection />
        </div>
      </section>
      <Footer />
    </main>
  );
}

