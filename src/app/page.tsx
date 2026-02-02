'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import DashboardPreview from '@/components/DashboardPreview';
import InterfacePreview from '@/components/InterfacePreview';
import Footer from '@/components/Footer';
import ProductWindow from '@/components/ProductWindow';
import { apiFetch } from '@/lib/api';

type MeResponse = {
  success: boolean;
  user: any | null;
};

export default function Home() {
  const router = useRouter();
  const [isProductWindowOpen, setIsProductWindowOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check authentication status
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const res = await apiFetch<MeResponse>('/api/auth/me');
        if (!isMounted) return;
        setIsAuthenticated(Boolean(res.success && res.user));
      } catch (error) {
        if (!isMounted) return;
        if (error instanceof Error && error.message.includes('Session expired')) {
          // apiFetch will handle redirect to login
          return;
        }
        setIsAuthenticated(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isAuthenticated === false) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Show loading or nothing while checking authentication
  if (isAuthenticated === null) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  // Don't render home page if not authenticated (will redirect)
  if (isAuthenticated === false) {
    return null;
  }

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

