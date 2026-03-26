'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Car, Shield, Users } from 'lucide-react';
import { isLoggedIn } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    if (isLoggedIn()) router.replace('/browse');
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <Car className="w-6 h-6" /> GarKar
          </span>
          <div className="flex items-center gap-4">
            <Link href="/browse" className="text-sm text-gray-600 hover:text-gray-900">Browse Cars</Link>
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">Log In</Link>
            <Link href="/auth/signup" className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 bg-gradient-to-b from-white to-gray-50">
        <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6 uppercase tracking-widest">
          Hyper-Local Car Sharing
        </span>
        <h1 className="text-5xl font-bold text-gray-900 max-w-2xl leading-tight mb-4">
          Rent cars from your neighbors
        </h1>
        <p className="text-xl text-gray-500 max-w-lg mb-10">
          Trusted, eco-friendly, and convenient car sharing for modern apartment living.
        </p>
        <div className="flex gap-4">
          <Link
            href="/auth/signup"
            className="bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-700 text-lg"
          >
            Get Started
          </Link>
          <Link
            href="/browse"
            className="border border-gray-300 text-gray-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-50 text-lg"
          >
            Browse Cars
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl w-full">
          {[
            { icon: Car, title: 'Same-Building Pickup', desc: 'Cars available right in your parking garage.' },
            { icon: Shield, title: 'Fully Insured', desc: 'Every rental covered with comprehensive protection.' },
            { icon: Users, title: 'Verified Community', desc: 'Only verified residents can rent or list cars.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-400">
        © 2024 GarKar Inc. All rights reserved.
      </footer>
    </div>
  );
}
