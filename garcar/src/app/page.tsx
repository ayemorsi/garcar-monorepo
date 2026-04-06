import Link from 'next/link';
import { Car, Shield, Users, Star, ArrowRight, CheckCircle, Zap, MapPin, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const FEATURES = [
  { icon: MapPin, title: 'Same-Building Pickup', desc: 'Grab a car right from your parking garage — no commute to a rental lot.' },
  { icon: Shield, title: 'Fully Insured', desc: 'Comprehensive coverage on every rental. Drive with complete peace of mind.' },
  { icon: Users, title: 'Verified Community', desc: 'Only verified residents can rent or list. Your neighbors, not strangers.' },
  { icon: Zap, title: 'Instant Booking', desc: 'Find a car, book it, and get the keys — all in under two minutes.' },
  { icon: Star, title: 'Rated Hosts', desc: "Every host is reviewed by fellow residents so you always know who you're renting from." },
  { icon: Clock, title: 'Flexible Hours', desc: 'Book by the hour or by the day. Return when it works for you.' },
];

const STEPS = [
  { step: '01', title: 'Join Your Building', desc: 'Sign up and verify your residency with a lease or utility doc.' },
  { step: '02', title: 'Browse Available Cars', desc: 'See every car listed by neighbors in your building, with real-time availability.' },
  { step: '03', title: 'Book & Go', desc: 'Reserve in seconds. Pick up from your parking garage — no extra trip needed.' },
  { step: '04', title: 'Return & Review', desc: 'Drop it back off and leave a review. Simple as that.' },
];

const STATS = [
  { value: '2,400+', label: 'Active Renters' },
  { value: '180+', label: 'Partner Buildings' },
  { value: '4.9★', label: 'Average Rating' },
  { value: '$0', label: 'Membership Fee' },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* ─── Nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <Car className="w-5 h-5" /> GarKar
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/how-it-works" className="hover:text-foreground transition-colors">How it works</Link>
            <Link href="/browse" className="hover:text-foreground transition-colors">Browse Cars</Link>
            <Link href="/help" className="hover:text-foreground transition-colors">Help</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="inline-flex items-center justify-center h-7 px-2.5 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">Log in</Link>
            <Link href="/auth/signup" className="inline-flex items-center justify-center h-7 px-2.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Get started</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ─── Hero ────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-4 sm:px-6 py-20 sm:py-32 text-center">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
          </div>
          <div className="max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-6 gap-1.5 px-3 py-1 text-xs font-medium border-primary/30 text-primary bg-primary/5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Now live in 180+ apartment buildings
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight mb-6">
              Rent cars from<br className="hidden sm:block" />
              <span className="text-primary"> your neighbors</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
              GarKar is the hyper-local car-sharing platform built for apartment residents. No rental lots. No strangers. Just your building.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 w-full sm:w-auto h-12 px-8 text-base font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                Get started free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/browse" className="inline-flex items-center justify-center w-full sm:w-auto h-12 px-8 text-base font-medium rounded-lg border border-border bg-background hover:bg-muted transition-colors">
                Browse cars
              </Link>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">Free to join · No credit card required · Residency verification required</p>
          </div>
          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* ─── Features ────────────────────────────────────────── */}
        <section className="py-20 sm:py-28 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Why GarKar</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Everything you need, nothing you don&apos;t</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Designed from the ground up for apartment living — because a rental car shouldn&apos;t require a taxi ride.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="border-border/60 hover:border-primary/30 hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <Separator />

        {/* ─── How it Works ────────────────────────────────────── */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">The Process</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Up and running in minutes</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map(({ step, title, desc }) => (
                <div key={step}>
                  <div className="text-5xl font-black text-primary/10 mb-3 leading-none">{step}</div>
                  <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Separator />

        {/* ─── Trust ───────────────────────────────────────────── */}
        <section className="py-20 sm:py-28 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Built for trust</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-5">
                  Every rental is protected. Every renter is verified.
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Before anyone can book or list a car, they must verify their residency. Every person you interact with has been confirmed to live in your building.
                </p>
                <ul className="space-y-3">
                  {[
                    'Residency document verification required',
                    'Comprehensive insurance on every trip',
                    'AES-256 encrypted document handling',
                    'Two-way ratings keep the community accountable',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Shield, label: 'Full Insurance', sub: 'Every trip covered' },
                  { icon: CheckCircle, label: 'ID Verified', sub: 'Residents only' },
                  { icon: Star, label: '4.9 Avg Rating', sub: 'Community trust' },
                  { icon: Zap, label: 'Instant Access', sub: 'Book in 60 seconds' },
                ].map(({ icon: Icon, label, sub }) => (
                  <Card key={label} className="border-border/60">
                    <CardContent className="p-5">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <p className="font-semibold text-sm text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA Banner ──────────────────────────────────────── */}
        <section className="py-20 sm:py-28 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="relative rounded-3xl bg-primary px-8 py-14 text-center overflow-hidden">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Your neighbors are already sharing.</h2>
              <p className="text-white/80 text-base mb-8 max-w-md mx-auto">
                Join the waitlist for your building or list your car to start earning today.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/auth/signup" className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-white text-primary text-sm font-semibold hover:bg-white/90 transition-colors">
                  Create free account
                </Link>
                <Link href="/how-it-works" className="inline-flex items-center justify-center h-12 px-8 rounded-lg border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors">
                  Learn more
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 sm:col-span-1">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary mb-3">
                <Car className="w-5 h-5" /> GarKar
              </Link>
              <p className="text-sm text-muted-foreground">Hyper-local car sharing for apartment communities.</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Platform</p>
              <div className="space-y-2 text-sm">
                <Link href="/browse" className="block text-muted-foreground hover:text-foreground transition-colors">Browse Cars</Link>
                <Link href="/host/list" className="block text-muted-foreground hover:text-foreground transition-colors">Host a Car</Link>
                <Link href="/how-it-works" className="block text-muted-foreground hover:text-foreground transition-colors">How it Works</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Support</p>
              <div className="space-y-2 text-sm">
                <Link href="/help" className="block text-muted-foreground hover:text-foreground transition-colors">Help Center</Link>
                <Link href="/contact" className="block text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
                <Link href="/security" className="block text-muted-foreground hover:text-foreground transition-colors">Security</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Legal</p>
              <div className="space-y-2 text-sm">
                <Link href="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="block text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
          <Separator />
          <p className="mt-6 text-center text-xs text-muted-foreground">© 2025 GarKar Technologies Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
