type LinkItem = { label: string; href: string };

const quickLinks: LinkItem[] = [
  { label: 'Add New Filling Stock', href: '#products/filling-stock' },
  { label: 'Filling Stock History', href: '#products/filling-history' },
  { label: 'Stock IN / OUT', href: '#products/stock-inout' },
  { label: 'Check Stock Balance', href: '#products/stock-balance' },
];

export default function ProductsPageHeader() {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-sky-900">Products</p>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
            Inventory & Stock Management
          </h1>
          <p className="text-gray-600 mt-2 max-w-2xl">
            Use the dropdowns below to manage filling stock, stock movement, and balance checks — organized
            into tidy sections.
          </p>
        </div>

        <details className="group relative w-full md:w-72">
          <summary className="cursor-pointer list-none select-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-white hover:border-gray-300 transition flex items-center justify-between">
            <span>Quick links</span>
            <svg
              className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="absolute right-0 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-10">
            <div className="py-2">
              {quickLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-sky-900 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

