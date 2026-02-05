'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type { SessionUser } from '@/lib/auth';

type HeaderProps = {
  onProductClick?: () => void; // kept for backward compatibility (home modal etc.)
};

type NavItem = {
  key: string;
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
};

type MeResponse = {
  success: boolean;
  user: SessionUser | null;
};

export default function Header(_props: HeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDesktopDropdownKey, setOpenDesktopDropdownKey] = useState<string | null>(null);
  const [openMobileDropdownKey, setOpenMobileDropdownKey] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Small delay so dropdown doesn't disappear instantly when moving the mouse
  const closeDesktopDropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDesktopDropdownOpen = (key: string) => {
    if (closeDesktopDropdownTimeoutRef.current) {
      clearTimeout(closeDesktopDropdownTimeoutRef.current);
      closeDesktopDropdownTimeoutRef.current = null;
    }
    setOpenDesktopDropdownKey(key);
  };

  const handleDesktopDropdownClose = () => {
    if (closeDesktopDropdownTimeoutRef.current) {
      clearTimeout(closeDesktopDropdownTimeoutRef.current);
    }
    closeDesktopDropdownTimeoutRef.current = setTimeout(() => {
      setOpenDesktopDropdownKey(null);
    }, 150);
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Detect if user is already logged in so we can show Home instead of Login/Register
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const res = await apiFetch<MeResponse>('/api/auth/me');
        if (!isMounted) return;
        setIsAuthenticated(Boolean(res.success && res.user));
      } catch (error) {
        if (!isMounted) return;
        // If we get a 401, the session has expired
        if (error instanceof Error && error.message.includes('Session expired')) {
          // The apiFetch will handle redirect to login
          return;
        }
        setIsAuthenticated(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const navItems: NavItem[] = useMemo(
    () => [
      { key: 'dashboard', label: 'Dashboard', href: '/dashboard' },
      {
        key: 'products',
        label: 'Products',
        children: [
          { label: 'Add New Product', href: '/products/add' },
          { label: 'Manage Products', href: '/products/manage' },
          { label: 'Product Categories', href: '/products/categories' },
          { label: '— Stock —', href: '/stock' },
          { label: 'Check Stock Balance', href: '/stock/balance' },
          { label: 'Stock In / Out', href: '/stock/in-out' },
          { label: 'Filling Stock', href: '/stock/filling' },
          { label: 'Filling Stock History', href: '/stock/filling-history' },
          { label: 'Damage Stock', href: '/stock/damage' },
        ],
      },
      {
        key: 'employees',
        label: 'Employees',
        children: [
          { label: 'Add Employee', href: '/employees/add' },
          { label: 'Manage Employees', href: '/employees/manage' },
          { label: 'Areas Management', href: '/employees/areas' },
          { label: 'Assign Areas', href: '/employees/assign-areas' },
        ],
      },
      {
        key: 'customers',
        label: 'Customers',
        children: [
          { label: 'Customer Pricing', href: '/customers' },
          { label: 'Add Customer', href: '/customers/add' },
          { label: 'Manage Customers', href: '/customers/manage' },
          { label: 'Customer Ledger', href: '/customers/ledger' },
          { label: 'Customer Balance Sheet', href: '/customers/balance-sheet' },
          { label: 'Customer Location (Map)', href: '/customers/location' },
          { label: '— Sales —', href: '/customers/new-order' },
          { label: 'New Sales Order', href: '/customers/new-order' },
          { label: 'Sales History', href: '/sales/history' },
          { label: '— Payments —', href: '/customers/payment' },
          { label: 'Receive Customer Payment', href: '/customers/payment' },
          { label: 'Security Deposit', href: '/payments/security-deposit' },
          { label: 'Refund Deposit', href: '/payments/refund' },
        ],
      },
      {
        key: 'vendors',
        label: 'Vendors',
        children: [
          { label: 'Add Vendor', href: '/vendors/add' },
          { label: 'Purchase Stock', href: '/vendors/purchase' },
          { label: 'Vendor Payment', href: '/vendors/payment' },
          { label: 'Vendor Ledger', href: '/vendors/ledger' },
          { label: 'Vendor Balance Sheet', href: '/vendors/balance-sheet' },
        ],
      },
      { key: 'expenditure', label: 'Expenditure', href: '/expenditure' },
      {
        key: 'reports',
        label: 'Reports',
        children: [
          { label: 'Daily Area List', href: '/reports/daily-area' },
          { label: 'Daily Sales Report', href: '/reports/daily-sales' },
          { label: 'Monthly Sales Report', href: '/reports/monthly-sales' },
          { label: 'Salesman-wise Report', href: '/reports/salesman' },
          { label: 'Stock Report', href: '/reports/stock' },
          { label: 'Customer Outstanding Report', href: '/reports/customer-outstanding' },
        ],
      },
      {
        key: 'settings',
        label: 'Settings',
        children: [
          { label: 'Banks', href: '/settings/banks' },
          { label: 'Price Settings', href: '/settings/price' },
          { label: 'User Roles', href: '/settings/roles' },
          { label: 'Backup', href: '/settings/backup' },
        ],
      },
    ],
    [],
  );

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
              <span className="text-xl md:text-2xl font-bold text-gray-800">
                ZamZam Industries
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6 relative">
            {navItems.map((item) =>
              item.children ? (
                <div
                  key={item.key}
                  className="relative"
                  onMouseEnter={() => handleDesktopDropdownOpen(item.key)}
                  onMouseLeave={handleDesktopDropdownClose}
                >
                  <a
                    href={item.href ?? '#'}
                    onClick={(e) => {
                      // dropdown only; avoid jumping to top
                      if (!item.href) e.preventDefault();
                    }}
                    className="text-gray-700 hover:text-primary transition-colors font-medium cursor-pointer flex items-center"
                  >
                    {item.label}
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </a>

                  {openDesktopDropdownKey === item.key ? (
                    <div
                      className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                      onMouseEnter={() => handleDesktopDropdownOpen(item.key)}
                      onMouseLeave={handleDesktopDropdownClose}
                    >
                      {item.children.map((child) => (
                        <a
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <a
                  key={item.key}
                  href={item.href}
                  className="text-gray-700 hover:text-primary transition-colors font-medium cursor-pointer"
                >
                  {item.label}
                </a>
              ),
            )}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div
                  className="relative"
                  onMouseEnter={() => handleDesktopDropdownOpen('profile')}
                  onMouseLeave={handleDesktopDropdownClose}
                >
                  <button
                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
                    type="button"
                  >
                    Profile
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {openDesktopDropdownKey === 'profile' ? (
                    <div
                      className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                      onMouseEnter={() => handleDesktopDropdownOpen('profile')}
                      onMouseLeave={handleDesktopDropdownClose}
                    >
                      <a
                        href="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                      >
                        Dashboard
                      </a>
                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                  type="button"
                  onClick={() => router.push('/login')}
                >
                  Login
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-2 pb-4">
            {navItems.map((item) =>
              item.children ? (
                <div key={item.key}>
                  <button
                    onClick={() =>
                      setOpenMobileDropdownKey((prev) => (prev === item.key ? null : item.key))
                    }
                    className="w-full flex items-center justify-between py-2 text-gray-700 hover:text-primary transition-colors"
                  >
                    {item.label}
                    <svg
                      className={`w-4 h-4 transition-transform ${openMobileDropdownKey === item.key ? 'rotate-180' : ''
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openMobileDropdownKey === item.key ? (
                    <div className="pl-4 mt-2 space-y-1">
                      {item.children.map((child) => (
                        <a
                          key={child.href}
                          href={child.href}
                          className="block py-2 text-sm text-gray-600 hover:text-primary transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <a
                  key={item.key}
                  href={item.href}
                  className="block py-2 text-gray-700 hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ),
            )}
            {isAuthenticated ? (
              <div className="flex gap-3 mt-4">
                <div>
                  <button
                    className="flex-1 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                    type="button"
                    onClick={() =>
                      setOpenMobileDropdownKey((prev) => (prev === 'profile' ? null : 'profile'))
                    }
                  >
                    Profile
                    <svg
                      className={`w-4 h-4 transition-transform ${openMobileDropdownKey === 'profile' ? 'rotate-180' : ''
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openMobileDropdownKey === 'profile' ? (
                    <div className="pl-4 mt-2 space-y-1">
                      <a
                        href="/dashboard"
                        className="block py-2 text-sm text-gray-600 hover:text-primary transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </a>
                      <button
                        className="block w-full text-left py-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleLogout();
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex gap-3 mt-4">
                <button
                  className="flex-1 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push('/login');
                  }}
                >
                  Login
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
