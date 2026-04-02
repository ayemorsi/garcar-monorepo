'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, TrendingUp, DollarSign, CalendarCheck, Users, Shield } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';

const STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming',
];

const MAKES = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Tesla', 'Audi', 'Volkswagen', 'Hyundai', 'Kia', 'Nissan', 'Subaru', 'Mazda', 'Lexus'];

const MODELS_BY_MAKE: Record<string, string[]> = {
  Toyota: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius', 'Tacoma', '4Runner'],
  Honda: ['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V', 'Odyssey', 'Ridgeline'],
  Ford: ['F-150', 'Explorer', 'Escape', 'Mustang', 'Edge', 'Bronco', 'Ranger'],
  Chevrolet: ['Silverado', 'Equinox', 'Malibu', 'Traverse', 'Blazer', 'Camaro'],
  BMW: ['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X7', 'M3', 'M5'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'GLS', 'A-Class'],
  Tesla: ['Model 3', 'Model S', 'Model X', 'Model Y', 'Cybertruck'],
  Audi: ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'e-tron'],
  Volkswagen: ['Golf', 'Jetta', 'Passat', 'Tiguan', 'Atlas', 'ID.4'],
  Hyundai: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade', 'Ioniq 5'],
  Kia: ['Forte', 'K5', 'Sportage', 'Telluride', 'Sorento', 'EV6'],
  Nissan: ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Murano', 'Frontier'],
  Subaru: ['Impreza', 'Legacy', 'Outback', 'Forester', 'Crosstrek', 'Ascent'],
  Mazda: ['Mazda3', 'Mazda6', 'CX-5', 'CX-9', 'MX-5 Miata', 'CX-30'],
  Lexus: ['IS', 'ES', 'LS', 'RX', 'GX', 'LX', 'NX', 'UX'],
};

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 25 }, (_, i) => String(currentYear - i));

interface FormData {
  licensePlate: string;
  state: string;
  make: string;
  model: string;
  year: string;
  trim: string;
  type: string;
  seats: string;
  transmission: string;
  description: string;
}

const STEPS = ['Vehicle Info', 'Photos', 'Pricing & Schedule', 'Safety Standards'];

