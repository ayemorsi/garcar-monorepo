'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Car, CalendarDays, MessageSquare, PlusCircle, Star, TrendingUp, Clock, MapPin, Clock3 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';

const QUICK_ACTIONS = [
  { href: '/browse', icon: Car, label: 'Browse Cars', desc: 'Find a car in your building', color: 'bg-blue-50 text-blue-600' },
  { href: '/my-trips', icon: CalendarDays, label: 'My Trips', desc: 'View all your rentals', color: 'bg-purple-50 text-purple-600' },
  { href: '/host/list', icon: PlusCircle, label: 'List My Car', desc: 'Earn by sharing your car', color: 'bg-green-50 text-green-600' },
  { href: '/messages', icon: MessageSquare, label: 'Messages', desc: 'Chat with neighbors', color: 'bg-orange-50 text-orange-600' },
];

interface Booking {
  _id: string;
  carId: { make: string; model: string; year: number };
  ownerId: { firstName?: string; lastName?: string; username: string };
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
}

interface UserProfile {
  firstName?: string;
  lastName?: string;
  username: string;
  avgRating: number;
  tripCount: number;
  building?: string;
  isVerified?: boolean;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getBookings(),
      api.getMe(),
    ]).then(([b, p]) => {
      setBookings(b as Booking[]);
      setProfile(p as UserProfile);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcomingBookings = bookings.filter((b) => new Date(b.endDate) >= now && b.status !== 'cancelled');
  const nextBooking = upcomingBookings.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

  const displayName = profile?.firstName
    ? `${profile.firstName} ${profile.lastName ?? ''}`.trim()
    : profile?.username ?? 'there';

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Pending approval banner */}
        {!loading && profile && !profile.isVerified && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-4">
            <Clock3 className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Your account is pending approval</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Our team is reviewing your residency document. You&apos;ll get full access once approved — usually within 24 hours.
              </p>
            </div>
            <a href="/verify/residency" className="text-xs font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap underline">
              Check status →
            </a>
          </div>
        )}

        {/* Welcome */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome back, {displayName} 👋</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Here&apos;s what&apos;s happening in your community today.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Upcoming Trips</p>
              <CalendarDays className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{loading ? '—' : upcomingBookings.length}</p>
            <p className="text-sm text-gray-500 mt-1">
              {nextBooking ? `Next: ${formatDate(nextBooking.startDate)}` : 'No upcoming trips'}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Trust Score</p>
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {loading ? '—' : (profile?.avgRating ?? 0) > 0 ? (profile?.avgRating ?? 0).toFixed(1) : '—'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {loading ? '' : `${profile?.tripCount ?? 0} trips completed`}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Total Bookings</p>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{loading ? '—' : bookings.length}</p>
            <p className="text-sm text-gray-500 mt-1">All time</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_ACTIONS.map(({ href, icon: Icon, label, desc, color }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all group"
                  >
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{label}</p>
                      <p className="text-xs text-gray-500 hidden sm:block">{desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Upcoming trips */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Trips</h2>
                <Link href="/my-trips" className="text-sm text-blue-600 hover:underline font-medium">View all</Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : upcomingBookings.length === 0 ? (
                <div className="text-center py-10">
                  <Car className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No upcoming trips</p>
                  <Link href="/browse" className="mt-3 inline-block text-sm text-blue-600 font-medium hover:underline">
                    Browse available cars →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.slice(0, 3).map((booking) => {
                    const carName = booking.carId
                      ? `${booking.carId.year} ${booking.carId.make} ${booking.carId.model}`
                      : 'Unknown Car';
                    const ownerName = booking.ownerId?.firstName
                      ? `${booking.ownerId.firstName} ${booking.ownerId.lastName ?? ''}`.trim()
                      : booking.ownerId?.username ?? 'Owner';
                    return (
                      <div key={booking._id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
                          <Car className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{carName}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span className="truncate">{formatDate(booking.startDate)} – {formatDate(booking.endDate)}</span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1 ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {booking.status.toUpperCase()}
                          </span>
                          <p className="text-sm font-bold text-gray-900">${booking.totalPrice}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right — sidebar */}
          <div className="space-y-4">
            {/* Community card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" /> Your Building
              </h3>
              <p className="text-sm font-medium text-gray-900">
                {profile?.building || 'GarKar Community'}
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {profile?.building ? 'Arlington, VA' : 'Verified Residents Network'}
              </p>
              <Link
                href="/browse"
                className="mt-4 w-full block text-center bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Browse Cars
              </Link>
            </div>

            {/* Host CTA */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
              <Car className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="font-semibold mb-1">Have a car?</h3>
              <p className="text-sm text-blue-100 mb-4">Earn up to $1,200/month sharing with your neighbors.</p>
              <Link
                href="/host/list"
                className="block text-center bg-white text-blue-600 text-sm font-semibold py-2 rounded-xl hover:bg-blue-50 transition-colors"
              >
                List My Car
              </Link>
            </div>

            {/* Host dashboard link */}
            <Link
              href="/host/dashboard"
              className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 p-4 hover:border-blue-200 hover:shadow-sm transition-all"
            >
              <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Host Dashboard</p>
                <p className="text-xs text-gray-500">Manage your listings</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
