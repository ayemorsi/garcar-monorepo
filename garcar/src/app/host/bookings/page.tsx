'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car,
  Star,
  Check,
  X,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';

type BookingTab = 'pending' | 'confirmed' | 'history';

interface OwnerBooking {
  _id: string;
  carId: { _id: string; make: string; model: string; year: number; licensePlate?: string };
  renterId: {
    _id: string;
    firstName?: string;
    lastName?: string;
    username: string;
    avgRating?: number;
    tripCount?: number;
  };
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  message?: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getGuestName(b: OwnerBooking): string {
  if (b.renterId?.firstName) return `${b.renterId.firstName} ${b.renterId.lastName ?? ''}`.trim();
  return b.renterId?.username ?? 'Guest';
}

export default function BookingRequestsPage() {
  const [activeTab, setActiveTab] = useState<BookingTab>('pending');
  const [selectedId, setSelectedId] = useState<string>('');
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    api.getOwnerBookings()
      .then((data) => {
        const all = data as OwnerBooking[];
        setBookings(all);
        const first = all.find((b) => b.status === 'pending');
        if (first) setSelectedId(first._id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: 'confirmed' | 'cancelled') {
    try {
      setActionLoading(true);
      await api.updateBookingStatus(id, status);
      setBookings((prev) => prev.map((b) => b._id === id ? { ...b, status } : b));
      // Select next pending
      const nextPending = bookings.find((b) => b._id !== id && b.status === 'pending');
      if (nextPending) setSelectedId(nextPending._id);
      else setSelectedId('');
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  }

  const tabs: Array<{ key: BookingTab; label: string }> = [
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'history', label: 'History' },
  ];

  const tabBookings = bookings.filter((b) => {
    if (activeTab === 'pending') return b.status === 'pending';
    if (activeTab === 'confirmed') return b.status === 'confirmed';
    return b.status === 'completed' || b.status === 'cancelled';
  });

  const selected = bookings.find((b) => b._id === selectedId);

  return (
    <AppLayout>
      <main className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Left Panel */}
        <aside className="w-96 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-xl font-bold text-gray-900">Booking Requests</h1>
            <p className="text-sm text-gray-500 mt-0.5">Review incoming community rentals.</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-4">
            {tabs.map(({ key, label }) => {
              const count = bookings.filter((b) => {
                if (key === 'pending') return b.status === 'pending';
                if (key === 'confirmed') return b.status === 'confirmed';
                return false;
              }).length;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                  {count > 0 && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                      activeTab === key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Request List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="p-6 text-center text-sm text-gray-400">Loading...</div>
            ) : tabBookings.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No {activeTab} requests.</div>
            ) : (
              tabBookings.map((booking) => {
                const guestName = getGuestName(booking);
                const carName = booking.carId ? `${booking.carId.make} ${booking.carId.model}` : 'Unknown Car';
                const isSelected = selectedId === booking._id;
                return (
                  <button
                    key={booking._id}
                    onClick={() => setSelectedId(booking._id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {guestName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-gray-900">{guestName}</span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          {carName} · {formatDate(booking.startDate)} – {formatDate(booking.endDate)}
                        </p>
                        {booking.renterId?.avgRating !== undefined && booking.renterId.avgRating > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs font-medium text-gray-700">{booking.renterId.avgRating.toFixed(1)}</span>
                            <span className="text-xs text-gray-500">· {booking.renterId.tripCount} trips</span>
                          </div>
                        )}
                        <p className="text-xs font-semibold text-blue-600 mt-1">${booking.totalPrice}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Detail Panel */}
        <div className="flex-1 overflow-y-auto p-8">
          {selected ? (
            <div className="max-w-2xl space-y-5">
              {/* Renter Header */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                      {getGuestName(selected).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h2 className="text-lg font-bold text-gray-900">{getGuestName(selected)}</h2>
                        <div className="flex items-center gap-1 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-xs font-semibold text-green-700">Verified</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">GarKar Community Member</p>
                      {selected.renterId?.avgRating !== undefined && selected.renterId.avgRating > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-semibold text-gray-900">{selected.renterId.avgRating.toFixed(1)}</span>
                          <span className="text-sm text-gray-500">({selected.renterId.tripCount} trips)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-0.5">TOTAL</p>
                    <p className="text-2xl font-bold text-gray-900">${selected.totalPrice}</p>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Booking Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500 flex items-center gap-2">
                      <Car className="w-4 h-4 text-gray-400" />
                      Car Requested
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {selected.carId ? `${selected.carId.year} ${selected.carId.make} ${selected.carId.model}` : 'Unknown Car'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Dates</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(selected.startDate)} – {formatDate(selected.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500">Status</span>
                    <span className={`text-sm font-semibold capitalize ${
                      selected.status === 'confirmed' ? 'text-green-600' :
                      selected.status === 'pending' ? 'text-yellow-600' :
                      selected.status === 'cancelled' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {selected.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message if any */}
              {selected.message && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    Message from Renter
                  </h3>
                  <blockquote className="text-sm text-gray-600 italic border-l-4 border-blue-200 pl-4 leading-relaxed">
                    &ldquo;{selected.message}&rdquo;
                  </blockquote>
                </div>
              )}

              {/* Action Buttons — only for pending */}
              {selected.status === 'pending' && (
                <div className="flex items-center gap-3">
                  <button
                    disabled={actionLoading}
                    onClick={() => updateStatus(selected._id, 'confirmed')}
                    className="flex-1 py-3 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {actionLoading ? 'Processing...' : 'Approve Request'}
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => updateStatus(selected._id, 'cancelled')}
                    className="px-6 py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-60 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Decline
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 pt-20">
              <Car className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">Select a booking to review</p>
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
