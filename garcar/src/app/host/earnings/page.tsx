'use client';

import { useState, useEffect } from 'react';
import {
  Download,
  ArrowUpRight,
  Filter,
  ChevronDown,
  DollarSign,
  Clock,
  Wallet,
  Building,
  FileText,
  BarChart2,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';

interface OwnerBooking {
  _id: string;
  carId: { make?: string; model?: string; year?: number };
  renterId: { firstName?: string; lastName?: string; username: string };
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getStatusStyle(status: string): string {
  if (status === 'completed') return 'bg-green-100 text-green-700';
  if (status === 'pending') return 'bg-amber-100 text-amber-700';
  if (status === 'confirmed') return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-600';
}

// ─── Earnings Chart (SVG) ─────────────────────────────────────────────────────

function EarningsChart() {
  // Smooth wave path for Jan–Jun earnings growth
  const path = 'M 0 80 C 40 80, 60 60, 100 55 C 140 50, 160 70, 200 60 C 240 50, 260 30, 300 20 C 340 10, 360 25, 400 15';
  const fillPath = path + ' L 400 100 L 0 100 Z';

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'];
  const amounts = ['$1.2k', '$1.5k', '$1.8k', '$2.1k', '$2.8k', '$3.2k'];

  return (
    <div>
      <svg viewBox="0 0 400 100" className="w-full" preserveAspectRatio="none" style={{ height: 120 }}>
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill="url(#chartGradient)" />
        <path d={path} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex justify-between mt-2">
        {months.map((m, i) => (
          <div key={m} className="flex flex-col items-center">
            <span className="text-xs text-gray-400">{m}</span>
            <span className="text-xs font-medium text-gray-600">{amounts[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EarningsPage() {
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOwnerBookings()
      .then((data) => setBookings(data as OwnerBooking[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalEarnings = bookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const pendingEarnings = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Earnings &amp; Payouts</h1>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-white transition-colors bg-white shadow-sm">
              <Download className="w-4 h-4" />
              Export Statement
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <Wallet className="w-4 h-4" />
              Withdraw Funds
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium mb-1">Total Earnings</div>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '—' : `$${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </div>
              </div>
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              From completed bookings
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium mb-1">Pending Payouts</div>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '—' : `$${pendingEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </div>
              </div>
              <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <div className="text-xs text-gray-500">From confirmed bookings</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium mb-1">Total Bookings</div>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '—' : bookings.length}
                </div>
              </div>
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-xs text-green-600 font-medium">All time</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-blue-600" />
                  <h2 className="text-base font-semibold text-gray-900">Monthly Earnings Growth</h2>
                </div>
                <button className="flex items-center gap-1 text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                  Last 6 Months <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <EarningsChart />
            </div>

            {/* Transaction history */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Transaction History</h2>
                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['Trip ID', 'Renter', 'Vehicle', 'Dates', 'Net Earnings', 'Status'].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-400">Loading...</td></tr>
                    ) : bookings.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-400">No transactions yet.</td></tr>
                    ) : bookings.map((booking) => {
                      const renterName = booking.renterId?.firstName
                        ? `${booking.renterId.firstName} ${booking.renterId.lastName ?? ''}`.trim()
                        : booking.renterId?.username ?? 'Guest';
                      const initials = renterName.charAt(0).toUpperCase();
                      const vehicle = booking.carId
                        ? `${booking.carId.year ?? ''} ${booking.carId.make ?? ''} ${booking.carId.model ?? ''}`.trim()
                        : 'Unknown';
                      return (
                        <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">{booking._id.slice(-8).toUpperCase()}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                {initials}
                              </div>
                              <span className="font-medium text-gray-900">{renterName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{vehicle}</td>
                          <td className="px-4 py-3 text-gray-600">{formatDate(booking.startDate)} – {formatDate(booking.endDate)}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900">${booking.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusStyle(booking.status)}`}>
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View All Transactions →
                </button>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Payout settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Payout Settings</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Chase Bank</div>
                  <div className="text-xs text-gray-500">Checking ••••6789</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mb-4">
                <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  VERIFIED ACCOUNT
                </span>
              </div>
              <button className="w-full text-sm text-blue-600 border border-blue-200 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                Manage Bank Accounts
              </button>
            </div>

            {/* Tax reporting */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Tax Reporting</h3>
              <div className="space-y-2 mb-4">
                {['2023 Tax Summary', '2022 Tax Summary'].map((label) => (
                  <button
                    key={label}
                    className="w-full flex items-center justify-between text-sm text-gray-700 hover:text-blue-600 py-2 px-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      {label}
                    </span>
                    <Download className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-400 text-center">SECURELY PROCESSED BY STRIPE</div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
