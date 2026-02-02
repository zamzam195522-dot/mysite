'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import DashboardPreview from '@/components/DashboardPreview';
import InterfacePreview from '@/components/InterfacePreview';
import Footer from '@/components/Footer';
import ProductWindow from '@/components/ProductWindow';

export default function Home() {
  const [isProductWindowOpen, setIsProductWindowOpen] = useState(false);

  return (
    <main className="min-h-screen relative">
      <Header onProductClick={() => setIsProductWindowOpen(true)} />
      <Hero />
      <Features />
      {/* Anchor targets for header navigation */}
      {/* Dashboard / Expenditure / Reports */}
      <div id="expenditure" className="relative -top-24 h-0" />
      <div id="reports" className="relative -top-24 h-0" />
      <DashboardPreview />
      {/* Customers / Transactions / Product / Vendor / Employee */}
      <div id="customers" className="relative -top-24 h-0" />
      <div id="transactions" className="relative -top-24 h-0" />
      <div id="products" className="relative -top-24 h-0" />
      <div id="vendors" className="relative -top-24 h-0" />
      <div id="employees" className="relative -top-24 h-0" />
      <InterfacePreview />
      {/* Settings near footer */}
      <div id="settings" className="relative -top-24 h-0" />
      <Footer />
      {isProductWindowOpen && (
        <ProductWindow onClose={() => setIsProductWindowOpen(false)} />
      )}
    </main>
  );
}

