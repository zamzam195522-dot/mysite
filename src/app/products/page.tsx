import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';

export default function ProductsHomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-8">
          <PageHeader
            title="Products"
            subtitle="Add, manage, and organize your product catalog (19L, Disposable, Accessories)."
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SectionCard title="Add New Product" description="Create a new product with default price and category.">
              <a
                href="/products/add"
                className="inline-flex items-center justify-center bg-sky-900 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-sky-800"
              >
                Open
              </a>
            </SectionCard>
            <SectionCard title="Manage Products" description="View product list, edit/delete, and set casual price.">
              <a
                href="/products/manage"
                className="inline-flex items-center justify-center bg-sky-900 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-sky-800"
              >
                Open
              </a>
            </SectionCard>
            <SectionCard title="Product Categories" description="Manage categories like 19L, Disposable, Accessories.">
              <a
                href="/products/categories"
                className="inline-flex items-center justify-center bg-sky-900 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-sky-800"
              >
                Open
              </a>
            </SectionCard>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

