'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  Info,
  Zap,
  Clock,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';

type PriceTab = 'hourly' | 'daily';

interface RuleButton {
  id: string;
  label: string;
  selected: boolean;
}

interface DiscountToggle {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

type DaySchedule = { enabled: boolean; start: string; end: string };
type WeekSchedule = Record<string, DaySchedule>;

const FUEL_POLICY_OPTIONS = [
  'Return at same level',
  'Return full tank',
  'Prepaid fuel included',
  'No fuel policy',
];

const ALL_RULE_IDS = ['no-smoking', 'pet-friendly', 'clean-car', 'child-seats'];
const ALL_RULE_LABELS: Record<string, string> = {
  'no-smoking': 'No Smoking',
  'pet-friendly': 'Pet Friendly',
  'clean-car': 'Clean Car',
  'child-seats': 'Child Seats',
};

const DAYS = [
  { id: 'sun', label: 'Sun', full: 'Sunday' },
  { id: 'mon', label: 'Mon', full: 'Monday' },
  { id: 'tue', label: 'Tue', full: 'Tuesday' },
  { id: 'wed', label: 'Wed', full: 'Wednesday' },
  { id: 'thu', label: 'Thu', full: 'Thursday' },
  { id: 'fri', label: 'Fri', full: 'Friday' },
  { id: 'sat', label: 'Sat', full: 'Saturday' },
];

const DEFAULT_SCHEDULE: WeekSchedule = {
  sun: { enabled: false, start: '08:00', end: '20:00' },
  mon: { enabled: true,  start: '07:00', end: '21:00' },
  tue: { enabled: true,  start: '07:00', end: '21:00' },
  wed: { enabled: true,  start: '07:00', end: '21:00' },
  thu: { enabled: true,  start: '07:00', end: '21:00' },
  fri: { enabled: true,  start: '07:00', end: '21:00' },
  sat: { enabled: false, start: '08:00', end: '20:00' },
};

const PRESETS = [
  {
    label: 'Work week',
    description: 'Mon–Fri, 9 am–5 pm',
    apply: (): WeekSchedule => ({
      sun: { enabled: false, start: '09:00', end: '17:00' },
      mon: { enabled: true,  start: '09:00', end: '17:00' },
      tue: { enabled: true,  start: '09:00', end: '17:00' },
      wed: { enabled: true,  start: '09:00', end: '17:00' },
      thu: { enabled: true,  start: '09:00', end: '17:00' },
      fri: { enabled: true,  start: '09:00', end: '17:00' },
      sat: { enabled: false, start: '09:00', end: '17:00' },
    }),
  },
  {
    label: 'Weekends',
    description: 'Sat & Sun, all day',
    apply: (): WeekSchedule => ({
      sun: { enabled: true,  start: '07:00', end: '22:00' },
      mon: { enabled: false, start: '07:00', end: '22:00' },
      tue: { enabled: false, start: '07:00', end: '22:00' },
      wed: { enabled: false, start: '07:00', end: '22:00' },
      thu: { enabled: false, start: '07:00', end: '22:00' },
      fri: { enabled: false, start: '07:00', end: '22:00' },
      sat: { enabled: true,  start: '07:00', end: '22:00' },
    }),
  },
  {
    label: 'Every day',
    description: 'Full week, all day',
    apply: (): WeekSchedule =>
      Object.fromEntries(DAYS.map(d => [d.id, { enabled: true, start: '07:00', end: '22:00' }])),
  },
  {
    label: 'Custom',
    description: 'Set per day below',
    apply: null,
  },
];

function formatTime(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h < 12 ? 'am' : 'pm';
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function ListPricingPage() {
  const router = useRouter();
  const [priceTab, setPriceTab] = useState<PriceTab>('hourly');
  const [dailyPrice, setDailyPrice] = useState('65');
  const [hourlyPrice, setHourlyPrice] = useState('15');
  const [isEditing, setIsEditing] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>('Work week');

  const [discounts, setDiscounts] = useState<DiscountToggle[]>([
    { id: 'weekly', label: 'Weekly Discount', description: '10% off for 7+ days', enabled: true },
    { id: 'monthly', label: 'Monthly Discount', description: '25% off for 30+ days', enabled: false },
  ]);

  const [rules, setRules] = useState<RuleButton[]>([
    { id: 'no-smoking', label: 'No Smoking', selected: true },
    { id: 'pet-friendly', label: 'Pet Friendly', selected: false },
    { id: 'clean-car', label: 'Clean Car', selected: true },
    { id: 'child-seats', label: 'Child Seats', selected: false },
  ]);

  const [fuelPolicy, setFuelPolicy] = useState('Return at same level');
  const [distanceLimit, setDistanceLimit] = useState('150');
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>('mi');
  const [schedule, setSchedule] = useState<WeekSchedule>(
    PRESETS[0].apply!()
  );

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('garkar_list_car') || '{}');
    if (saved.carId) setIsEditing(true);
    if (saved.price) setDailyPrice(String(saved.price));
    if (saved.pricehr) setHourlyPrice(String(saved.pricehr));
    if (saved.fuelPolicy) setFuelPolicy(saved.fuelPolicy);
    if (saved.dailyDistanceLimit) setDistanceLimit(String(saved.dailyDistanceLimit));
    if (saved.schedule) {
      setSchedule(saved.schedule);
      setActivePreset('Custom');
    }
    if (saved.rules && Array.isArray(saved.rules)) {
      setRules(ALL_RULE_IDS.map(id => ({
        id,
        label: ALL_RULE_LABELS[id],
        selected: (saved.rules as string[]).includes(ALL_RULE_LABELS[id]),
      })));
    }
  }, []);

  function applyPreset(preset: typeof PRESETS[number]) {
    if (preset.apply) {
      setSchedule(preset.apply());
      setActivePreset(preset.label);
    } else {
      setActivePreset('Custom');
    }
  }

  function toggleDay(id: string) {
    setSchedule(prev => ({ ...prev, [id]: { ...prev[id], enabled: !prev[id].enabled } }));
    setActivePreset('Custom');
  }

  function setDayTime(id: string, field: 'start' | 'end', value: string) {
    setSchedule(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    setActivePreset('Custom');
  }

  function toggleDiscount(id: string) {
    setDiscounts(prev => prev.map(d => d.id === id ? { ...d, enabled: !d.enabled } : d));
  }

  function toggleRule(id: string) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  }

  function handleContinue() {
    const saved = JSON.parse(localStorage.getItem('garkar_list_car') || '{}');
    const selectedRules = rules.filter(r => r.selected).map(r => r.label);
    // Flatten to legacy format for backend compatibility
    const enabledDays = Object.entries(schedule).filter(([, v]) => v.enabled);
    const legacySchedule = Object.fromEntries(DAYS.map(d => [d.id, schedule[d.id].enabled]));
    const firstEnabled = enabledDays[0]?.[1];
    localStorage.setItem('garkar_list_car', JSON.stringify({
      ...saved,
      price: parseFloat(dailyPrice) || 65,
      pricehr: parseFloat(hourlyPrice) || 0,
      fuelPolicy,
      dailyDistanceLimit: parseInt(distanceLimit) || 200,
      rules: selectedRules,
      schedule,
      weeklySchedule: legacySchedule,
      availableHoursStart: firstEnabled?.start ?? '07:00',
      availableHoursEnd: firstEnabled?.end ?? '21:00',
    }));
    router.push('/host/list/standards');
  }

  const activeDaysPerWeek = Object.values(schedule).filter(d => d.enabled).length;
  const estDaysPerMonth = Math.round(activeDaysPerWeek * 4.3 * 0.6);

  const hourlyRate = parseFloat(hourlyPrice) || 0;
  const dailyRate  = parseFloat(dailyPrice)  || 0;

  const estHourlyPerDay  = Math.round(hourlyRate * 3 * 1.5 * 0.8);
  const estHourlyMonthly = Math.round(estHourlyPerDay * estDaysPerMonth);
  const estDailyMonthly  = Math.round(dailyRate * estDaysPerMonth * 0.8);

  return (
    <AppLayout>
      {/* Step header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-gray-900">
                {isEditing ? 'Edit listing' : 'Step 3 of 4'}
              </span>
              {!isEditing && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500">Next: Safety Standards</span>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => { localStorage.removeItem('garkar_list_car'); router.push('/host/list'); }}
                    className="text-blue-600 hover:underline"
                  >
                    Start over
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '75%' }} />
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Pricing & Schedule</h1>
          <p className="text-gray-500 mt-1.5 text-sm">
            Set your rate and when your car is available to rent.
          </p>
        </div>

        <div className="flex gap-8">
          {/* Left Column */}
          <div className="flex-1 space-y-5">
            {/* Set Your Rates */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Set Your Rate</h2>

              <div className="flex border border-gray-200 rounded-lg p-1 mb-5 w-fit">
                {(['hourly', 'daily'] as PriceTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setPriceTab(tab)}
                    className={`px-5 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                      priceTab === tab ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {priceTab === 'daily' ? 'Daily Price' : 'Hourly Price'}
                </label>
                <div className="relative w-40">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">$</span>
                  <input
                    type="number"
                    value={priceTab === 'daily' ? dailyPrice : hourlyPrice}
                    onChange={(e) =>
                      priceTab === 'daily' ? setDailyPrice(e.target.value) : setHourlyPrice(e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg pl-7 pr-4 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {priceTab === 'daily'
                    ? 'Charged per full day'
                    : 'Charged per hour — set to 0 to disable hourly booking'}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900">Recommended Price</p>
                    <p className="text-sm text-blue-700 mt-0.5">
                      Similar cars in your area earn <strong>$60–$85/day</strong>. Your current price is within this range.
                    </p>
                    <button
                      onClick={() => setDailyPrice('72')}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 mt-2 underline underline-offset-2"
                    >
                      Apply Suggestion
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Discounts */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Discounts & Duration</h2>
              <div className="space-y-4">
                {discounts.map((discount) => (
                  <div key={discount.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{discount.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{discount.description}</p>
                    </div>
                    <button
                      onClick={() => toggleDiscount(discount.id)}
                      className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${
                        discount.enabled ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      aria-checked={discount.enabled}
                      role="switch"
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        discount.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability Schedule */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-semibold text-gray-900">When is it available?</h2>
              </div>
              <p className="text-sm text-gray-500 mb-5">
                Set different hours per day — most hosts list Mon–Fri while their car sits in the garage.
              </p>

              {/* Presets */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => applyPreset(preset)}
                    className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      activePreset === preset.label
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <p className={`text-xs font-semibold ${activePreset === preset.label ? 'text-blue-700' : 'text-gray-800'}`}>
                      {preset.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{preset.description}</p>
                  </button>
                ))}
              </div>

              {/* Per-day schedule */}
              <div className="space-y-2">
                {DAYS.map((day) => {
                  const d = schedule[day.id];
                  return (
                    <div
                      key={day.id}
                      className={`flex items-center gap-4 rounded-xl px-4 py-3 border transition-colors ${
                        d.enabled ? 'border-blue-200 bg-blue-50/40' : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      {/* Toggle */}
                      <button
                        onClick={() => toggleDay(day.id)}
                        className={`relative w-10 h-5 rounded-full flex-shrink-0 transition-colors focus:outline-none ${
                          d.enabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                        role="switch"
                        aria-checked={d.enabled}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          d.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>

                      {/* Day name */}
                      <span className={`w-10 text-sm font-semibold flex-shrink-0 ${d.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                        {day.label}
                      </span>

                      {d.enabled ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="time"
                            value={d.start}
                            onChange={(e) => setDayTime(day.id, 'start', e.target.value)}
                            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                          <span className="text-gray-400 text-sm">–</span>
                          <input
                            type="time"
                            value={d.end}
                            onChange={(e) => setDayTime(day.id, 'end', e.target.value)}
                            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                          <span className="text-xs text-blue-600 font-medium ml-1">
                            {formatTime(d.start)} – {formatTime(d.end)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 flex-1">Unavailable</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-gray-400 mt-3">
                You can block specific dates anytime from your host dashboard after publishing.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => router.back()}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleContinue}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isEditing ? 'Review & Save' : 'Next: Safety Standards'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-80 flex-shrink-0 space-y-4">
            {/* Live earnings estimate */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-semibold text-gray-900">Your earnings estimate</h2>
              </div>
              {priceTab === 'hourly' ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Days available/week</span>
                    <span className="font-semibold text-gray-900">{activeDaysPerWeek} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Avg trip length</span>
                    <span className="font-semibold text-gray-900">~3 hrs</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Hourly rate</span>
                    <span className="font-semibold text-gray-900">${hourlyRate}/hr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Est. per rental day</span>
                    <span className="font-semibold text-gray-900">~${estHourlyPerDay}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Est. monthly earnings</span>
                      <span className="text-lg font-bold text-green-600">${estHourlyMonthly}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">After platform fee, avg 1.5 trips/day</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Days available/week</span>
                    <span className="font-semibold text-gray-900">{activeDaysPerWeek} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Est. rental days/mo</span>
                    <span className="font-semibold text-gray-900">~{estDaysPerMonth} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Daily rate</span>
                    <span className="font-semibold text-gray-900">${dailyRate}/day</span>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Est. monthly earnings</span>
                      <span className="text-lg font-bold text-green-600">${estDailyMonthly}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">After platform fee, ~60% occupancy</p>
                  </div>
                </div>
              )}
            </div>

            {/* Community Rules */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Community Rules</h2>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {rules.map((rule) => (
                  <button
                    key={rule.id}
                    onClick={() => toggleRule(rule.id)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      rule.selected
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {rule.selected && <Zap className="w-3.5 h-3.5" />}
                    {rule.label}
                  </button>
                ))}
              </div>

              {/* Fuel Policy */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Fuel Policy</label>
                <div className="relative">
                  <select
                    value={fuelPolicy}
                    onChange={(e) => setFuelPolicy(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                  >
                    {FUEL_POLICY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Daily Distance Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Daily Distance Limit</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={distanceLimit}
                    onChange={(e) => setDistanceLimit(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500">{distanceUnit === 'km' ? 'km/day' : 'mi/day'}</span>
                  <button
                    onClick={() => setDistanceUnit(u => u === 'km' ? 'mi' : 'km')}
                    className="px-3 py-2.5 text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    {distanceUnit.toUpperCase()}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
