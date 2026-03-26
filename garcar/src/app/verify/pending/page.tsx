'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Car, CheckCircle, Clock, UserCircle, BookOpen } from 'lucide-react';

function VerificationPendingContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') || '';

  const steps = [
    { label: 'Sign Up', date: 'Completed on Oct 12, 2023', status: 'done' },
    { label: 'Documents Uploaded', date: 'Completed on Oct 12, 2023', status: 'done' },
    { label: 'Admin Review', date: 'In Progress — Usually takes < 24h', status: 'pending' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <Car className="w-6 h-6" />
            GarKar
          </Link>
          <nav className="flex items-center gap-6 text-sm text-gray-600">
            <Link href="/cars">Cars</Link>
            <Link href="/community">Community</Link>
            <Link href="/my-bookings">My Bookings</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Status card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-2">Verification Status</p>
              <h1 className="text-3xl font-bold text-gray-900">We&apos;re verifying your residency</h1>
              <p className="text-gray-500 mt-2">
                The community admin at{' '}
                <strong className="text-gray-900">GarKar admin</strong> is currently reviewing your
                documents. This usually takes less than 24 hours.
              </p>
            </div>
            <div className="shrink-0 ml-4">
              <span className="inline-block border border-yellow-300 bg-yellow-50 rounded-full px-3 py-1 text-xs text-yellow-700 font-medium">
                Pending Review
              </span>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-0">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      step.status === 'done'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.status === 'done' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  {i < steps.length - 1 && <div className="w-0.5 h-8 bg-gray-200 my-1" />}
                </div>
                <div className="pb-6">
                  <p className="text-sm font-semibold text-gray-900">{step.label}</p>
                  <p className={`text-sm ${step.status === 'pending' ? 'text-blue-600' : 'text-gray-500'}`}>
                    {step.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* While you wait */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            ✦ While you wait...
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href={`/profile/edit?userId=${userId}`}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-32 bg-amber-50 flex items-center justify-center">
                <UserCircle className="w-16 h-16 text-amber-300" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">Complete Profile</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Add a high-quality photo and additional driver details to speed up your first booking once approved.
                </p>
              </div>
            </Link>

            <Link
              href="/faq"
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-32 bg-gray-100 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-gray-400" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">Browse FAQs</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Learn about Serenity Oaks car-sharing rules, parking locations, and insurance guidelines.
                </p>
              </div>
            </Link>
          </div>
        </div>

        <p className="text-sm text-center text-gray-500">
          Questions? Our support team is here to help.{' '}
          <Link href="/support" className="text-blue-600 font-medium hover:underline">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerificationPendingPage() {
  return (
    <Suspense>
      <VerificationPendingContent />
    </Suspense>
  );
}
