'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Car,
  Plus,
  Edit2,
  Calendar,
  TrendingUp,
  List,
  DollarSign,
  Trash2,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';

interface CarListing {
  _id: string;
  make: string;
  model: string;
  year: number;
  available: boolean;
  price: number;
  licensePlate: string;
  type: string;
}

const STATUS_CONFIG = {
  active: { label: 'Active', dotColor: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' },
  hidden: { label: 'Hidden', dotColor: 'bg-gray-400', textColor: 'text-gray-600', bgColor: 'bg-gray-100' },
};

export default function MyCarsPage() {
  const [cars, setCars] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.getUserCars()
      .then((data) => setCars(data as CarListing[]))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load cars'))
      .finally(() => setLoading(false));
  }, []);

  async function toggleHidden(id: string, currentAvailable: boolean) {
    try {
      await api.updateCar(id, { available: !currentAvailable } as Parameters<typeof api.updateCar>[1]);
      setCars((prev) => prev.map((c) => c._id === id ? { ...c, available: !currentAvailable } : c));
    } catch (err: unknown) {
      console.error(err);
    }
  }

  async function deleteCar(id: string) {
    if (!confirm('Are you sure you want to delete this car?')) return;
    try {
      await api.deleteCar(id);
      setCars((prev) => prev.filter((c) => c._id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete car');
    }
  }

  const filtered = cars.filter(
    (c) => `${c.make} ${c.model} ${c.year}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = cars.filter((c) => c.available).length;
  const monthlyEarnings = cars
    .filter((c) => c.available)
    .reduce((sum, c) => sum + c.price * 22 * 0.85, 0);

  return (
    <AppLayout>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Cars</h1>
            <p className="text-gray-500 mt-1 text-sm">Manage your fleet, availability, and pricing in one place.</p>
          </div>
          <Link
            href="/host/list"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Car
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Total Fleet</span>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <List className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{cars.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Active Listings</span>
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <Car className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{activeCount}</p>
            {cars.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((activeCount / cars.length) * 100)}% uptime
              </p>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Est. Monthly</span>
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ${monthlyEarnings.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Estimated at 85% occupancy
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Vehicle</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Daily Rate</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Visibility</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    Loading your cars...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    {cars.length === 0 ? (
                      <div>
                        <p className="mb-2">No cars listed yet.</p>
                        <Link href="/host/list" className="text-blue-600 hover:underline">
                          List your first car →
                        </Link>
                      </div>
                    ) : (
                      'No vehicles match your search.'
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((car) => {
                  const status = car.available ? 'active' : 'hidden';
                  const statusCfg = STATUS_CONFIG[status];
                  return (
                    <tr key={car._id} className="hover:bg-gray-50 transition-colors">
                      {/* Vehicle */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Car className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {car.make} {car.model}
                            </p>
                            <p className="text-xs text-gray-500">{car.year} · {car.licensePlate}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bgColor} ${statusCfg.textColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor}`} />
                          {statusCfg.label}
                        </span>
                      </td>

                      {/* Daily Rate */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">${car.price}/day</span>
                      </td>

                      {/* Visibility Toggle */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleHidden(car._id, car.available)}
                          className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${
                            car.available ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                          aria-checked={car.available}
                          role="switch"
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              car.available ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/host/list?carId=${car._id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </Link>
                          <Link
                            href="/host/calendar"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            Calendar
                          </Link>
                          <button
                            onClick={() => deleteCar(car._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Help Card */}
        <div className="bg-blue-600 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white mb-1">Need help managing your fleet?</h3>
            <p className="text-blue-200 text-sm">Learn best practices for maximizing your earnings and keeping renters happy.</p>
          </div>
          <button className="flex-shrink-0 bg-white text-blue-600 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-colors">
            View Owner Guide
          </button>
        </div>
      </main>
    </AppLayout>
  );
}
