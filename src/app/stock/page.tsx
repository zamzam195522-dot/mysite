import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StockSections from '@/components/stock/StockSections';

export default function StockPage() {
  return (
    <main className="min-h-screen relative">
      <Header />
      <StockSections />
      <Footer />
    </main>
  );
}

