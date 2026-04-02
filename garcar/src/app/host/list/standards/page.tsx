'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Wrench, Sparkles, MessageCircle, ParkingSquare, Rocket } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';

const STANDARDS = [
  {
    icon: Wrench,
    title: 'Maintenance',
    items: [
      'Keep your car in safe, roadworthy condition at all times.',
      'Address any mechanical issues before accepting a rental.',
      'Maintain valid registration and insurance throughout your listing.',
    ],
  },
  {
    icon: Sparkles,
    title: 'Cleanliness',
    items: [
      'Return your car clean and ready before every rental.',
      'Fuel the car to the level stated in your listing.',
      'Remove all personal belongings between rentals.',
    ],
  },
  {
    icon: MessageCircle,
    title: 'Community Respect',
    items: [
      'Respond to booking requests within 24 hours.',
      'Communicate promptly — your renters are your neighbors.',
      'Honor all confirmed bookings; cancellations affect your standing.',
    ],
  },
  {
    icon: ParkingSquare,
    title: 'Your Parking Spot',
    items: [
      'Only list a car assigned to your building parking spot.',
      'Never list a vehicle without the owner\'s authorization.',
      'Keep your spot available during confirmed rental windows.',
    ],
  },
];

export default function ListStandardsPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');

  async function handlePublish() {
    if (!agreed) return;
    setPublishing(true);
    setPublishError('');
    try {
      const saved = JSON.parse(localStorage.getItem('garkar_list_car') || '{}');
      const carPayload = {
        make: saved.make || 'Unknown',
        model: saved.model || 'Unknown',
        year: parseInt(saved.year) || new Date().getFullYear(),
        licensePlate: saved.licensePlate || '',
        state: saved.state || '',
        trim: saved.trim || '',
        type: saved.type || 'Gas',
        seats: parseInt(saved.seats) || 5,
        transmission: saved.transmission || 'Automatic',
        price: parseFloat(saved.price) || 65,
        pricehr: parseFloat(saved.pricehr) || 0,
        description: saved.description || '',
        rules: saved.rules || [],
        fuelPolicy: saved.fuelPolicy || 'Return at same level',
        dailyDistanceLimit: parseInt(saved.dailyDistanceLimit) || 200,
        images: saved.images || [],
        available: true,
        weeklySchedule: saved.weeklySchedule || { sun: false, mon: true, tue: true, wed: true, thu: true, fri: true, sat: false },
        availableHoursStart: saved.availableHoursStart || '07:00',
        availableHoursEnd: saved.availableHoursEnd || '21:00',
      };
      if (saved.carId) {
        await api.updateCar(saved.carId, carPayload);
      } else {
        await api.createCar(carPayload);
      }
      localStorage.removeItem('garkar_list_car');
      router.push('/host/cars');
    } catch (err: unknown) {
      setPublishError(err instanceof Error ? err.message : 'Failed to publish listing');
    } finally {
      setPublishing(false);
    }
  }

  const isEditing = (() => {
    try {
      return !!JSON.parse(localStorage.getItem('garkar_list_car') || '{}').carId;
    } catch { return false; }
  })();

  return (
    <AppLayout>
      {/* Step header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-gray-900">
                {isEditing ? 'Edit listing' : 'Step 4 of 4'}
              </span>
              {!isEditing && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500">Last step — almost done!</span>
                </>
              )}
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Safety &amp; Community Standards</h1>
          <p className="text-gray-500 mt-2">
            Garcar connects neighbors in your building. As a host, you&apos;re expected to uphold these
            standards so every renter has a safe, reliable experience.
          </p>
        </div>

        {/* Standards list */}
        <div className="space-y-4 mb-8">
          {STANDARDS.map(({ icon: Icon, title, items }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">{title}</h2>
              </div>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Agreement checkbox */}
        <label className="flex items-start gap-3 cursor-pointer group mb-6 bg-gray-50 rounded-2xl border border-gray-200 p-5">
          <div className="mt-0.5 flex-shrink-0">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              agreed ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400'
            }`}>
              {agreed && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">I agree to uphold these standards</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Violations may result in listing suspension or removal from the platform.
            </p>
          </div>
        </label>

        {/* Error */}
        {publishError && (
          <p className="text-sm text-red-600 mb-4">{publishError}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handlePublish}
            disabled={!agreed || publishing}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Rocket className="w-4 h-4" />
            {publishing
              ? (isEditing ? 'Saving...' : 'Publishing...')
              : (isEditing ? 'Agree & Save Changes' : 'Agree & Publish Listing')}
          </button>
        </div>
      </main>
    </AppLayout>
  );
}
