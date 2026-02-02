import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import DamageStockSection from '@/components/stock/sections/DamageStockSection';

export default function DamageStockPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Damage Stock" subtitle="Record damaged items and review damage history." />
          <DamageStockSection />
        </div>
      </section>
      <Footer />
    </main>
  );
}

