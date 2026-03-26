'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Check,
  LayoutGrid,
  List,
  AlignLeft,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';

interface Car {
  _id: string;
  make?: string;
  model?: string;
  year?: number;
  licensePlate?: string;
}

interface Booking {
  _id: string;
  carId: { _id: string } | string;
  startDate: string;
  endDate: string;
  status: string;
  renterId?: { firstName?: string; lastName?: string; username?: string };
}

type ViewMode = 'month' | 'week' | 'list';

const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  return Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDay + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });
}

function daysBetween(start: Date, end: Date): number[] {
  const days: number[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(cur.getDate());
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export default function CalendarPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [weekendsOnly, setWeekendsOnly] = useState(false);
  const [instantBooking, setInstantBooking] = useState(true);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  useEffect(() => {
    Promise.all([
      api.getUserCars() as Promise<Car[]>,
      api.getOwnerBookings() as Promise<Booking[]>,
    ])
      .then(([c, b]) => {
        setCars(c);
        setBookings(b);
        if (c.length > 0) setSelectedCarId(c[0]._id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const selectedCar = cars.find((c) => c._id === selectedCarId) ?? cars[0];

  // Get bookings for the selected car in the current month
  const carBookings = bookings.filter((b) => {
    const carId = typeof b.carId === 'object' ? b.carId._id : b.carId;
    return carId === selectedCarId;
  });

  const bookedDaysInMonth = new Set<number>();
  for (const b of carBookings) {
    if (b.status === 'cancelled') continue;
    const start = new Date(b.startDate);
    const end = new Date(b.endDate);
    // Only include days that fall in viewYear/viewMonth
    const cur = new Date(start);
    while (cur <= end) {
      if (cur.getFullYear() === viewYear && cur.getMonth() === viewMonth) {
        bookedDaysInMonth.add(cur.getDate());
      }
      cur.setDate(cur.getDate() + 1);
    }
  }

  const cells = getMonthGrid(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const confirmedCount = carBookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length;
  const pendingCount = carBookings.filter(b => b.status === 'pending').length;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const availableDays = daysInMonth - bookedDaysInMonth.size;

  return (
    <AppLayout>
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 gap-6">
        {/* Left Sidebar */}
        <aside className="w-56 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">My Vehicles</h3>
            {loading ? (
              <p className="text-xs text-gray-400">Loading...</p>
            ) : cars.length === 0 ? (
              <p className="text-xs text-gray-400">No vehicles yet.</p>
            ) : (
              <ul className="space-y-1">
                {cars.map((car) => (
                  <li key={car._id}>
                    <button
                      onClick={() => setSelectedCarId(car._id)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${
                        selectedCarId === car._id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedCarId === car._id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                      }`}>
                        {selectedCarId === car._id && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-medium truncate">{car.make} {car.model}</p>
                        <p className="text-xs text-gray-500">{car.licensePlate || car.year}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/host/list"
              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 px-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New Vehicle
            </Link>
          </div>

          {/* Quick Controls */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Controls</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-700">Weekends only</p>
                <button
                  onClick={() => setWeekendsOnly((v) => !v)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${weekendsOnly ? 'bg-blue-600' : 'bg-gray-300'}`}
                  role="switch"
                  aria-checked={weekendsOnly}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${weekendsOnly ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-700">Instant booking</p>
                <button
                  onClick={() => setInstantBooking((v) => !v)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${instantBooking ? 'bg-blue-600' : 'bg-gray-300'}`}
                  role="switch"
                  aria-checked={instantBooking}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${instantBooking ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-gray-700">GarKar</Link>
            <span>›</span>
            <Link href="/host/cars" className="hover:text-gray-700">My Vehicles</Link>
            <span>›</span>
            <span className="text-gray-900 font-medium">
              {selectedCar ? `${selectedCar.make} ${selectedCar.model}` : 'Calendar'}
            </span>
          </nav>

          {/* Heading */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Availability Calendar</h1>
              {selectedCar && (
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage when your {selectedCar.make} {selectedCar.model} is available for rental.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Calendar Card */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Month Nav */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-base font-semibold text-gray-900">{monthLabel}</h2>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); }}
                  className="text-sm text-blue-600 font-medium hover:text-blue-700 ml-1"
                >
                  Today
                </button>
              </div>
              <div className="flex border border-gray-200 rounded-lg p-0.5">
                {[
                  { mode: 'month' as ViewMode, icon: LayoutGrid, label: 'Month' },
                  { mode: 'week' as ViewMode, icon: List, label: 'Week' },
                  { mode: 'list' as ViewMode, icon: AlignLeft, label: 'List' },
                ].map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      viewMode === mode ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {cells.map((day, idx) => {
                const isBooked = day !== null && bookedDaysInMonth.has(day);
                const isToday = day !== null && day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                const isWeekend = idx % 7 === 0 || idx % 7 === 6;

                return (
                  <div
                    key={idx}
                    className={`min-h-[90px] border-b border-r border-gray-100 p-2 ${
                      !day ? 'bg-gray-50' : 'hover:bg-gray-50 transition-colors cursor-pointer'
                    } ${isWeekend && day ? 'bg-blue-50/30' : ''}`}
                  >
                    {day && (
                      <>
                        <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full mb-1 ${
                          isToday ? 'bg-blue-600 text-white' : 'text-gray-700'
                        }`}>
                          {day}
                        </span>
                        {isBooked && (
                          <div className="text-xs px-1.5 py-0.5 rounded font-medium truncate bg-blue-100 text-blue-800 border border-blue-200">
                            Booked
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 px-6 py-4 border-t border-gray-100">
              {[
                { dot: 'bg-green-500', label: 'Available' },
                { dot: 'bg-blue-500', label: 'Booked' },
                { dot: 'bg-gray-400', label: 'Blocked / Maintenance' },
              ].map(({ dot, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                  <span className="text-xs text-gray-600">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            {[
              { label: 'AVAILABLE THIS MONTH', value: `${availableDays} Days`, color: 'text-green-600' },
              { label: 'CONFIRMED BOOKINGS', value: `${confirmedCount}`, color: 'text-blue-600' },
              { label: 'PENDING REQUESTS', value: `${pendingCount}`, color: 'text-amber-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
