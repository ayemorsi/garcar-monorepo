'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Car, ChevronDown, User, Settings, LogOut,
  LayoutDashboard, CalendarDays, MessageSquare, PlusCircle
} from 'lucide-react';
import { clearAuth, getAuth } from '@/lib/auth';
import NotificationBell from '@/components/NotificationBell';

const NAV_LINKS = [
  { href: '/browse', label: 'Browse Cars' },
  { href: '/my-bookings', label: 'My Bookings' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { userId } = getAuth();

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleLogout() {
    clearAuth();
    router.push('/');
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/browse" className="flex items-center gap-2 font-bold text-xl text-blue-600 shrink-0">
              <Car className="w-6 h-6" />
              GarKar
            </Link>

            {/* Center nav */}
            <div className="flex items-center gap-1">
              {NAV_LINKS.map(({ href, label }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <Link
                href="/messages"
                className={`p-2 rounded-full transition-colors ${
                  pathname.startsWith('/messages')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
              </Link>

              <NotificationBell />

              {/* Avatar dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center">
                    U
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">My Account</p>
                      <p className="text-xs text-gray-500 truncate">ID: {userId?.slice(-8)}</p>
                    </div>

                    <div className="py-1">
                      <DropdownItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={() => setDropdownOpen(false)} />
                      <DropdownItem href="/my-bookings" icon={CalendarDays} label="My Bookings" onClick={() => setDropdownOpen(false)} />
                      <DropdownItem href="/messages" icon={MessageSquare} label="Messages" onClick={() => setDropdownOpen(false)} />
                    </div>

                    <div className="border-t border-gray-100 py-1">
                      <DropdownItem href="/host/dashboard" icon={PlusCircle} label="Host Dashboard" onClick={() => setDropdownOpen(false)} />
                      <DropdownItem href="/host/list" icon={Car} label="List My Car" onClick={() => setDropdownOpen(false)} />
                    </div>

                    <div className="border-t border-gray-100 py-1">
                      <DropdownItem href="/settings" icon={Settings} label="Settings" onClick={() => setDropdownOpen(false)} />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 font-bold text-lg text-blue-600 mb-3">
                <Car className="w-5 h-5" />
                GarKar
              </div>
              <p className="text-sm text-gray-500">Rent cars from your neighbors in the same building.</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Platform</p>
              <div className="space-y-2">
                <Link href="/browse" className="block text-sm text-gray-600 hover:text-gray-900">Browse Cars</Link>
                <Link href="/host/list" className="block text-sm text-gray-600 hover:text-gray-900">Host a Car</Link>
                <Link href="/how-it-works" className="block text-sm text-gray-600 hover:text-gray-900">How it Works</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Support</p>
              <div className="space-y-2">
                <Link href="/help" className="block text-sm text-gray-600 hover:text-gray-900">Help Center</Link>
                <Link href="/contact" className="block text-sm text-gray-600 hover:text-gray-900">Contact Us</Link>
                <Link href="/terms" className="block text-sm text-gray-600 hover:text-gray-900">Terms of Service</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Account</p>
              <div className="space-y-2">
                <Link href="/dashboard" className="block text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
                <Link href="/settings" className="block text-sm text-gray-600 hover:text-gray-900">Settings</Link>
                <button onClick={handleLogout} className="block text-sm text-red-500 hover:text-red-700">Log Out</button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-8 pt-6 text-center text-xs text-gray-400">
            © 2024 GarKar Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function DropdownItem({
  href, icon: Icon, label, onClick,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <Icon className="w-4 h-4 text-gray-400" />
      {label}
    </Link>
  );
}
