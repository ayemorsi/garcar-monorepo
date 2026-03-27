'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Car, Clock, CheckCircle, Mail } from 'lucide-react';
import { getAuth } from '@/lib/auth';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function VerificationPendingPage() {
  const router = useRouter();
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    const { token } = getAuth();
    if (!token) return;

    async function checkStatus() {
      try {
        const res = await fetch(`${BASE}/auth/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.approved) {
          setApproved(true);
          setTimeout(() => router.push('/browse'), 2000);
        }
      } catch {}
    }

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [router]);

  if (approved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-green-600 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">You&apos;re Approved!</h1>
          <p className="text-gray-500">Redirecting you to browse cars…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <Car className="w-6 h-6" />
            GarKar
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full text-center">

          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-30" />
            <div className="relative w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center">
              <Clock className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">Document Submitted!</h1>
          <p className="text-gray-500 text-lg mb-8">
            Your residency document is under review. We&apos;ll approve your account as soon as possible — usually within a few hours.
          </p>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 text-left space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Account Created</p>
                <p className="text-xs text-gray-500">Done</p>
              </div>
            </div>
            <div className="ml-4 w-0.5 h-4 bg-gray-200" />
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Document Uploaded</p>
                <p className="text-xs text-gray-500">Done</p>
              </div>
            </div>
            <div className="ml-4 w-0.5 h-4 bg-gray-200" />
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shrink-0 animate-pulse">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Admin Review</p>
                <p className="text-xs text-blue-600 font-medium">In progress — usually under 24 hours</p>
              </div>
            </div>
            <div className="ml-4 w-0.5 h-4 bg-gray-200" />
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-400">Access Granted</p>
                <p className="text-xs text-gray-400">Waiting for approval</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 flex items-start gap-3 text-left mb-8">
            <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              This page checks automatically every 5 seconds. Once approved, you&apos;ll be redirected instantly.
            </p>
          </div>

          <Link href="/auth/login" className="inline-block text-sm text-blue-600 font-medium hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
