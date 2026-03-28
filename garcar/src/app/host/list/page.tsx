'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, FileText, Eye, ChevronDown } from 'lucide-react';
import AppLayout from '@/components/AppLayout';

const STEPS = [
  { label: 'Vehicle Info', step: 1 },
  { label: 'Photos', step: 2 },
  { label: 'Pricing', step: 3 },
  { label: 'Rules', step: 4 },
];

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

export default function ListVehicleInfoPage() {
  const router = useRouter();
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

  function handleChange(field: keyof FormData, value: string) {
    setForm((prev) => {
      if (field === 'make') {
        return { ...prev, make: value, model: '' };
      }
      return { ...prev, [field]: value };
    });
  }

  function handleContinue() {
    if (!form.licensePlate || !form.make || !form.model || !form.year) {
      alert('Please fill in all required fields.');
      return;
    }
    // Persist step 1 data for final submission
    const existing = JSON.parse(localStorage.getItem('garkar_list_car') || '{}');
    localStorage.setItem('garkar_list_car', JSON.stringify({ ...existing, ...form }));
    router.push('/host/list/photos');
  }

  const availableModels = form.make ? (MODELS_BY_MAKE[form.make] ?? []) : [];

  return (
    <AppLayout>
      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-0 overflow-x-auto">
              {STEPS.map((s, idx) => (
                <div key={s.step} className="flex items-center flex-shrink-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                        s.step === 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {s.step}
                    </div>
                    <span
                      className={`text-xs sm:text-sm font-medium hidden sm:inline ${
                        s.step === 1 ? 'text-blue-600' : 'text-gray-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className="w-6 sm:w-12 h-px bg-gray-300 mx-1.5 sm:mx-3" />
                  )}
                </div>
              ))}
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-500 flex-shrink-0 ml-2">25%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: '25%' }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Main Card */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="mb-6">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1">
                  List Your Car
                </p>
                <h1 className="text-2xl font-bold text-gray-900">Tell us about your vehicle</h1>
                <p className="text-gray-500 mt-1 text-sm">
                  We use this information to verify your car and set up your listing.
                </p>
              </div>

              <div className="space-y-5">
                {/* License Plate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Plate Number
                  </label>
                  <input
                    type="text"
                    value={form.licensePlate}
                    onChange={(e) => handleChange('licensePlate', e.target.value)}
                    placeholder="e.g. ABC-1234"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* State/Region */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State / Region
                  </label>
                  <div className="relative">
                    <select
                      value={form.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">Select a state</option>
                      {STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Make */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Make
                  </label>
                  <div className="relative">
                    <select
                      value={form.make}
                      onChange={(e) => handleChange('make', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">Select make</option>
                      {MAKES.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <div className="relative">
                    <select
                      value={form.model}
                      onChange={(e) => handleChange('model', e.target.value)}
                      disabled={!form.make}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <option value="">Select model</option>
                      {availableModels.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <div className="relative">
                    <select
                      value={form.year}
                      onChange={(e) => handleChange('year', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">Select year</option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
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
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    placeholder="Tell renters about your car — features, condition, anything special..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100">
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
                  Continue to Photos
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-72 lg:flex-shrink-0 space-y-4">
            {/* Why we need this */}
            <div className="bg-blue-600 rounded-2xl p-6 text-white">
              <h3 className="font-semibold text-base mb-4">Why we need this</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Verification</p>
                    <p className="text-blue-200 text-xs mt-0.5">We confirm your car is real and legally registered.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Insurance</p>
                    <p className="text-blue-200 text-xs mt-0.5">Accurate details ensure proper coverage during rentals.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Transparency</p>
                    <p className="text-blue-200 text-xs mt-0.5">Renters can trust they know what vehicle they are booking.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Need help? */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold text-base text-gray-900 mb-2">Need help?</h3>
              <p className="text-sm text-gray-500 mb-4">
                Our support team is here to assist you through the listing process.
              </p>
              <Link
                href="/support"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Contact Support →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
