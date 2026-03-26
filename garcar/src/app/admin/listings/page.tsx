'use client';

import { useState, useEffect } from 'react';
import { Search, Eye, EyeOff, Trash2, Car } from 'lucide-react';
import { api } from '@/lib/api';

interface AdminListing {
  _id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  available: boolean;
  images?: string[];
  userId?: { _id: string; firstName?: string; lastName?: string; username: string; building?: string };
  createdAt: string;
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [availFilter, setAvailFilter] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [confirmDelete, setConfirmDelete] = useState('');

  useEffect(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (availFilter) params.available = availFilter;
    setLoading(true);
    (api.adminGetListings(params) as Promise<AdminListing[]>)
      .then(setListings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, availFilter]);

  async function toggleAvailable(listing: AdminListing) {
    setActionLoading(listing._id);
    try {
      await api.adminUpdateListing(listing._id, { available: !listing.available });
      setListings((prev) => prev.map((l) => l._id === listing._id ? { ...l, available: !l.available } : l));
    } finally { setActionLoading(''); }
  }

  async function deleteListing(id: string) {
    setActionLoading(id);
    try {
      await api.adminDeleteListing(id);
      setListings((prev) => prev.filter((l) => l._id !== id));
      setConfirmDelete('');
    } finally { setActionLoading(''); }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Listings</h1>
        <p className="text-gray-400 text-sm mt-1">All car listings across the platform</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search make, model..."
            className="w-full bg-gray-900 border border-gray-700 text-white text-sm pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
          />
        </div>
        <select
          value={availFilter}
          onChange={(e) => setAvailFilter(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-sm text-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All</option>
          <option value="true">Available</option>
          <option value="false">Paused</option>
        </select>
        <span className="text-xs text-gray-500 ml-auto">{listings.length} listings</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center text-gray-500 py-16">Loading...</div>
      ) : listings.length === 0 ? (
        <div className="text-center text-gray-500 py-16">No listings found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((listing) => {
            const ownerName = listing.userId?.firstName
              ? `${listing.userId.firstName} ${listing.userId.lastName ?? ''}`.trim()
              : listing.userId?.username ?? 'Unknown';
            return (
              <div key={listing._id} className={`bg-gray-900 border rounded-xl overflow-hidden transition-opacity ${
                listing.available ? 'border-gray-800' : 'border-gray-700 opacity-60'
              }`}>
                {/* Image */}
                <div className="h-36 bg-gray-800 flex items-center justify-center overflow-hidden relative">
                  {listing.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={listing.images[0]} alt={listing.model} className="w-full h-full object-cover" />
                  ) : (
                    <Car className="w-12 h-12 text-gray-600" />
                  )}
                  {!listing.available && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-xs font-bold text-white bg-red-600 px-2 py-0.5 rounded">PAUSED</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-sm font-semibold text-white">{listing.year} {listing.make} {listing.model}</h3>
                    <span className="text-blue-400 font-bold text-sm">${listing.price}/d</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">Host: {ownerName}</p>
                  {listing.userId?.building && (
                    <p className="text-xs text-gray-600 mb-3">{listing.userId.building}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleAvailable(listing)}
                      disabled={!!actionLoading}
                      title={listing.available ? 'Pause listing' : 'Unpause listing'}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        listing.available
                          ? 'bg-amber-900/40 text-amber-400 hover:bg-amber-900/60'
                          : 'bg-green-900/40 text-green-400 hover:bg-green-900/60'
                      }`}
                    >
                      {listing.available ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {listing.available ? 'Pause' : 'Unpause'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(listing._id)}
                      disabled={!!actionLoading}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-900/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-bold text-white mb-2">Delete Listing?</h3>
            <p className="text-sm text-gray-400 mb-4">This will permanently remove the listing and all associated bookings.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete('')} className="flex-1 py-2 border border-gray-700 text-gray-300 text-sm rounded-lg hover:bg-gray-800">Cancel</button>
              <button
                onClick={() => deleteListing(confirmDelete)}
                disabled={!!actionLoading}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
