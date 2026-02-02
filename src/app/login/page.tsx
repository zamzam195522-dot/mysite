'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SectionCard from '@/components/ui/SectionCard';
import PageHeader from '@/components/ui/PageHeader';
import { apiFetch } from '@/lib/api';

export const dynamic = 'force-dynamic';

type LoginResponse = {
  success: boolean;
  user?: {
    id: number;
    username: string;
  };
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if session expired and show appropriate message
  useEffect(() => {
    if (!mounted) return;
    const sessionExpired = searchParams.get('session');
    if (sessionExpired === 'expired') {
      setError('Your session has expired. Please log in again.');
    }
  }, [searchParams, mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const u = username.trim();
    if (!u || !password) {
      setError('Please enter username and password.');
      return;
    }

    // Ensure we're on client side and mounted
    if (!mounted || typeof window === 'undefined') return;

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await apiFetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: u, password }),
      });

      if (!res.success) {
        setError('Invalid credentials.');
        return;
      }

      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-10">
      <div className="w-full max-w-xl px-4 space-y-6">
        <PageHeader
          title="Sign in to ZamZam Dashboard"
          subtitle="Use your employee username and password to access the management system."
        />

        <SectionCard title="Login">
          {error ? (
            <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800 disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-sky-900 font-medium hover:underline">
                Register
              </Link>
            </p>
          </form>
        </SectionCard>
      </div>
    </main>
  );
}

