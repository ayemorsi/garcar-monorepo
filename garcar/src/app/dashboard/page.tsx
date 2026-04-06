'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Car, CalendarDays, MessageSquare, PlusCircle, Star, TrendingUp, Clock, MapPin, Clock3, ArrowRight, LayoutDashboard } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const QUICK_ACTIONS = [
  { href: '/browse', icon: Car, label: 'Browse Cars', desc: 'Find a car in your building', color: 'bg-primary/10 text-primary' },
  { href: '/my-trips', icon: CalendarDays, label: 'My Trips', desc: 'View all your rentals', color: 'bg-purple-100 text-purple-600' },
  { href: '/host/list', icon: PlusCircle, label: 'List My Car', desc: 'Earn by sharing your car', color: 'bg-green-100 text-green-600' },
  { href: '/messages', icon: MessageSquare, label: 'Messages', desc: 'Chat with neighbors', color: 'bg-orange-100 text-orange-600' },
];

interface Booking {
  _id: string;
  carId: { make: string; model: string; year: number };
  ownerId: { firstName?: string; lastName?: string; username: string };
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
}

interface UserProfile {
  firstName?: string;
  lastName?: string;
  username: string;
  avgRating: number;
  tripCount: number;
  building?: string;
  isVerified?: boolean;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700 border-green-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  cancelled: 'bg-red-100 text-red-600 border-red-200',
  completed: 'bg-muted text-muted-foreground border-border',
};

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getBookings(), api.getMe()])
      .then(([b, p]) => {
        setBookings(b as Booking[]);
        setProfile(p as UserProfile);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcomingBookings = bookings.filter((b) => new Date(b.endDate) >= now && b.status !== 'cancelled');
  const nextBooking = upcomingBookings.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

  const displayName = profile?.firstName
    ? `${profile.firstName} ${profile.lastName ?? ''}`.trim()
    : profile?.username ?? 'there';

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Pending banner */}
        {!loading && profile && !profile.isVerified && (
          <div className="mb-6 flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <Clock3 className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">Your account is pending approval</p>
              <p className="text-sm text-amber-700 mt-0.5">Our team is reviewing your residency document. You&apos;ll get full access once approved — usually within 24 hours.</p>
            </div>
            <a href="/verify/residency" className="text-xs font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap underline shrink-0">
              Check status →
            </a>
          </div>
        )}

        {/* Welcome */}
        <div className="mb-8">
          {loading ? (
            <Skeleton className="h-9 w-56 mb-2" />
          ) : (
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Welcome back, {displayName} 👋
            </h1>
          )}
          <p className="text-muted-foreground text-sm mt-1">Here&apos;s what&apos;s happening in your community today.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Upcoming Trips</CardTitle>
              <CalendarDays className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-9 w-12" /> : (
                <p className="text-3xl font-bold text-foreground">{upcomingBookings.length}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {nextBooking ? `Next: ${formatDate(nextBooking.startDate)}` : 'No upcoming trips'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Trust Score</CardTitle>
              <Star className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-9 w-12" /> : (
                <p className="text-3xl font-bold text-foreground">
                  {(profile?.avgRating ?? 0) > 0 ? (profile?.avgRating ?? 0).toFixed(1) : '—'}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {loading ? '' : `${profile?.tripCount ?? 0} trips completed`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Total Bookings</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-9 w-12" /> : (
                <p className="text-3xl font-bold text-foreground">{bookings.length}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">

            {/* Quick actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {QUICK_ACTIONS.map(({ href, icon: Icon, label, desc, color }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all group"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{label}</p>
                        <p className="text-xs text-muted-foreground hidden sm:block truncate">{desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming trips */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Upcoming Trips</CardTitle>
                <Link href="/my-trips" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-primary h-8 px-3')}>
                  View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                  </div>
                ) : upcomingBookings.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                      <Car className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">No upcoming trips</p>
                    <Link href="/browse" className={cn(buttonVariants({ size: 'sm' }))}>Browse cars</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingBookings.slice(0, 3).map((booking) => {
                      const carName = booking.carId
                        ? `${booking.carId.year} ${booking.carId.make} ${booking.carId.model}`
                        : 'Unknown Car';
                      return (
                        <div key={booking._id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                          <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                            <Car className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">{carName}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 shrink-0" />
                              {formatDate(booking.startDate)} – {formatDate(booking.endDate)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <Badge
                              variant="outline"
                              className={`text-xs mb-1 ${STATUS_STYLES[booking.status] ?? STATUS_STYLES.completed}`}
                            >
                              {booking.status}
                            </Badge>
                            <p className="text-sm font-bold text-foreground">${booking.totalPrice}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Your Building
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-foreground">
                  {profile?.building || 'GarKar Community'}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {profile?.building ? 'Arlington, VA' : 'Verified Residents Network'}
                </p>
                <Link href="/browse" className={cn(buttonVariants(), 'w-full')}>Browse Cars</Link>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground border-0">
              <CardContent className="p-5">
                <Car className="w-8 h-8 mb-3 opacity-80" />
                <h3 className="font-semibold mb-1">Have a car?</h3>
                <p className="text-sm opacity-80 mb-4">Earn up to $1,200/month sharing with your neighbors.</p>
                <Link href="/host/list" className={cn(buttonVariants({ variant: 'secondary' }), 'w-full font-semibold')}>List My Car</Link>
              </CardContent>
            </Card>

            <Link
              href="/host/dashboard"
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Host Dashboard</p>
                <p className="text-xs text-muted-foreground">Manage your listings</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
