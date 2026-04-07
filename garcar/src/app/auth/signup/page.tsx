'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Car, MapPin, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { env } from '@/lib/env';
import { saveAuth, saveRefreshToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

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
    fetch(`${env.NEXT_PUBLIC_API_URL}/buildings`)
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
      await api.register({ username, password: form.password, building: selectedBuilding?.name || '', buildingId: selectedBuilding?._id || '', firstName: form.firstName, lastName: form.lastName });
      const data = await api.login({ username, password: form.password });
      saveAuth(data.token, data.userId);
      if (data.refreshToken) saveRefreshToken(data.refreshToken);
      window.location.href = `/verify/residency?userId=${data.userId}&building=${encodeURIComponent(selectedBuilding?.name || '')}`;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  const passwordStrength = Math.min(4, Math.floor(form.password.length / 3));

  return (
    <div className="min-h-screen flex">
      {/* Left — form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-20 py-12">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary mb-8">
          <Car className="w-5 h-5" /> GarKar
        </Link>

        <div className="max-w-sm w-full">
          <Badge variant="outline" className="mb-4 text-xs border-primary/30 text-primary bg-primary/5">
            Residents only
          </Badge>
          <h1 className="text-2xl font-bold text-foreground mb-1">Create your account</h1>
          <p className="text-muted-foreground text-sm mb-8">Exclusively for verified apartment residents.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">
                Password <span className="text-muted-foreground font-normal text-xs">min. 8 characters</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                minLength={8}
                required
              />
              {form.password.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        passwordStrength >= i ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Building search */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" /> Your building
              </Label>
              <div className="relative">
                <Input
                  placeholder="Search your building…"
                  value={form.buildingSearch}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, buildingSearch: e.target.value, buildingId: '' }));
                    setSelectedBuilding(null);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className={selectedBuilding ? 'border-primary ring-1 ring-primary/30' : ''}
                />
                {selectedBuilding && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                )}
                {showDropdown && filteredBuildings.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
                    {filteredBuildings.slice(0, 6).map((b) => (
                      <button
                        key={b._id}
                        type="button"
                        onClick={() => selectBuilding(b)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 text-left transition-colors"
                      >
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{b.name}</p>
                          <p className="text-xs text-muted-foreground">{b.address}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full h-11">
              {loading ? 'Creating account…' : 'Create account'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By signing up you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline">Terms</Link> and{' '}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">Log in</Link>
          </p>
        </div>
      </div>

      {/* Right — building preview */}
      <div className="hidden lg:flex lg:w-1/2 bg-muted/40 flex-col justify-center items-center p-12 relative overflow-hidden border-l border-border">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        </div>

        {selectedBuilding ? (
          <div className="relative z-10 bg-background border border-border rounded-2xl shadow-xl p-7 max-w-sm w-full">
            <div className="flex items-start justify-between mb-4">
              <div>
                <Badge className="mb-2 text-xs">GarKar Partner</Badge>
                <h3 className="text-lg font-bold text-foreground">{selectedBuilding.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedBuilding.address}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              This building is an official GarKar partner. Enjoy seamless pick-up and drop-off from your residential parking garage.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Keyless Entry', sub: 'Unlock via app' },
                { label: 'Full Coverage', sub: 'Insurance included' },
                { label: 'Verified Hosts', sub: 'Neighbors only' },
                { label: 'Instant Book', sub: 'No approval wait' },
              ].map(({ label, sub }) => (
                <div key={label} className="border border-border rounded-lg p-3">
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Car className="w-10 h-10 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Find your building</h3>
            <p className="text-sm text-muted-foreground max-w-xs">Search above to see the cars available at your address.</p>
          </div>
        )}
      </div>
    </div>
  );
}
