'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  Info,
  Rocket,
  Zap,
  Clock,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';

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

const FUEL_POLICY_OPTIONS = [
  'Return at same level',
  'Return full tank',
  'Prepaid fuel included',
  'No fuel policy',
];

export default function ListPricingPage() {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [priceTab, setPriceTab] = useState<PriceTab>('daily');
  const [dailyPrice, setDailyPrice] = useState('65');
  const [hourlyPrice, setHourlyPrice] = useState('15');

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
  const [distanceLimit, setDistanceLimit] = useState('200');
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>('km');

  const DAYS = [
    { id: 'sun', label: 'S' }, { id: 'mon', label: 'M' }, { id: 'tue', label: 'T' },
    { id: 'wed', label: 'W' }, { id: 'thu', label: 'T' }, { id: 'fri', label: 'F' },
    { id: 'sat', label: 'S' },
  ];
  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, boolean>>(
    { sun: false, mon: true, tue: true, wed: true, thu: true, fri: true, sat: false }
  );
  const [hoursStart, setHoursStart] = useState('07:00');
  const [hoursEnd, setHoursEnd] = useState('21:00');

  function toggleDiscount(id: string) {
    setDiscounts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, enabled: !d.enabled } : d))
    );
  }

  function toggleRule(id: string) {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  }

  function applyPriceSuggestion() {
    setDailyPrice('72');
  }

  return (
    <AppLayout>
      {/* Progress */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Step 3 &amp; 4 of 4: Pricing &amp; Rules</span>
            <span className="text-sm text-gray-500">75%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Listing Details</h1>

        <div className="flex gap-8">
          {/* Left Column */}
          <div className="flex-1 space-y-5">
            {/* Set Your Rates */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Set Your Rates</h2>

              {/* Tabs */}
              <div className="flex border border-gray-200 rounded-lg p-1 mb-5 w-fit">
                {(['hourly', 'daily'] as PriceTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setPriceTab(tab)}
                    className={`px-5 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                      priceTab === tab
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Price Input */}
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
                      priceTab === 'daily'
                        ? setDailyPrice(e.target.value)
                        : setHourlyPrice(e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg pl-7 pr-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {priceTab === 'daily'
                    ? 'Charged per full day'
                    : 'Charged per hour — set to 0 to disable hourly booking'}
                </p>
              </div>

              {/* Recommended Price */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900">Recommended Price</p>
                    <p className="text-sm text-blue-700 mt-0.5">
                      Similar cars in your area earn <strong>$60–$85/day</strong>. Your current price is within this range.
                    </p>
                    <button
                      onClick={applyPriceSuggestion}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 mt-2 underline underline-offset-2"
                    >
                      Apply Suggestion
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Discounts & Duration */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Discounts &amp; Duration</h2>
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
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          discount.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability Schedule */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-semibold text-gray-900">When is it available?</h2>
              </div>

              {/* Day toggles */}
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Days of the week</p>
              <div className="flex gap-1.5 mb-5">
                {DAYS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setWeeklySchedule(prev => ({ ...prev, [d.id]: !prev[d.id] }))}
                    className={`w-9 h-9 rounded-full text-sm font-semibold transition-colors ${
                      weeklySchedule[d.id]
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Hours */}
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Available hours</p>
              <div className="flex items-center gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">From</label>
                  <input
                    type="time"
                    value={hoursStart}
                    onChange={(e) => setHoursStart(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-gray-400 mt-4">–</span>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">To</label>
                  <input
                    type="time"
                    value={hoursEnd}
                    onChange={(e) => setHoursEnd(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                You can block specific dates anytime from your host dashboard after publishing.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/host/list/photos"
                className="px-6 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Details
              </Link>
              {publishError && <p className="text-red-600 text-xs">{publishError}</p>}
              <button
                disabled={publishing}
                onClick={async () => {
                  try {
                    setPublishing(true);
                    setPublishError('');
                    const saved = JSON.parse(localStorage.getItem('garkar_list_car') || '{}');
                    const selectedRules = rules.filter(r => r.selected).map(r => r.label);
                    await api.createCar({
                      make: saved.make || 'Unknown',
                      model: saved.model || 'Unknown',
                      year: parseInt(saved.year) || new Date().getFullYear(),
                      licensePlate: saved.licensePlate || '',
                      state: saved.state || '',
                      trim: saved.trim || '',
                      type: saved.type || 'Gas',
                      seats: parseInt(saved.seats) || 5,
                      transmission: saved.transmission || 'Automatic',
                      price: parseFloat(dailyPrice) || 65,
                      pricehr: parseFloat(hourlyPrice) || 0,
                      description: saved.description || '',
                      rules: selectedRules,
                      fuelPolicy,
                      dailyDistanceLimit: parseInt(distanceLimit) || 200,
                      images: saved.images || [],
                      available: true,
                      weeklySchedule,
                      availableHoursStart: hoursStart,
                      availableHoursEnd: hoursEnd,
                    });
                    localStorage.removeItem('garkar_list_car');
                    router.push('/host/cars');
                  } catch (err: unknown) {
                    setPublishError(err instanceof Error ? err.message : 'Failed to publish listing');
                  } finally {
                    setPublishing(false);
                  }
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                <Rocket className="w-4 h-4" />
                {publishing ? 'Publishing...' : 'Publish Listing'}
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-80 flex-shrink-0">
            {/* Community Rules */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-4">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Community Rules</h2>

              {/* Rule Buttons 2x2 Grid */}
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
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
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={distanceLimit}
                      onChange={(e) => setDistanceLimit(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-sm text-gray-500">
                    {distanceUnit === 'km' ? 'km/day' : 'mi/day'}
                  </span>
                  <button
                    onClick={() => setDistanceUnit((u) => (u === 'km' ? 'mi' : 'km'))}
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
