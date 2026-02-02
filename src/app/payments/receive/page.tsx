import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import ReceiveCustomerPayment from '@/components/payments/ReceiveCustomerPayment';

export default function ReceivePaymentPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Receive Customer Payment" subtitle="Cash / Bank / Cheque with date, discount, and remarks." />

          <ReceiveCustomerPayment />
        </div>
      </section>
      <Footer />
    </main>
  );
}

