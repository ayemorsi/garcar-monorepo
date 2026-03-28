'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car,
  Plus,
  DollarSign,
  MessageCircle,
  Star,
  Users,
  Zap,
  Fuel,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';

interface HostStats {
  totalCars: number;
  activeCars: number;
  totalBookings: number;
  pendingRequests: number;
  totalEarnings: number;
  monthlyEarnings: number;
}

interface OwnerBooking {
  _id: string;
  carId: { make: string; model: string; licensePlate?: string };
  renterId: { firstName?: string; lastName?: string; username: string; avgRating?: number; tripCount?: number };
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number;
}

interface UserCar {
  _id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  available: boolean;
  type: string;
  price: number;
}

function VehicleToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="focus:outline-none">
      {active ? (
        <ToggleRight className="w-8 h-8 text-blue-600" />
      ) : (
        <ToggleLeft className="w-8 h-8 text-gray-300" />
      )}
    </button>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function OwnerDashboardPage() {
  const [stats, setStats] = useState<HostStats | null>(null);
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [cars, setCars] = useState<UserCar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getHostStats(),
      api.getOwnerBookings(),
      api.getUserCars(),
    ]).then(([s, b, c]) => {
      setStats(s as HostStats);
      setBookings((b as OwnerBooking[]).slice(0, 5));
      setCars(c as UserCar[]);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function toggleCarAvailability(id: string, current: boolean) {
    try {
      await api.updateCar(id, { available: !current } as Parameters<typeof api.updateCar>[1]);
      setCars((prev) => prev.map((c) => c._id === id ? { ...c, available: !current } : c));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Host Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">{"Here's what's happening with your fleet."}</p>
          </div>
          <Link
            href="/host/list"
            className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Car</span>
          </Link>
        </div>

        {/* Nav links — horizontal scroll on mobile */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-hide">
          {[
            { href: '/host/dashboard', label: 'Dashboard', active: true },
            { href: '/host/cars', label: 'My Cars', active: false },
            { href: '/host/bookings', label: 'Bookings', active: false },
            { href: '/host/earnings', label: 'Earnings', active: false },
            { href: '/messages', label: 'Messages', active: false },
          ].map(({ href, label, active }) => (
            <Link
              key={href}
              href={href}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium mb-1">Total Earnings</div>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '—' : `$${(stats?.totalEarnings ?? 0).toLocaleString()}`}
                </div>
              </div>
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-xs text-gray-500">This month: ${(stats?.monthlyEarnings ?? 0).toLocaleString()}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium mb-1">Total Bookings</div>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '—' : stats?.totalBookings ?? 0}
                </div>
              </div>
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-xs text-gray-500">{stats?.pendingRequests ?? 0} pending requests</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium mb-1">Active Cars</div>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '—' : stats?.activeCars ?? 0}
                </div>
              </div>
              <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              </div>
            </div>
            <div className="text-xs text-gray-500">{stats?.totalCars ?? 0} total in fleet</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Bookings — card view on mobile, table on desktop */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Recent Bookings</h2>
              <Link href="/host/bookings" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : bookings.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No bookings yet</div>
            ) : (
              <>
                {/* Mobile card view */}
                <div className="sm:hidden divide-y divide-gray-50">
                  {bookings.map((booking) => {
                    const guestName = booking.renterId?.firstName
                      ? `${booking.renterId.firstName} ${booking.renterId.lastName ?? ''}`.trim()
                      : booking.renterId?.username ?? 'Guest';
                    const carName = booking.carId
                      ? `${booking.carId.make} ${booking.carId.model}`
                      : 'Unknown';
                    return (
                      <div key={booking._id} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900 text-sm">{guestName}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-lg ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            booking.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{carName} · {formatDate(booking.startDate)} – {formatDate(booking.endDate)}</p>
                      </div>
                    );
                  })}
                </div>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Guest', 'Vehicle', 'Dates', 'Status'].map((h) => (
                          <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {bookings.map((booking) => {
                        const guestName = booking.renterId?.firstName
                          ? `${booking.renterId.firstName} ${booking.renterId.lastName ?? ''}`.trim()
                          : booking.renterId?.username ?? 'Guest';
                        const carName = booking.carId
                          ? `${booking.carId.make} ${booking.carId.model}`
                          : 'Unknown';
                        return (
                          <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                  {guestName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{guestName}</div>
                                  {booking.renterId?.tripCount !== undefined && (
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3 text-green-500" />
                                      {booking.renterId.tripCount} trips
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-gray-900 font-medium">{carName}</div>
                              {booking.carId?.licensePlate && (
                                <div className="text-xs text-gray-400 font-mono">{booking.carId.licensePlate}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                              {formatDate(booking.startDate)} – {formatDate(booking.endDate)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded-lg ${
                                booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                booking.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Vehicle Status */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Vehicle Status</h2>
            {loading ? (
              <div className="text-gray-400 text-sm">Loading...</div>
            ) : cars.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
                <Car className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No cars listed yet</p>
                <Link href="/host/list" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
                  List your first car →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {cars.map((car) => (
                  <div key={car._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="bg-gray-100 rounded-lg h-20 flex items-center justify-center mb-3">
                      <Car className="w-10 h-10 text-gray-300" />
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-sm text-gray-900">{car.make} {car.model}</div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          car.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {car.available ? 'LIVE' : 'OFF'}
                        </span>
                        <VehicleToggle
                          active={car.available}
                          onToggle={() => toggleCarAvailability(car._id, car.available)}
                        />
                      </div>
                    </div>

                    <div className="text-xs font-mono text-gray-500 mb-1">{car.licensePlate}</div>
                    <div className="text-xs text-gray-500">{car.year} · {car.type}</div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        {car.available ? (
                          <Eye className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                        )}
                        {car.available ? 'Visible' : 'Hidden'}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        {car.type === 'Electric' ? (
                          <Zap className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Fuel className="w-3.5 h-3.5 text-gray-400" />
                        )}
                        ${car.price}/day
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Link href="/host/list" className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Add Car</p>
              <p className="text-xs text-gray-500 hidden sm:block">List a new vehicle</p>
            </div>
          </Link>
          <Link href="/messages" className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Messages</p>
              <p className="text-xs text-gray-500 hidden sm:block">Chat with renters</p>
            </div>
          </Link>
          <Link href="/host/earnings" className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow col-span-2 sm:col-span-1">
            <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Earnings</p>
              <p className="text-xs text-gray-500 hidden sm:block">View payouts</p>
            </div>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
