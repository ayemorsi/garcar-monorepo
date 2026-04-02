'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Camera, X, ShieldCheck, AlertTriangle, ChevronLeft, ImagePlus } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';

const PHOTO_TIPS = ['Front bumper', 'Rear bumper', 'Driver side', 'Passenger side', 'Interior', 'Odometer'];

interface BookingInfo {
  _id: string;
  carId: { make: string; model: string; year: number };
  startDate: string;
  endDate: string;
}

export default function CheckInPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getBooking(id)
      .then((b) => setBooking(b as BookingInfo))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load booking'));
  }, [id]);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newPhotos = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function handleSubmit() {
    if (photos.length === 0) {
      setError('Please take at least one photo before starting your trip.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.checkIn(id, photos.map((p) => p.file));
      router.push('/my-trips');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit photos');
    } finally {
      setSubmitting(false);
    }
  }

  const carName = booking?.carId
    ? `${booking.carId.year} ${booking.carId.make} ${booking.carId.model}`
    : 'Loading…';

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to My Trips
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <Camera className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Start Trip — Document Car Condition</h1>
            <p className="text-sm text-gray-500 mt-0.5">{carName}</p>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Why this protects you</p>
            <p className="text-sm text-blue-700 mt-0.5">
              Photos taken now are timestamped and stored securely. If there&apos;s any damage dispute after the trip,
              these are your proof of the car&apos;s condition at pickup.
            </p>
          </div>
        </div>

        {/* Suggested angles */}
        <div className="mb-5">
          <p className="text-sm font-semibold text-gray-700 mb-2">Suggested angles</p>
          <div className="flex flex-wrap gap-2">
            {PHOTO_TIPS.map((tip) => (
              <span key={tip} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                {tip}
              </span>
            ))}
          </div>
        </div>

        {/* Upload area */}
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors mb-4"
        >
          <ImagePlus className="w-8 h-8 text-gray-400" />
          <p className="text-sm font-medium text-gray-600">Tap to add photos</p>
          <p className="text-xs text-gray-400">JPG, PNG — up to 10 MB each</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {/* Photo grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            {photos.map((p, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.preview} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            <button
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-blue-400 transition-colors"
            >
              <ImagePlus className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        )}

        {/* Warning if no photos */}
        {photos.length === 0 && (
          <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-4">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium">
              You must upload at least one photo to start the trip.
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        {/* Photo count */}
        {photos.length > 0 && (
          <p className="text-sm text-gray-500 mb-4">
            {photos.length} photo{photos.length !== 1 ? 's' : ''} added
            {photos.length < 4 && (
              <span className="text-amber-600 ml-1">— we recommend at least 4</span>
            )}
          </p>
        )}

        {/* Submit */}
        <button
          disabled={submitting || photos.length === 0}
          onClick={handleSubmit}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Camera className="w-4 h-4" />
          {submitting ? 'Submitting…' : `Confirm & Start Trip (${photos.length} photo${photos.length !== 1 ? 's' : ''})`}
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">
          Photos are encrypted and only visible to you and the car owner.
        </p>
      </div>
    </AppLayout>
  );
}
