'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Save, Clock, Calendar } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_KEYS   = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

type DayStatus = 'available' | 'blocked' | 'booked' | 'weekly-off' | 'past' | 'today';

interface BookingRange {
  startDate: string;
  endDate: string;
  status: string;
}

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

export default function AvailabilityPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, boolean>>(
    { sun: false, mon: true, tue: true, wed: true, thu: true, fri: true, sat: false }
  );
  const [hoursStart, setHoursStart] = useState('07:00');
  const [hoursEnd,   setHoursEnd]   = useState('21:00');
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [bookings,     setBookings]     = useState<BookingRange[]>([]);

  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [carName, setCarName] = useState('');

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const [avail, car] = await Promise.all([
        api.getCarAvailability(id, year, month),
        api.getCar(id),
      ]);
      const c = car as { make: string; model: string; year: number };
      setCarName(`${c.year} ${c.make} ${c.model}`);
      setWeeklySchedule({ sun: true, mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, ...avail.weeklySchedule });
      setHoursStart(avail.availableHoursStart);
      setHoursEnd(avail.availableHoursEnd);
      setBlockedDates(avail.blockedDates);
      setBookings(avail.bookings);
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }, [id, year, month]);

  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  function getDayStatus(dateStr: string): DayStatus {
    const d = new Date(dateStr + 'T12:00:00');
    const todayStr = toDateStr(now.getFullYear(), now.getMonth() + 1, now.getDate());
    if (dateStr < todayStr) return 'past';
    if (dateStr === todayStr) return 'today';
    const dayKey = DAY_KEYS[d.getDay()];
    if (!weeklySchedule[dayKey]) return 'weekly-off';
    if (bookings.some(b => {
      const s = b.startDate.split('T')[0];
      const e = b.endDate.split('T')[0];
      return dateStr >= s && dateStr <= e;
    })) return 'booked';
    if (blockedDates.includes(dateStr)) return 'blocked';
    return 'available';
  }

  function toggleDay(dateStr: string) {
    const status = getDayStatus(dateStr);
    if (status === 'past' || status === 'booked' || status === 'weekly-off') return;
    setBlockedDates(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.updateCarAvailability(id, {
        weeklySchedule,
        availableHoursStart: hoursStart,
        availableHoursEnd: hoursEnd,
        blockedDates,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  // Build calendar grid
  const daysInMonth = getDaysInMonth(year, month);
  const firstDow    = getFirstDayOfWeek(year, month);
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const statusStyles: Record<DayStatus, string> = {
    available:   'bg-white hover:bg-green-50 cursor-pointer text-gray-800 border-gray-100',
    blocked:     'bg-red-50 hover:bg-red-100 cursor-pointer text-red-700 border-red-200',
    booked:      'bg-blue-50 text-blue-600 border-blue-100 cursor-default',
    'weekly-off':'bg-gray-50 text-gray-300 border-gray-100 cursor-default',
    past:        'bg-gray-50 text-gray-300 border-gray-50 cursor-default',
    today:       'bg-white hover:bg-green-50 cursor-pointer text-gray-800 border-blue-400 ring-1 ring-blue-400 font-bold',
  };

  const availableDaysThisMonth = cells
    .filter(d => d !== null)
    .filter(d => getDayStatus(toDateStr(year, month, d as number)) === 'available').length;
  const blockedThisMonth = cells
    .filter(d => d !== null)
    .filter(d => getDayStatus(toDateStr(year, month, d as number)) === 'blocked').length;
  const bookedThisMonth = cells
    .filter(d => d !== null)
    .filter(d => getDayStatus(toDateStr(year, month, d as number)) === 'booked').length;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Availability Calendar</h1>
            <p className="text-sm text-gray-500">{carName || 'Loading…'}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Changes'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: calendar */}
          <div className="lg:col-span-2">
            {/* Month nav */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-5">
                <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="text-base font-semibold text-gray-900">
                  {MONTH_NAMES[month - 1]} {year}
                </h2>
                <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_LABELS.map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              {loading ? (
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((day, idx) => {
                    if (!day) return <div key={idx} />;
                    const dateStr = toDateStr(year, month, day);
                    const status  = getDayStatus(dateStr);
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleDay(dateStr)}
                        className={`aspect-square rounded-lg border text-sm flex items-center justify-center transition-colors ${statusStyles[status]}`}
                        title={status === 'booked' ? 'Booked — cannot change' : status === 'weekly-off' ? 'Weekly unavailable day' : status === 'blocked' ? 'Click to unblock' : 'Click to block'}
                      >
                        {day}
                        {status === 'blocked' && <span className="sr-only">blocked</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
                {[
                  { color: 'bg-white border border-gray-200', label: 'Available' },
                  { color: 'bg-red-50 border border-red-200', label: 'Blocked by you' },
                  { color: 'bg-blue-50 border border-blue-200', label: 'Booked' },
                  { color: 'bg-gray-100 border border-gray-100', label: 'Day off' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <div className={`w-3.5 h-3.5 rounded ${color}`} />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Month stats */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: 'Available', value: availableDaysThisMonth, color: 'text-green-600' },
                { label: 'Blocked',   value: blockedThisMonth,       color: 'text-red-500' },
                { label: 'Booked',    value: bookedThisMonth,        color: 'text-blue-600' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label} days</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: settings */}
          <div className="space-y-4">
            {/* Weekly schedule */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">Weekly Schedule</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Toggle which days of the week your car is generally available.
              </p>
              <div className="grid grid-cols-7 gap-1">
                {DAY_KEYS.map((key, i) => (
                  <div key={key} className="flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-400">{DAY_LABELS[i].charAt(0)}</span>
                    <button
                      onClick={() => {
                        setWeeklySchedule(prev => ({ ...prev, [key]: !prev[key] }));
                        setSaved(false);
                      }}
                      className={`w-8 h-8 rounded-full text-xs font-semibold transition-colors ${
                        weeklySchedule[key]
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {weeklySchedule[key] ? '✓' : '✕'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Available hours */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">Available Hours</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Set the daily window when your car can be picked up and returned.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">From</label>
                  <input
                    type="time"
                    value={hoursStart}
                    onChange={(e) => { setHoursStart(e.target.value); setSaved(false); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">To</label>
                  <input
                    type="time"
                    value={hoursEnd}
                    onChange={(e) => { setHoursEnd(e.target.value); setSaved(false); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Quick block actions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const todayStr = toDateStr(now.getFullYear(), now.getMonth() + 1, now.getDate());
                    const remaining: string[] = [];
                    for (let d = 1; d <= daysInMonth; d++) {
                      const ds = toDateStr(year, month, d);
                      if (ds >= todayStr) remaining.push(ds);
                    }
                    setBlockedDates(prev => [...new Set([...prev, ...remaining])]);
                    setSaved(false);
                  }}
                  className="w-full text-left text-xs font-medium text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Block rest of this month
                </button>
                <button
                  onClick={() => {
                    const todayStr = toDateStr(now.getFullYear(), now.getMonth() + 1, now.getDate());
                    setBlockedDates(prev =>
                      prev.filter(d => {
                        const [y2, m2] = d.split('-').map(Number);
                        return !(y2 === year && m2 === month && d >= todayStr);
                      })
                    );
                    setSaved(false);
                  }}
                  className="w-full text-left text-xs font-medium text-green-600 hover:text-green-700 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors"
                >
                  Unblock rest of this month
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
