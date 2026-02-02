import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';

export default function DashboardPage() {
  const stats = [
    { label: 'Total Stock Summary', value: '0', hint: 'Warehouse + Market' },
    { label: 'Filling Stock', value: '0', hint: 'Warehouse filling' },
    { label: 'Empty Bottles', value: '0', hint: 'In warehouse' },
    { label: 'Market Stock', value: '0', hint: 'In market' },
    { label: 'Today Sales', value: '0', hint: 'Orders today' },
    { label: 'Today Payments', value: '0', hint: 'Collections today' },
    { label: 'Outstanding Balance', value: '0', hint: 'Receivables' },
    { label: 'Alerts', value: '0', hint: 'Low stock / Pending payments' },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-8">
          <PageHeader
            title="Dashboard"
            subtitle="Quick overview of stock, sales, payments, and alerts."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
              >
                <p className="text-sm font-semibold text-gray-700">{s.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.hint}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard
              title="Stock Summary"
              description="Warehouse vs market stock, filling/empty/damage overview."
            >
              <div className="grid grid-cols-2 gap-3 text-sm">
                {['Filling Stock', 'Empty Bottles', 'Market Stock', 'Damaged Stock'].map((k) => (
                  <div key={k} className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                    <p className="font-semibold text-gray-800">{k}</p>
                    <p className="text-gray-600 mt-1">0</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Alerts"
              description="Low stock items, overdue payments, and operational warnings."
            >
              <div className="space-y-2 text-sm">
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-yellow-900">
                  Low stock alerts will appear here.
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-900">
                  Pending payments alerts will appear here.
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

