import type { ReactNode } from 'react';

export type ProductsAccordionItem = {
  id: string;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  content: ReactNode;
};

export default function ProductsAccordion({ items }: { items: ProductsAccordionItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <details
          key={item.id}
          className="group bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden"
          open={item.defaultOpen}
        >
          <summary className="cursor-pointer list-none select-none px-6 py-5 hover:bg-gray-50 transition flex items-start gap-4">
            <div className="mt-0.5 w-9 h-9 rounded-xl bg-sky-900/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-sky-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6l4 2"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 truncate">{item.title}</h2>
                  {item.description ? (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  ) : null}
                </div>
                <svg
                  className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180 mt-1 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </summary>
          <div className="px-6 pb-6 pt-0">{item.content}</div>
        </details>
      ))}
    </div>
  );
}

