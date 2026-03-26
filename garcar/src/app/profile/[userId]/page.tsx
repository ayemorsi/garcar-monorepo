'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Car,
  Shield,
  MapPin,
  Calendar,
  Star,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';

interface UserProfile {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avgRating?: number;
  tripCount?: number;
  isVerified?: boolean;
  createdAt?: string;
}

interface Review {
  _id: string;
  reviewerId: { _id: string; firstName?: string; lastName?: string; username: string };
  vehicleRatings?: { cleanliness: number; performance: number; accuracy: number };
  ownerRatings?: { communication: number; handoff: number };
  publicNote?: string;
  createdAt: string;
}

function Stars({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < count ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
    </div>
  );
}

function avgRatings(review: Review): number {
  const v = review.vehicleRatings;
  const o = review.ownerRatings;
  const vals = [
    v?.cleanliness, v?.performance, v?.accuracy,
    o?.communication, o?.handoff,
  ].filter((x): x is number => x !== undefined);
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export default function NeighborProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getUser(userId) as Promise<UserProfile>,
      api.getUserReviews(userId) as Promise<Review[]>,
    ])
      .then(([u, r]) => { setUser(u); setReviews(r); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Loading profile...</div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24 text-gray-400 text-sm">User not found.</div>
      </AppLayout>
    );
  }

  const displayName = user.firstName
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : user.username;
  const initials = displayName.slice(0, 2).toUpperCase();
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-28 h-28 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center text-3xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                {user.isVerified && (
                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                    <Shield className="w-3 h-3" />
                    VERIFIED RESIDENT
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  GarKar Community Member
                </span>
                <span className="hidden sm:block text-gray-300">·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Member since {memberSince}
                </span>
              </div>
              <div className="flex gap-3 justify-center sm:justify-start">
                <button
                  onClick={() => router.push('/messages')}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </button>
                <Link
                  href="/browse"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Car className="w-4 h-4" />
                  Browse Cars
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-xs text-gray-500 uppercase font-medium mb-1">Rating</div>
            <div className="text-3xl font-bold text-gray-900 mb-0.5">
              {user.avgRating ? user.avgRating.toFixed(1) : '—'}
              <span className="text-base font-normal text-gray-400">/5.0</span>
            </div>
            <div className="text-xs text-gray-500">{reviews.length} reviews</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-xs text-gray-500 uppercase font-medium mb-1">Trips</div>
            <div className="text-3xl font-bold text-gray-900 mb-0.5">{user.tripCount ?? 0}</div>
            <div className="text-xs text-gray-500">completed</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-xs text-gray-500 uppercase font-medium mb-1">Status</div>
            <div className="text-3xl font-bold text-gray-900 mb-0.5">
              {user.isVerified ? '✓' : '–'}
            </div>
            <div className={`text-xs font-medium ${user.isVerified ? 'text-green-600' : 'text-gray-400'}`}>
              {user.isVerified ? 'Verified resident' : 'Not verified'}
            </div>
          </div>
        </div>

        {/* Bio + Reviews */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            {user.bio && (
              <div className="mb-8">
                <h2 className="text-base font-semibold text-gray-900 mb-3">About</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{user.bio}</p>
              </div>
            )}

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Reviews ({reviews.length})
                </h2>
                {reviews.length > 3 && (
                  <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                    See all <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review) => {
                    const reviewerName = review.reviewerId?.firstName
                      ? `${review.reviewerId.firstName} ${review.reviewerId.lastName ?? ''}`.trim()
                      : review.reviewerId?.username ?? 'Neighbor';
                    const reviewerInitials = reviewerName.slice(0, 2).toUpperCase();
                    const avg = avgRatings(review);
                    return (
                      <div key={review._id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {reviewerInitials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900">{reviewerName}</span>
                              <span className="text-xs text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            {avg > 0 && <Stars count={Math.round(avg)} />}
                            {review.publicNote && (
                              <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{review.publicNote}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
