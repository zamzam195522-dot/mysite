'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SectionCard from '@/components/ui/SectionCard';
import PageHeader from '@/components/ui/PageHeader';
import { apiFetch } from '@/lib/api';

export const dynamic = 'force-dynamic';

type RegisterResponse = {
  success: boolean;
  user?: {
    id: number;
    username: string;
  };
};

export default function RegisterPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const u = username.trim();
    if (!u || !password) {
      setError('Please enter username and password.');
      return;
    }

    if (u.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Ensure we're on client side and mounted
    if (!mounted || typeof window === 'undefined') return;

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await apiFetch<RegisterResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: u, password }),
      });

      if (!res.success) {
        setError('Registration failed. Username may already exist.');
        return;
      }

      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to register');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-10">
      {!mounted ? (
        <div className="w-full max-w-xl px-4">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-xl px-4 space-y-6">
          <PageHeader
            title="Create Account"
            subtitle="Register to access the ZamZam management system."
          />

          <SectionCard title="Register">
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
                  placeholder="Choose a username (min 3 characters)"
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
                  placeholder="Choose a password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800 disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-sky-900 font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </SectionCard>
        </div>
      )}
    </main>
  );
}
