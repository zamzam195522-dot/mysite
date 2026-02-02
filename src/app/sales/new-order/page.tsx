import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import NewOrder from '@/components/sales/NewOrder';

export default function NewSalesOrderPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="New Sales Order" subtitle="Select customer, add products, return bottles, assign salesman, and save bill." />

          <NewOrder />
        </div>
      </section>
      <Footer />
    </main>
  );
}