export default function ListVehicleInfoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const carId = searchParams.get('carId');

  const [form, setForm] = useState<FormData>({
    licensePlate: '',
    state: '',
    make: '',
    model: '',
    year: '',
    trim: '',
    type: 'Gas',
    seats: '5',
    transmission: 'Automatic',
    description: '',
  });

  useEffect(() => {
    if (!carId) {
      localStorage.removeItem('garkar_list_car');
      return;
    }
    api.getCar(carId).then((car) => {
      const c = car as {
        make: string; model: string; year: number; licensePlate: string;
        state: string; trim: string; type: string; seats: number;
        transmission: string; description: string; price: number;
        pricehr: number; fuelPolicy: string; dailyDistanceLimit: number;
        rules: string[]; images: string[];
        weeklySchedule: Record<string, boolean>;
        availableHoursStart: string; availableHoursEnd: string;
      };
      setForm({
        licensePlate: c.licensePlate || '',
        state: c.state || '',
        make: c.make || '',
        model: c.model || '',
        year: String(c.year || ''),
        trim: c.trim || '',
        type: c.type || 'Gas',
        seats: String(c.seats || '5'),
        transmission: c.transmission || 'Automatic',
        description: c.description || '',
      });
      localStorage.setItem('garkar_list_car', JSON.stringify({
        carId,
        make: c.make, model: c.model, year: String(c.year),
        licensePlate: c.licensePlate, state: c.state, trim: c.trim,
        type: c.type, seats: String(c.seats), transmission: c.transmission,
        description: c.description,
        price: c.price, pricehr: c.pricehr,
        fuelPolicy: c.fuelPolicy, dailyDistanceLimit: c.dailyDistanceLimit,
        rules: c.rules, images: c.images,
        weeklySchedule: c.weeklySchedule,
        availableHoursStart: c.availableHoursStart,
        availableHoursEnd: c.availableHoursEnd,
      }));
    }).catch(() => {});
  }, [carId]);

  function handleChange(field: keyof FormData, value: string) {
    setForm((prev) => {
      if (field === 'make') return { ...prev, make: value, model: '' };
      return { ...prev, [field]: value };
    });
  }

  function handleContinue() {
    if (!form.licensePlate || !form.make || !form.model || !form.year) {
      alert('Please fill in all required fields.');
      return;
    }
    const existing = JSON.parse(localStorage.getItem('garkar_list_car') || '{}');
    localStorage.setItem('garkar_list_car', JSON.stringify({ ...existing, ...form }));
    router.push('/host/list/photos');
  }

  function handleStartOver() {
    localStorage.removeItem('garkar_list_car');
    setForm({ licensePlate: '', state: '', make: '', model: '', year: '', trim: '', type: 'Gas', seats: '5', transmission: 'Automatic', description: '' });
    router.push('/host/list');
  }

  const availableModels = form.make ? (MODELS_BY_MAKE[form.make] ?? []) : [];
  const isEditing = !!carId;

  return (
    <AppLayout>
      {/* Step header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="font-semibold text-gray-900">
                {isEditing ? 'Edit listing' : `Step 1 of ${STEPS.length}`}
              </span>
              {!isEditing && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500">Next: {STEPS[1]}</span>
                  <span className="text-gray-300">|</span>
                  <button onClick={handleStartOver} className="text-blue-600 hover:underline">
                    Start over
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: isEditing ? '25%' : '25%' }} />
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Form */}
          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditing ? 'Update your vehicle info' : 'Tell us about your car'}
              </h1>
              <p className="text-gray-500 mt-1.5 text-sm">
                {isEditing
                  ? 'Make changes to your vehicle details below.'
                  : "We'll verify your vehicle and create your listing. Takes about 5 minutes."}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              {/* License Plate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Plate Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.licensePlate}
                  onChange={(e) => handleChange('licensePlate', e.target.value.toUpperCase())}
                  placeholder="e.g. ABC-1234"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State / Region
                </label>
                <div className="relative">
                  <select
                    value={form.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                  >
                    <option value="">Select a state</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Make */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Make <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.make}
                    onChange={(e) => handleChange('make', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                  >
                    <option value="">Select make</option>
                    {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    disabled={!form.make}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">Select model</option>
                    {availableModels.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.year}
                    onChange={(e) => handleChange('year', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                  >
                    <option value="">Select year</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Trim */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trim <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={form.trim}
                  onChange={(e) => handleChange('trim', e.target.value)}
                  placeholder="e.g. SE, Sport, Limited"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Fuel Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                <div className="relative">
                  <select
                    value={form.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                  >
                    <option value="Gas">Gas</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Electric">Electric</option>
                    <option value="Diesel">Diesel</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Seats + Transmission */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seats</label>
                  <div className="relative">
                    <select
                      value={form.seats}
                      onChange={(e) => handleChange('seats', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                    >
                      {['2', '4', '5', '6', '7', '8'].map((n) => (
                        <option key={n} value={n}>{n} seats</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transmission</label>
                  <div className="relative">
                    <select
                      value={form.transmission}
                      onChange={(e) => handleChange('transmission', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                    >
                      <option value="Automatic">Automatic</option>
                      <option value="Manual">Manual</option>
                      <option value="CVT">CVT</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  placeholder="Tell renters about your car — features, condition, anything they should know..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-6">
              <Link
                href="/host/cars"
                className="px-6 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                onClick={handleContinue}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next: Photos
              </button>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
            {/* Earnings estimator */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-blue-300" />
                <span className="text-sm font-semibold text-blue-100">Estimated earnings</span>
              </div>
              <p className="text-4xl font-bold tracking-tight">$520–$780</p>
              <p className="text-blue-300 text-sm mt-1">per month, based on similar listings</p>
              <div className="mt-4 pt-4 border-t border-blue-500 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-300">Avg. rental days</span>
                  <span className="font-medium">8–12 days/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-300">Avg. daily rate</span>
                  <span className="font-medium">$65/day</span>
                </div>
              </div>
            </div>

            {/* Why list */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Why hosts list with Garcar</h3>
              <ul className="space-y-4">
                {[
                  {
                    icon: DollarSign,
                    title: 'Offset your parking costs',
                    desc: 'Cover $150–250/mo in parking fees with just a few rentals.',
                  },
                  {
                    icon: CalendarCheck,
                    title: 'Earn during your work week',
                    desc: 'Your car sits idle Mon–Fri anyway — put it to work.',
                  },
                  {
                    icon: Users,
                    title: 'Rent to verified neighbors',
                    desc: 'Renters are people from your own building, not strangers.',
                  },
                  {
                    icon: Shield,
                    title: 'You stay in control',
                    desc: 'Set your own schedule, rules, and pricing. Pause anytime.',
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <li key={title} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Steps overview */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">What to expect</h3>
              <ol className="space-y-2">
                {STEPS.map((name, i) => (
                  <li key={name} className="flex items-center gap-3 text-sm">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {i + 1}
                    </div>
                    <span className={i === 0 ? 'font-semibold text-gray-900' : 'text-gray-400'}>{name}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
