'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface AdminBooking {
  _id: string;
  renterId?: { firstName?: string; lastName?: string; username: string };
  ownerId?: { username: string };
  carId?: { make: string; model: string; year: number };
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-900/50 text-amber-400',
  confirmed: 'bg-blue-900/50 text-blue-400',
  completed: 'bg-green-900/50 text-green-400',
  cancelled: 'bg-red-900/50 text-red-400',
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (status) params.status = status;
    (api.adminGetBookings(params) as Promise<AdminBooking[]>)
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status]);

  const total = bookings.reduce((s, b) => s + (b.totalPrice || 0), 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Bookings</h1>
        <p className="text-gray-400 text-sm mt-1">All platform bookings</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {(['all', 'pending', 'confirmed', 'completed'] as const).map((s) => {
          const count = s === 'all' ? bookings.length : bookings.filter((b) => b.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatus(s === 'all' ? '' : s)}
              className={`bg-gray-900 border rounded-xl p-4 text-left transition-colors ${
                (s === 'all' ? !status : status === s) ? 'border-blue-500' : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <p className="text-xs text-gray-500 uppercase font-medium mb-1 capitalize">{s === 'all' ? 'Total' : s}</p>
              <p className="text-xl font-bold text-white">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
          <span className="text-xs text-gray-500">{bookings.length} bookings</span>
          <span className="text-xs text-gray-400 font-medium">
            Total value: <span className="text-white">${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/50">
                {['Booking ID', 'Renter', 'Car', 'Host', 'Dates', 'Amount', 'Status'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">Loading...</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">No bookings found.</td></tr>
              ) : bookings.map((b) => {
                const renter = b.renterId?.firstName
                  ? `${b.renterId.firstName} ${b.renterId.lastName ?? ''}`.trim()
                  : b.renterId?.username ?? '—';
                const car = b.carId ? `${b.carId.year} ${b.carId.make} ${b.carId.model}` : '—';
                return (
                  <tr key={b._id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{b._id.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3 text-gray-200 font-medium">{renter}</td>
                    <td className="px-4 py-3 text-gray-400">{car}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">@{b.ownerId?.username ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmt(b.startDate)} – {fmt(b.endDate)}</td>
                    <td className="px-4 py-3 font-semibold text-white">${b.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[b.status] ?? 'bg-gray-700 text-gray-400'}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
