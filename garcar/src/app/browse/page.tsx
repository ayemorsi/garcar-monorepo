'use client';

import { Suspense, useState, use, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Car,
  Search,
  SlidersHorizontal,
  Star,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  Building2,
  CheckCircle,
  MapPin,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import { getAuth } from '@/lib/auth';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CarItem {
  _id: string;
  make: string;
  model: string;
  year: number;
  type: string;
  seats: number;
  price: number;
  available: boolean;
  images?: string[];
}

interface UserProfile {
  building?: string;
  buildingId?: string;
  firstName?: string;
  isVerified?: boolean;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CarImagePlaceholder() {
  return (
    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
      <Car className="w-16 h-16 text-gray-300" />
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
      <span className="text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
    </div>
  );
}

function CarCard({ car, dateFrom, dateTo }: { car: CarItem; dateFrom?: string; dateTo?: string }) {
  const name = `${car.make} ${car.model}`;
  const hasDates = !!(dateFrom && dateTo);
  const badge = hasDates
    ? { label: 'Available', cls: 'bg-green-100 text-green-700' }
    : car.available
      ? { label: 'Available', cls: 'bg-green-100 text-green-700' }
      : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        {car.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={car.images[0]}
            alt={`${car.make} ${car.model}`}
            className="w-full h-48 object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
          />
        ) : null}
        <div className={car.images?.[0] ? 'hidden' : ''}>
          <CarImagePlaceholder />
        </div>
        {badge && (
          <div className="absolute top-3 left-3">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{name}</h3>
          <span className="text-blue-600 font-bold text-sm whitespace-nowrap ml-2">${car.price}/day</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <span>{car.year}</span>
          <span>·</span>
          <span>{car.type}</span>
          <span>·</span>
          <Users className="w-3 h-3" />
          <span>{car.seats} seats</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <StarRating rating={4.8} />
          <span className="text-xs text-gray-400">New listing</span>
        </div>
        <Link
          href={`/cars/${car._id}`}
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
}

function DualRangeSlider({
  value,
  onChange,
  min = 0,
  max = 1000,
  step = 5,
}: {
  value: [number, number];
  onChange: (v: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<'min' | 'max' | null>(null);
  // Keep latest value/onChange in refs so mouseMove handler never goes stale
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  function clamp(v: number) {
    return Math.max(min, Math.min(max, Math.round(v / step) * step));
  }

  function clientXToValue(clientX: number) {
    if (!trackRef.current) return min;
    const { left, width } = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - left) / width));
    return clamp(pct * (max - min) + min);
  }

  function startDrag(clientX: number) {
    const val = clientXToValue(clientX);
    const [lo, hi] = valueRef.current;
    // Pick whichever handle is closer; ties go to min
    dragging.current = Math.abs(val - lo) <= Math.abs(val - hi) ? 'min' : 'max';
    moveDrag(clientX);
  }

  function moveDrag(clientX: number) {
    if (!dragging.current) return;
    const val = clientXToValue(clientX);
    const [lo, hi] = valueRef.current;
    if (dragging.current === 'min') {
      onChangeRef.current([Math.min(val, hi - step), hi]);
    } else {
      onChangeRef.current([lo, Math.max(val, lo + step)]);
    }
  }

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
      moveDrag(x);
    };
    const onUp = () => { dragging.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const minPct = ((value[0] - min) / (max - min)) * 100;
  const maxPct = ((value[1] - min) / (max - min)) * 100;

  return (
    <div
      ref={trackRef}
      className="relative h-5 cursor-pointer select-none mx-1"
      onMouseDown={(e) => startDrag(e.clientX)}
      onTouchStart={(e) => startDrag(e.touches[0].clientX)}
    >
      {/* Track */}
      <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 bg-gray-200 rounded-full" />
      {/* Active fill */}
      <div
        className="absolute top-1/2 h-1.5 -translate-y-1/2 bg-blue-500 rounded-full pointer-events-none"
        style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
      />
      {/* Min handle */}
      <div
        className="absolute top-1/2 w-4 h-4 -translate-y-1/2 -translate-x-1/2 bg-blue-600 rounded-full border-2 border-white shadow-md pointer-events-none"
        style={{ left: `${minPct}%` }}
      />
      {/* Max handle */}
      <div
        className="absolute top-1/2 w-4 h-4 -translate-y-1/2 -translate-x-1/2 bg-blue-600 rounded-full border-2 border-white shadow-md pointer-events-none"
        style={{ left: `${maxPct}%` }}
      />
    </div>
  );
}

function FilterSidebar({
  activeCategory,
  setActiveCategory,
  priceRange,
  setPriceRange,
  onApply,
}: {
  activeCategory: string;
  setActiveCategory: (c: string) => void;
  priceRange: [number, number];
  setPriceRange: (r: [number, number]) => void;
  onApply: () => void;
}) {
  const categories = ['All Cars', 'Electric Only', 'SUV', 'Luxury', 'Compact'];

  return (
    <aside className="w-64 flex-shrink-0">
      <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="w-4 h-4 text-gray-600" />
          <h2 className="font-semibold text-gray-900 text-sm">Filters</h2>
        </div>

        {/* Categories */}
        <div className="space-y-1 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                activeCategory === cat
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Price Range / day
          </h3>

          {/* Current range label */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-800">${priceRange[0]}</span>
            <span className="text-xs text-gray-400">–</span>
            <span className="text-sm font-semibold text-gray-800">${priceRange[1]}</span>
          </div>

          {/* Dual-handle slider */}
          <DualRangeSlider value={priceRange} onChange={setPriceRange} />

          {/* Number inputs for precise entry */}
          <div className="flex items-center gap-2 mt-4">
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Min</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  min={0}
                  max={priceRange[1] - 5}
                  step={5}
                  value={priceRange[0]}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(Number(e.target.value) || 0, priceRange[1] - 5));
                    setPriceRange([val, priceRange[1]]);
                  }}
                  className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <span className="text-gray-400 mt-5">–</span>
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Max</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  min={priceRange[0] + 5}
                  max={1000}
                  step={5}
                  value={priceRange[1]}
                  onChange={(e) => {
                    const val = Math.max(priceRange[0] + 5, Number(e.target.value) || priceRange[0] + 5);
                    setPriceRange([priceRange[0], val]);
                  }}
                  className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onApply}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </aside>
  );
}

function BrowsePageContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = use(searchParams);
  const initialSearch = typeof params.q === 'string' ? params.q : '';

  const [search, setSearch] = useState(initialSearch);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Cars');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sort, setSort] = useState('Recommended');
  const [cars, setCars] = useState<CarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const { userId } = getAuth();
    if (userId) {
      api.getMe().then((u) => setUserProfile(u as UserProfile)).catch(() => {});
    }
  }, []);

  // Always keep a ref to the latest fetchCars so effects never capture stale state
  const fetchCarsRef = useRef<() => void>(() => {});

  async function fetchCars() {
    try {
      setLoading(true);
      setError('');
      const queryParams: Record<string, string | number> = {};
      if (search.trim()) queryParams.search = search.trim();
      if (activeCategory === 'Electric Only') queryParams.type = 'Electric';
      queryParams.minPrice = priceRange[0];
      queryParams.maxPrice = priceRange[1];
      if (dateFrom) queryParams.startDate = dateFrom;
      if (dateTo)   queryParams.endDate   = dateTo;
      const data = await api.getCars(queryParams as Parameters<typeof api.getCars>[0]) as CarItem[];
      let sorted = [...data];
      if (sort === 'Price: Low to High') sorted.sort((a, b) => a.price - b.price);
      else if (sort === 'Price: High to Low') sorted.sort((a, b) => b.price - a.price);
      setCars(sorted);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load cars');
    } finally {
      setLoading(false);
    }
  }

  fetchCarsRef.current = fetchCars;

  // Initial load
  useEffect(() => { fetchCarsRef.current(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-apply when any filter changes — debounced 400ms for price slider
  useEffect(() => {
    const t = setTimeout(() => fetchCarsRef.current(), 400);
    return () => clearTimeout(t);
  }, [priceRange, activeCategory, sort, dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side category filter (SUV/Luxury/Compact can't be queried by server)
  const filteredCars = cars.filter((car) => {
    const name = `${car.make} ${car.model}`.toLowerCase();
    if (activeCategory === 'SUV') return name.includes('q5') || name.includes('wrangler') || name.includes('rav4') || name.includes('cr-v') || name.includes('x5');
    if (activeCategory === 'Luxury') return name.includes('porsche') || name.includes('audi') || name.includes('bmw') || name.includes('mercedes');
    if (activeCategory === 'Compact') return name.includes('mini') || name.includes('prius') || name.includes('civic') || name.includes('corolla');
    return true;
  });

  return (
    <AppLayout>
      {/* Search bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="flex items-stretch gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by make or model"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchCars()}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={fetchCars}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 sm:px-6 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap"
              >
                Search
              </button>
            </div>
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-sm text-gray-900 focus:outline-none border-none flex-1 min-w-0 bg-transparent"
              />
              <span className="text-gray-400 text-sm">–</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-sm text-gray-900 focus:outline-none border-none flex-1 min-w-0 bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Building identity banner */}
      {userProfile?.building ? (
        <div className="bg-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-base leading-tight">{userProfile.building}</p>
                  <span className="flex items-center gap-1 bg-white/20 text-xs font-semibold px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Your Building
                  </span>
                </div>
                <p className="text-blue-100 text-xs mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Showing only cars available in your community
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
                <p className="text-xl font-bold leading-none">{loading ? '—' : cars.filter(c => c.available).length}</p>
                <p className="text-blue-100 text-xs mt-0.5">cars available</p>
              </div>
              <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
                <p className="text-xl font-bold leading-none">{loading ? '—' : cars.length}</p>
                <p className="text-blue-100 text-xs mt-0.5">total listed</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Main content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Mobile filter toggle */}
        <div className="lg:hidden mb-3">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {sidebarOpen ? ' ▲' : ' ▼'}
          </button>
          {sidebarOpen && (
            <div className="mt-2">
              <FilterSidebar
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                onApply={() => { fetchCars(); setSidebarOpen(false); }}
              />
            </div>
          )}
        </div>

        <div className="flex gap-6">
          {/* Sidebar — desktop only */}
          <div className="hidden lg:block">
            <FilterSidebar
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              onApply={fetchCars}
            />
          </div>

          {/* Car grid */}
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {userProfile?.building ? `Cars at ${userProfile.building}` : 'Available Cars'}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {loading ? 'Loading...' : (
                    dateFrom && dateTo
                      ? `${filteredCars.length} car${filteredCars.length !== 1 ? 's' : ''} available ${new Date(dateFrom).toLocaleDateString('en-US',{month:'short',day:'numeric'})}–${new Date(dateTo).toLocaleDateString('en-US',{month:'short',day:'numeric'})}`
                      : `${filteredCars.length} car${filteredCars.length !== 1 ? 's' : ''} in your building`
                  )}
                </p>
              </div>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option>Recommended</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
                {error}
              </div>
            )}

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                    <div className="w-full h-48 bg-gray-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-8 bg-gray-200 rounded mt-3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCars.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCars.map((car) => (
                  <CarCard key={car._id} car={car} dateFrom={dateFrom} dateTo={dateTo} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Car className="w-16 h-16 mb-4 text-gray-200" />
                <p className="text-lg font-medium text-gray-500">No cars found</p>
                <p className="text-sm mt-1 text-center">
                  {userProfile?.building
                    ? `No cars listed at ${userProfile.building} yet. Be the first to list yours!`
                    : 'Try adjusting your filters or search term.'}
                </p>
                {userProfile?.building && (
                  <Link href="/host/list" className="mt-4 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                    List Your Car
                  </Link>
                )}
              </div>
            )}

            {/* Pagination placeholder */}
            {filteredCars.length > 9 && (
              <div className="flex items-center justify-center gap-1 mt-8">
                <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="w-9 h-9 rounded-lg text-sm font-medium bg-blue-600 text-white">1</button>
                <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>}>
      <BrowsePageContent searchParams={searchParams} />
    </Suspense>
  );
}
