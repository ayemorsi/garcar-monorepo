'use client';

import { Suspense, useState, use, useEffect } from 'react';
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
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';

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

function CarCard({ car }: { car: CarItem }) {
  const name = `${car.make} ${car.model}`;
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
        {car.available && (
          <div className="absolute top-3 left-3">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              AVAILABLE
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
            Price Range
          </h3>
          <div className="space-y-3">
            <input
              type="range"
              min={20}
              max={300}
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="w-full accent-blue-600"
            />
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span className="font-medium">${priceRange[0]}</span>
              <span className="font-medium">${priceRange[1]}</span>
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
  const [priceRange, setPriceRange] = useState<[number, number]>([20, 300]);
  const [sort, setSort] = useState('Recommended');
  const [cars, setCars] = useState<CarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchCars() {
    try {
      setLoading(true);
      setError('');
      const queryParams: Record<string, string | number> = {};
      if (search.trim()) queryParams.search = search.trim();
      if (activeCategory === 'Electric Only') queryParams.type = 'Electric';
      queryParams.minPrice = priceRange[0];
      queryParams.maxPrice = priceRange[1];
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

  useEffect(() => { fetchCars(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by car make or model"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCars()}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5 bg-white">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-sm text-gray-700 focus:outline-none border-none"
              />
              <span className="text-gray-400 text-sm">–</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-sm text-gray-700 focus:outline-none border-none"
              />
            </div>
            <button
              onClick={fetchCars}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap"
            >
              Find Cars
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <FilterSidebar
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            onApply={fetchCars}
          />

          {/* Car grid */}
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Available Cars</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {loading ? 'Loading...' : `Showing ${filteredCars.length} car${filteredCars.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); fetchCars(); }}
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
                  <CarCard key={car._id} car={car} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Car className="w-16 h-16 mb-4 text-gray-200" />
                <p className="text-lg font-medium text-gray-500">No cars found</p>
                <p className="text-sm mt-1">Try adjusting your filters or search term.</p>
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
