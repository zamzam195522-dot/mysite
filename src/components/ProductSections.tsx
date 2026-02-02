import ProductsAccordion from './products/ProductsAccordion';
import ProductsPageHeader from './products/ProductsPageHeader';
import FillingHistorySection from './products/sections/FillingHistorySection';
import FillingStockSection from './products/sections/FillingStockSection';
import StockBalanceSection from './products/sections/StockBalanceSection';
import StockInOutSection from './products/sections/StockInOutSection';

export default function ProductSections() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 space-y-8">
        <ProductsPageHeader />

        <ProductsAccordion
          items={[
            {
              id: 'products/filling-stock',
              title: 'Add New Filling Stock',
              description: 'Add and review warehouse filling stock',
              defaultOpen: true,
              content: <FillingStockSection />,
            },
            {
              id: 'products/filling-history',
              title: 'Filling Stock History',
              description: 'Filter and review filling stock updates',
              content: <FillingHistorySection />,
            },
            {
              id: 'products/stock-inout',
              title: 'Stock IN / OUT',
              description: 'Record stock movement and view logs',
              content: <StockInOutSection />,
            },
            {
              id: 'products/stock-balance',
              title: 'Check Stock Balance',
              description: 'View overall warehouse and market balances',
              content: <StockBalanceSection />,
            },
          ]}
        />
      </div>
    </section>
  );
}

