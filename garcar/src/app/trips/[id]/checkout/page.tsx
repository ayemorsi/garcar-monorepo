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
  checkInPhotos?: string[];
}

export default function CheckOutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showCheckIn, setShowCheckIn] = useState(false);

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
      setError('Please take at least one photo before ending your trip.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.checkOut(id, photos.map((p) => p.file));
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
  const checkInCount = booking?.checkInPhotos?.length ?? 0;

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
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Camera className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">End Trip — Document Return Condition</h1>
            <p className="text-sm text-gray-500 mt-0.5">{carName}</p>
          </div>
        </div>

        {/* Check-in photos reference */}
        {checkInCount > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">Check-in photos on file</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {checkInCount} photo{checkInCount !== 1 ? 's' : ''} taken at pickup — compare when shooting return photos
                </p>
              </div>
              <button
                onClick={() => setShowCheckIn(!showCheckIn)}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                {showCheckIn ? 'Hide' : 'View'}
              </button>
            </div>
            {showCheckIn && booking?.checkInPhotos && (
              <div className="grid grid-cols-3 gap-1.5 mt-3">
                {booking.checkInPhotos.map((src, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info banner */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-900">Document the car as you return it</p>
            <p className="text-sm text-orange-700 mt-0.5">
              Match the same angles as check-in. These photos protect both you and the owner — if any
              damage occurred before your trip, the check-in photos will show it.
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
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-colors mb-4"
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
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-orange-400 transition-colors"
            >
              <ImagePlus className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        )}

        {photos.length === 0 && (
          <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-4">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium">
              You must upload at least one photo to complete the return.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

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
          className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Camera className="w-4 h-4" />
          {submitting ? 'Submitting…' : `Confirm Return (${photos.length} photo${photos.length !== 1 ? 's' : ''})`}
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">
          Submitting completes your trip and notifies the car owner.
        </p>
      </div>
    </AppLayout>
  );
}
