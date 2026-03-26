'use client';

import Link from 'next/link';
import { Bell, HelpCircle, Car } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { clearAuth, isLoggedIn } from '@/lib/auth';

export default function Navbar() {
  const router = useRouter();
  const loggedIn = isLoggedIn();

  function handleLogout() {
    clearAuth();
    router.push('/auth/login');
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <Car className="w-6 h-6" />
            GarKar
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/browse" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Browse Cars
            </Link>
            {loggedIn && (
              <Link href="/my-trips" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                My Bookings
              </Link>
            )}
            <Link href="/help" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Help
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {loggedIn ? (
              <>
                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                  <Bell className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                  <HelpCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={handleLogout}
                  className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center justify-center"
                >
                  U
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
