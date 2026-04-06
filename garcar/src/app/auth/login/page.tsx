'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Car, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { saveAuth, saveRefreshToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

function LoginForm() {
  const searchParams = useSearchParams();
  const justApproved = searchParams.get('approved') === '1';

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const username = (fd.get('username') as string).trim();
    const password = fd.get('password') as string;
    if (!username || !password) {
      setError('Please enter your username and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await api.login({ username, password });
      saveAuth(data.token, data.userId);
      if (data.refreshToken) saveRefreshToken(data.refreshToken);
      if (data.isVerified) {
        window.location.href = '/browse';
      } else {
        window.location.href = `/verify/residency?userId=${data.userId}`;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
          <Car className="w-5 h-5" /> GarKar
        </Link>
        <div>
          <blockquote className="text-white/90 text-2xl font-medium leading-snug mb-6">
            &ldquo;I saved over $400 last month just by renting from my neighbors instead of traditional rental companies.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold">
              M
            </div>
            <div>
              <p className="text-white font-medium text-sm">Marcus T.</p>
              <p className="text-white/60 text-xs">Resident, Crystal Flats · 34 trips</p>
            </div>
          </div>
        </div>
        <p className="text-white/40 text-xs">© 2025 GarKar Technologies Inc.</p>
      </div>

      {/* Right — form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-12">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary mb-8 lg:hidden">
          <Car className="w-5 h-5" /> GarKar
        </Link>

        <div className="max-w-sm w-full mx-auto lg:mx-0">
          <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm mb-8">Log in to your community account</p>

          {justApproved && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-green-600" />
              <span className="font-medium">Your account has been approved! You&apos;re all set to start.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive rounded-lg bg-destructive/10 px-3 py-2">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full h-11">
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-primary font-medium hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
