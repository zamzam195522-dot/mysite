import StockAccordion from './StockAccordion';
import StockPageHeader from './StockPageHeader';
import DamageStockSection from './sections/DamageStockSection';
import FillingHistorySection from './sections/FillingHistorySection';
import FillingStockSection from './sections/FillingStockSection';
import StockBalanceSection from './sections/StockBalanceSection';
import StockInOutSection from './sections/StockInOutSection';

export default function StockSections() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 space-y-8">
        <StockPageHeader />

        <StockAccordion
          items={[
            {
              id: 'stock/filling-stock',
              title: 'Filling Stock',
              description: 'Add and review warehouse filling stock',
              defaultOpen: true,
              content: <FillingStockSection />,
            },
            {
              id: 'stock/filling-history',
              title: 'Filling Stock History',
              description: 'Filter and review filling stock updates',
              content: <FillingHistorySection />,
            },
            {
              id: 'stock/in-out',
              title: 'Stock IN / OUT',
              description: 'Record stock movement and view logs',
              content: <StockInOutSection />,
            },
            {
              id: 'stock/balance',
              title: 'Check Stock Balance',
              description: 'View warehouse and market balances',
              content: <StockBalanceSection />,
            },
            {
              id: 'stock/damage',
              title: 'Damage Stock',
              description: 'Add damage entries and view history',
              content: <DamageStockSection />,
            },
          ]}
        />
      </div>
    </section>
  );
}

