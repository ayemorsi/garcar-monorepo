'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car,
  Calendar,
  ChevronRight,
  Headphones,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';

type Tab = 'upcoming' | 'past';

interface Booking {
  _id: string;
  carId: {
    _id: string;
    make: string;
    model: string;
    year: number;
    price: number;
  };
  ownerId: {
    _id: string;
    firstName?: string;
    lastName?: string;
    username: string;
  };
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function BookingRow({ booking, isPast }: { booking: Booking; isPast: boolean }) {
  const carName = booking.carId
    ? `${booking.carId.year} ${booking.carId.make} ${booking.carId.model}`
    : 'Unknown Car';
  const ownerName = booking.ownerId?.firstName
    ? `${booking.ownerId.firstName} ${booking.ownerId.lastName ?? ''}`.trim()
    : booking.ownerId?.username ?? 'Owner';
  const dates = `${formatDate(booking.startDate)} – ${formatDate(booking.endDate)}`;

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow ${isPast ? 'opacity-80' : ''}`}>
      {/* Car icon */}
      <div className="hidden sm:flex w-24 h-16 bg-gray-100 rounded-lg items-center justify-center flex-shrink-0">
        <Car className="w-8 h-8 text-gray-300" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            booking.status === 'confirmed' ? 'text-green-700 bg-green-50' :
            booking.status === 'pending' ? 'text-yellow-700 bg-yellow-50' :
            booking.status === 'completed' ? 'text-gray-500 bg-gray-100' :
            'text-red-700 bg-red-50'
          }`}>
            {booking.status.toUpperCase()}
          </span>
        </div>
        <h3 className="font-semibold text-gray-900 text-sm">{carName}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {dates}
          </span>
          <span>{ownerName}</span>
          <span className="font-semibold text-gray-800">Total: ${booking.totalPrice}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isPast ? (
          <Link
            href={`/reviews/${booking._id}`}
            className="border border-blue-300 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3" />
            Leave Review
          </Link>
        ) : (
          <Link
            href="/messages"
            className="border border-gray-300 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
          >
            <MessageCircle className="w-3 h-3" />
            Message Owner
          </Link>
        )}
      </div>
    </div>
  );
}

export default function MyTripsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getBookings()
      .then((data) => setBookings(data as Booking[]))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load bookings'))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcoming = bookings.filter((b) => new Date(b.endDate) >= now && b.status !== 'cancelled');
  const past = bookings.filter((b) => new Date(b.endDate) < now || b.status === 'completed');

  const tabs: Array<{ id: Tab; label: string; count?: number }> = [
    { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { id: 'past', label: 'Past', count: past.length },
  ];

  const displayed = activeTab === 'upcoming' ? upcoming : past;

  return (
    <AppLayout>
      {/* Page header */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Trips</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your neighborly rentals within the complex.</p>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-5 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10">
        {loading ? (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white border border-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        ) : displayed.length > 0 ? (
          <div className="mt-4 space-y-3">
            <h2 className="text-base font-semibold text-gray-900">
              {activeTab === 'upcoming' ? 'Upcoming Trips' : 'Past Trips'}
              <span className="ml-2 text-sm font-normal text-gray-400">{displayed.length} reservation{displayed.length !== 1 ? 's' : ''}</span>
            </h2>
            {displayed.map((booking) => (
              <BookingRow key={booking._id} booking={booking} isPast={activeTab === 'past'} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 mt-4">
            <Car className="w-12 h-12 mb-3 text-gray-200" />
            <p className="text-gray-500 font-medium">
              {activeTab === 'upcoming' ? 'No upcoming trips' : 'No past trips yet'}
            </p>
            <p className="text-sm mt-1 text-center">
              {activeTab === 'upcoming' ? 'Book a car to get started.' : 'Your completed rentals will appear here.'}
            </p>
            <Link
              href="/browse"
              className="mt-4 text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              Browse available cars
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Support banner */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mb-10">
        <div className="bg-blue-600 rounded-xl px-5 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Need help with a trip?</p>
              <p className="text-blue-100 text-xs mt-0.5">Our support team is available 24/7 for any issues during your rental.</p>
            </div>
          </div>
          <button className="bg-white text-blue-600 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap flex-shrink-0 w-full sm:w-auto">
            Contact Support
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
