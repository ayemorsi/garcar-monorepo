'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, ArrowRight, CheckCircle } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';

interface Booking {
  _id: string;
  carId: { make?: string; model?: string; year?: number };
  ownerId: { _id: string; firstName?: string; lastName?: string; username: string };
}

interface StarRatingProps {
  value: number;
  onChange: (v: number) => void;
  label: string;
}

function StarRating({ value, onChange, label }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="focus:outline-none"
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                star <= (hover || value) ? 'text-blue-600 fill-blue-600' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReviewPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = use(params);
  const router = useRouter();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [vehicleRatings, setVehicleRatings] = useState({ cleanliness: 5, performance: 5, accuracy: 5 });
  const [ownerRatings, setOwnerRatings] = useState({ communication: 4, handoff: 4 });
  const [publicNote, setPublicNote] = useState('');

  useEffect(() => {
    (api.getBooking(bookingId) as Promise<Booking>)
      .then(setBooking)
      .catch(console.error);
  }, [bookingId]);

  const overallVehicle = (
    (vehicleRatings.cleanliness + vehicleRatings.performance + vehicleRatings.accuracy) / 3
  ).toFixed(1);

  const ownerName = booking?.ownerId?.firstName
    ? `${booking.ownerId.firstName} ${booking.ownerId.lastName ?? ''}`.trim()
    : booking?.ownerId?.username ?? 'Host';
  const ownerInitials = ownerName.slice(0, 2).toUpperCase();

  async function handleSubmit() {
    try {
      setSubmitting(true);
      setError('');
      await api.createReview({ bookingId, vehicleRatings, ownerRatings, publicNote });
      setSubmitted(true);
      setTimeout(() => router.push('/my-trips'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
          <h2 className="text-xl font-bold text-gray-900">Review submitted!</h2>
          <p className="text-sm text-gray-500">Redirecting to your trips...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="text-center mb-8 relative">
            <button
              onClick={() => router.push('/my-trips')}
              className="absolute right-0 top-1 text-sm text-gray-400 hover:text-gray-600"
            >
              Skip for now
            </button>
            <div className="w-20 h-20 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              {ownerInitials}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              How was your trip with {ownerName}?
            </h1>
            <p className="text-gray-500">Your feedback helps build a trusted community</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            {/* Vehicle Rating */}
            <div className="mb-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Vehicle Rating</h2>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-5xl font-bold text-gray-900">{overallVehicle}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-5 h-5 ${
                        s <= parseFloat(overallVehicle)
                          ? 'text-blue-600 fill-blue-600'
                          : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                <StarRating label="Cleanliness" value={vehicleRatings.cleanliness}
                  onChange={(v) => setVehicleRatings((r) => ({ ...r, cleanliness: v }))} />
                <StarRating label="Performance" value={vehicleRatings.performance}
                  onChange={(v) => setVehicleRatings((r) => ({ ...r, performance: v }))} />
                <StarRating label="Accuracy of Listing" value={vehicleRatings.accuracy}
                  onChange={(v) => setVehicleRatings((r) => ({ ...r, accuracy: v }))} />
              </div>
            </div>

            {/* Owner Rating */}
            <div className="mb-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Owner Rating</h2>
              <div className="divide-y divide-gray-100">
                <StarRating label="Communication" value={ownerRatings.communication}
                  onChange={(v) => setOwnerRatings((r) => ({ ...r, communication: v }))} />
                <StarRating label="Hand-off Process" value={ownerRatings.handoff}
                  onChange={(v) => setOwnerRatings((r) => ({ ...r, handoff: v }))} />
              </div>
            </div>

            {/* Public note */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Leave a note for your neighbor
              </label>
              <textarea
                value={publicNote}
                onChange={(e) => setPublicNote(e.target.value)}
                placeholder="Share your experience with the community..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">This review will be visible to other neighbors</p>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 text-center mb-3">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 mb-6"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Verified Trip
            </span>
            <span>·</span>
            <span>Community Led</span>
            <span>·</span>
            <span>24/7 Support</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
