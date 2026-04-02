'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Car,
  Star,
  Share2,
  Heart,
  Zap,
  Fuel,
  Users,
  Settings,
  Gauge,
  CheckCircle,
  MapPin,
  Shield,
  ChevronRight,
  X,
  BadgeCheck,
  Calendar,
  Clock,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import { getAuth } from '@/lib/auth';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CarDetail {
  _id: string;
  make: string;
  model: string;
  year: number;
  type: string;
  seats: number;
  transmission: string;
  price: number;
  pricehr: number;
  description: string;
  rules: string[];
  fuelPolicy: string;
  dailyDistanceLimit: number;
  images: string[];
  available: boolean;
  licensePlate: string;
  weeklySchedule?: Record<string, boolean>;
  availableHoursStart?: string;
  availableHoursEnd?: string;
  userId: {
    _id: string;
    firstName?: string;
    lastName?: string;
    username: string;
    avgRating: number;
    tripCount: number;
    createdAt: string;
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PhotoGallery({ images }: { images: string[] }) {
  const slots = [0, 1, 2, 3];
  return (
    <div className="relative rounded-xl overflow-hidden grid grid-cols-4 grid-rows-2 gap-1 sm:gap-2 h-56 sm:h-80">
      {/* Main cover photo */}
      <div className="col-span-2 row-span-2 bg-gray-200 flex items-center justify-center overflow-hidden">
        {images[0] ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[0]}
              alt="Cover"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-full h-full flex items-center justify-center">
              <Car className="w-20 h-20 text-gray-400" />
            </div>
          </>
        ) : (
          <Car className="w-20 h-20 text-gray-400" />
        )}
      </div>
      {slots.map((i) => (
        <div key={i} className="bg-gray-300 flex items-center justify-center relative overflow-hidden">
          {images[i + 1] ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[i + 1]}
                alt={`Photo ${i + 2}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-full h-full flex items-center justify-center">
                <Car className="w-10 h-10 text-gray-400" />
              </div>
            </>
          ) : (
            <Car className="w-10 h-10 text-gray-400" />
          )}
          {i === 3 && images.length > 5 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">+{images.length - 5} more</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SpecPill({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 text-sm text-gray-700">
      <Icon className="w-3.5 h-3.5 text-blue-600" />
      <span>{label}</span>
    </div>
  );
}

function RuleItem({ label, allowed }: { label: string; allowed: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {allowed ? (
        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
      ) : (
        <X className="w-4 h-4 text-red-400 flex-shrink-0" />
      )}
      <span className={allowed ? 'text-gray-700' : 'text-gray-500'}>{label}</span>
    </div>
  );
}

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function fmtTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h < 12 ? 'am' : 'pm';
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function BookingWidget({ car }: { car: CarDetail }) {
  const router = useRouter();
  const hasHourly = car.pricehr > 0;
  const [mode, setMode] = useState<'daily' | 'hourly'>('daily');

  // Daily fields
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Hourly fields
  const [hourDate, setHourDate] = useState('');
  const [startTime, setStartTime] = useState(car.availableHoursStart || '09:00');
  const [endTime, setEndTime] = useState('11:00');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ws = car.weeklySchedule || {};
  const avStart = car.availableHoursStart || '00:00';
  const avEnd   = car.availableHoursEnd   || '23:59';

  // Which days are available
  const enabledDays = DAY_NAMES.filter(d => ws[d] !== false);
  const enabledDayLabels = DAY_LABELS.filter((_, i) => ws[DAY_NAMES[i]] !== false);

  function validateDate(dateStr: string): string {
    if (!dateStr) return '';
    const day = DAY_NAMES[new Date(dateStr + 'T12:00').getDay()];
    if (ws[day] === false) return `Not available on ${DAY_LABELS[DAY_NAMES.indexOf(day)]}s`;
    return '';
  }

  function validateRange(s: string, e: string): string {
    if (!s || !e) return '';
    const start = new Date(s + 'T12:00');
    const end   = new Date(e + 'T12:00');
    for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 86400000)) {
      const day = DAY_NAMES[d.getDay()];
      if (ws[day] === false) return `Not available on ${DAY_LABELS[DAY_NAMES.indexOf(day)]}s`;
    }
    return '';
  }

  function validateTimes(s: string, e: string): string {
    if (toMinutes(s) < toMinutes(avStart)) return `Available from ${fmtTime(avStart)}`;
    if (toMinutes(e) > toMinutes(avEnd)) return `Available until ${fmtTime(avEnd)}`;
    if (toMinutes(e) <= toMinutes(s)) return 'End time must be after start time';
    return '';
  }

  // Daily calculations
  const days = startDate && endDate
    ? Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  // Hourly calculations
  const hours = (() => {
    const diff = toMinutes(endTime) - toMinutes(startTime);
    return Math.max(1, Math.ceil(diff / 60));
  })();

  const subtotal = mode === 'hourly' ? car.pricehr * hours : car.price * days;
  const serviceFee = Math.round(subtotal * 0.12);
  const protection = 15;
  const total = subtotal + serviceFee + protection;

  async function handleBook() {
    const { userId } = getAuth();
    if (!userId) {
      router.push('/auth/login?next=' + window.location.pathname);
      return;
    }
    if (mode === 'daily') {
      if (!startDate || !endDate) { setError('Please select trip dates.'); return; }
      const rangeErr = validateRange(startDate, endDate);
      if (rangeErr) { setError(rangeErr); return; }
    }
    if (mode === 'hourly') {
      if (!hourDate) { setError('Please select a date.'); return; }
      const dayErr = validateDate(hourDate);
      if (dayErr) { setError(dayErr); return; }
      const timeErr = validateTimes(startTime, endTime);
      if (timeErr) { setError(timeErr); return; }
    }
    try {
      setLoading(true);
      setError('');
      if (mode === 'hourly') {
        await api.createBooking({ carId: car._id, startDate: hourDate, startTime, endTime, bookingType: 'hourly' });
      } else {
        await api.createBooking({ carId: car._id, startDate, endDate, bookingType: 'daily' });
      }
      router.push('/my-trips');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-20">
      {/* Price header */}
      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-2xl font-bold text-gray-900">
          ${mode === 'hourly' ? car.pricehr : car.price}
        </span>
        <span className="text-gray-500 text-sm">{mode === 'hourly' ? '/hr' : '/day'}</span>
        {hasHourly && mode === 'daily' && (
          <span className="ml-auto text-xs text-gray-400">${car.pricehr}/hr also available</span>
        )}
      </div>

      {/* Availability summary */}
      {enabledDays.length < 7 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 mb-4">
          <p className="text-xs font-semibold text-gray-700 mb-1.5">
            <Clock className="w-3 h-3 inline mr-1" />
            Available schedule
          </p>
          <div className="flex gap-1 mb-1.5">
            {DAY_LABELS.map((label, i) => {
              const enabled = ws[DAY_NAMES[i]] !== false;
              return (
                <span
                  key={label}
                  className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center ${
                    enabled ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {label[0]}
                </span>
              );
            })}
          </div>
          <p className="text-xs text-gray-500">
            {fmtTime(avStart)} – {fmtTime(avEnd)}
          </p>
        </div>
      )}

      {/* Daily / Hourly toggle — only show if pricehr is set */}
      {hasHourly && (
        <div className="flex border border-gray-200 rounded-lg p-1 mb-4">
          {(['daily', 'hourly'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                mode === m ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {m === 'daily' ? <Calendar className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              {m}
            </button>
          ))}
        </div>
      )}

      {/* Inputs */}
      {mode === 'daily' ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
          <div className="grid grid-cols-2 divide-x divide-gray-200">
            <div className="p-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Start</label>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <input
                  type="date"
                  value={startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => { setStartDate(e.target.value); setError(validateDate(e.target.value)); }}
                  className="text-sm text-gray-800 focus:outline-none w-full"
                />
              </div>
            </div>
            <div className="p-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">End</label>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <input
                  type="date"
                  value={endDate}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => { setEndDate(e.target.value); setError(validateRange(startDate, e.target.value)); }}
                  className="text-sm text-gray-800 focus:outline-none w-full"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
          <div className="p-3 border-b border-gray-200">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date</label>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                type="date"
                value={hourDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => { setHourDate(e.target.value); setError(validateDate(e.target.value)); }}
                className="text-sm text-gray-800 focus:outline-none w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-200">
            <div className="p-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">From</label>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <input
                  type="time"
                  value={startTime}
                  min={avStart}
                  max={avEnd}
                  onChange={(e) => { setStartTime(e.target.value); setError(validateTimes(e.target.value, endTime)); }}
                  className="text-sm text-gray-800 focus:outline-none w-full"
                />
              </div>
            </div>
            <div className="p-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">To</label>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <input
                  type="time"
                  value={endTime}
                  min={avStart}
                  max={avEnd}
                  onChange={(e) => { setEndTime(e.target.value); setError(validateTimes(startTime, e.target.value)); }}
                  className="text-sm text-gray-800 focus:outline-none w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

      <button
        onClick={handleBook}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg text-sm transition-colors mb-2"
      >
        {loading ? 'Booking...' : 'Request to Book'}
      </button>
      <p className="text-center text-xs text-gray-400 mb-4">You won&apos;t be charged yet</p>

      {/* Pricing breakdown */}
      <div className="space-y-2 text-sm">
        {mode === 'daily' ? (
          <div className="flex justify-between text-gray-600">
            <span>${car.price} × {days} day{days !== 1 ? 's' : ''}</span>
            <span>${subtotal}</span>
          </div>
        ) : (
          <div className="flex justify-between text-gray-600">
            <span>${car.pricehr} × {hours} hour{hours !== 1 ? 's' : ''}</span>
            <span>${subtotal}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-600">
          <span>GarKar service fee</span>
          <span>${serviceFee}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Basic Protection</span>
          <span>${protection}</span>
        </div>
        <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold text-gray-900">
          <span>Total</span>
          <span>${total}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2.5">
        <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <p className="text-xs text-blue-700 font-medium">
          Trust &amp; Safety — All rentals are protected by GarKar Insurance
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [car, setCar] = useState<CarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCar(id)
      .then((data) => setCar(data as CarDetail))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load car'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-gray-400">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  if (error || !car) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <p className="text-red-600 mb-3">{error || 'Car not found'}</p>
            <Link href="/browse" className="text-blue-600 hover:underline text-sm">← Back to Browse</Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const ownerName = car.userId?.firstName
    ? `${car.userId.firstName} ${car.userId.lastName ?? ''}`.trim()
    : car.userId?.username ?? 'Owner';

  const joinedYear = car.userId?.createdAt
    ? new Date(car.userId.createdAt).getFullYear()
    : 'N/A';

  const typeIcon = car.type === 'Electric' ? Zap : Fuel;

  return (
    <AppLayout>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Link href="/browse" className="hover:text-gray-700">Browse</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 font-medium">{car.make} {car.model}</span>
        </div>
      </div>

      {/* Photo gallery */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mb-4 sm:mb-8">
        <PhotoGallery images={car.images ?? []} />
      </div>

      {/* Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Left column */}
          <div className="flex-1 min-w-0">
            {/* Title + actions */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{car.year} {car.make} {car.model}</h1>
                <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>GarKar Community</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <button className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                  <Heart className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mb-5">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-gray-900">{(car.userId?.avgRating || 4.8).toFixed(1)}</span>
              <span className="text-gray-400">·</span>
              <span className="text-sm text-gray-600">{car.userId?.tripCount || 0} trips</span>
            </div>

            {/* Spec pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              <SpecPill icon={typeIcon} label={car.type} />
              <SpecPill icon={Users} label={`${car.seats} Seats`} />
              <SpecPill icon={Settings} label={car.transmission} />
              <SpecPill icon={Gauge} label={`${car.dailyDistanceLimit} mi/day`} />
            </div>

            <hr className="border-gray-200 mb-6" />

            {/* Host info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold text-lg">
                  {ownerName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{ownerName}</span>
                  <BadgeCheck className="w-4 h-4 text-blue-600" />
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                    Verified Host
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Joined {joinedYear} · {car.userId?.tripCount || 0} trips completed
                </p>
              </div>
            </div>

            <hr className="border-gray-200 mb-6" />

            {/* About */}
            {car.description && (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">About this car</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">{car.description}</p>
                </div>
                <hr className="border-gray-200 mb-6" />
              </>
            )}

            {/* Rules */}
            {car.rules && car.rules.length > 0 && (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Car Rules</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {car.rules.map((rule) => (
                      <RuleItem key={rule} label={rule} allowed={!rule.toLowerCase().includes('no')} />
                    ))}
                  </div>
                </div>
                <hr className="border-gray-200 mb-6" />
              </>
            )}

            {/* Fuel Policy */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Fuel Policy</h2>
              <p className="text-gray-600 text-sm">{car.fuelPolicy}</p>
            </div>

            <hr className="border-gray-200 mb-6" />

            {/* Map placeholder */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Car Location</h2>
              <div className="w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                <div className="text-center text-gray-400">
                  <MapPin className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">GarKar Community Building</p>
                  <p className="text-xs">Plate: {car.licensePlate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right sticky sidebar */}
          <div className="w-full lg:w-80 lg:flex-shrink-0">
            <BookingWidget car={car} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
