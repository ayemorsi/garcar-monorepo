'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Car, MapPin, CheckCircle, Key, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { saveAuth, saveRefreshToken } from '@/lib/auth';

type Building = { _id: string; name: string; address: string };

export default function SignUpPage() {
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    buildingSearch: '',
    buildingId: '',
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001'}/api/buildings`)
      .then((r) => r.json())
      .then(setBuildings)
      .catch(() => {});
  }, []);

  const filteredBuildings = buildings.filter((b) =>
    b.name.toLowerCase().includes(form.buildingSearch.toLowerCase())
  );

  function selectBuilding(b: Building) {
    setSelectedBuilding(b);
    setForm((f) => ({ ...f, buildingSearch: b.name, buildingId: b._id }));
    setShowDropdown(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.buildingId) {
      setError('Please select your building.');
      return;
    }
    setLoading(true);
    try {
      const username = form.email;
      await api.register({ username, password: form.password, building: selectedBuilding?.name || '', firstName: form.firstName, lastName: form.lastName });
      const data = await api.login({ username, password: form.password });
      saveAuth(data.token, data.userId);
      if (data.refreshToken) saveRefreshToken(data.refreshToken);
      router.push(`/verify/residency?userId=${data.userId}&building=${encodeURIComponent(selectedBuilding?.name || '')}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-8 py-8 sm:py-12 max-w-xl mx-auto lg:mx-0">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600 mb-8">
          <Car className="w-6 h-6" />
          GarKar
        </Link>

        <span className="inline-block text-xs font-semibold tracking-widest text-blue-600 uppercase mb-2">
          Hyper-Local Car Sharing
        </span>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Join the Community</h1>
        <p className="text-gray-500 mb-8">Exclusively for residents of verified apartment complexes.</p>

        {/* Step indicator */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">1</div>
            <span className="text-sm font-medium text-gray-900">Account Details</span>
          </div>
          <div className="h-px flex-1 bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-500 text-sm font-bold flex items-center justify-center">2</div>
            <span className="text-sm text-gray-400">Select Building</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                placeholder="John"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                placeholder="Doe"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-gray-400 font-normal">Min. 8 characters</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              minLength={8}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* Password strength bar */}
            <div className="flex gap-1 mt-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full ${
                    form.password.length >= i * 3
                      ? i <= 2 ? 'bg-blue-400' : 'bg-blue-600'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Building search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-blue-600" /> Find Your Building
            </label>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search building..."
                  value={form.buildingSearch}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, buildingSearch: e.target.value, buildingId: '' }));
                    setSelectedBuilding(null);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full border border-blue-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showDropdown && filteredBuildings.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {filteredBuildings.map((b) => (
                      <button
                        key={b._id}
                        type="button"
                        onClick={() => selectBuilding(b)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          <Car className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                            {b.name}
                            {selectedBuilding?._id === b._id && (
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                            )}
                          </p>
                          <p className="text-xs text-gray-500">{b.address}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

          <p className="text-xs text-center text-gray-500">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
            Residency verification required upon first rental.
          </p>
        </form>

        <p className="mt-6 text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-blue-600 font-medium hover:underline">Log in</Link>
        </p>
      </div>

      {/* Right — map preview */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-100 flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Map placeholder */}
        <div className="w-full h-full absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-64 h-64 bg-green-100 rounded-full opacity-40 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <div className="w-40 h-40 bg-blue-100 rounded-full opacity-30 absolute top-1/3 left-1/3" />
          </div>
        </div>

        {/* Building verified card */}
        {selectedBuilding ? (
          <div className="relative z-10 bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-1">Selected Building</p>
                <h3 className="text-lg font-bold text-gray-900">{selectedBuilding.name}</h3>
                <p className="text-sm text-green-600 font-medium">Official GarKar partner building</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              This is an official GarKar partner community. Enjoy seamless pick-up and drop-off right from your residential parking garage.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-3">
                <Key className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-xs font-semibold text-gray-900">Keyless Entry</p>
                  <p className="text-xs text-gray-500">Unlock via app</p>
                </div>
              </div>
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-3">
                <Shield className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-xs font-semibold text-gray-900">Full Coverage</p>
                  <p className="text-xs text-gray-500">Insurance included</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 text-center">
            <Car className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Search for your building to see available cars</p>
          </div>
        )}
      </div>
    </div>
  );
}
