import Link from 'next/link';
import { Car, UserCheck, Search, CalendarCheck, Key, Star, DollarSign, Shield } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <Car className="w-6 h-6" />
            GarKar
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
            <Link href="/auth/signup" className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-semibold tracking-widest text-blue-600 uppercase mb-3">GarKar</span>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">How GarKar Works</h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">Hyper-local car sharing exclusively for residents of the same apartment community.</p>
        </div>

        {/* For Renters */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">For Renters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: UserCheck, step: '1', title: 'Verify Residency', desc: 'Sign up and upload proof of residency. GarKar confirms you live in a partner building — usually within 24 hours.' },
              { icon: Search, step: '2', title: 'Browse Nearby Cars', desc: 'See cars available in your building — sorted by type, price, and availability. No hunting across neighborhoods.' },
              { icon: CalendarCheck, step: '3', title: 'Book Instantly', desc: 'Pick your dates and times. Send a booking request. Hosts typically respond within a few hours.' },
              { icon: Key, step: '4', title: 'Pick Up & Go', desc: 'Meet your neighbor in the garage, do a quick photo check-in, and hit the road.' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-xs font-bold text-blue-600 mb-1">Step {step}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* For Hosts */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">For Hosts</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: Car, step: '1', title: 'List Your Car', desc: 'Enter your VIN for instant details, add photos, set your hourly or daily rate, and configure availability in minutes.' },
              { icon: CalendarCheck, step: '2', title: 'Accept Bookings', desc: 'Review booking requests and accept with one tap. Set your own schedule — your car, your rules.' },
              { icon: Shield, step: '3', title: 'Handoff & Check-in', desc: 'Meet your renter in the garage. Both parties document the car with photos before the trip starts.' },
              { icon: DollarSign, step: '4', title: 'Earn Every Month', desc: 'Most hosts earn enough to offset their monthly parking costs. Payouts hit your account 3–5 days after each trip.' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-xs font-bold text-green-600 mb-1">Step {step}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust section */}
        <section className="bg-blue-600 rounded-3xl p-10 text-white text-center mb-12">
          <Star className="w-8 h-8 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-3">Built on Community Trust</h2>
          <p className="text-blue-100 max-w-lg mx-auto mb-6">
            Unlike public car-sharing apps, every person on GarKar is a verified resident of your building. Real accountability. Real neighbors. Real trust.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup" className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors">
              Join Your Building
            </Link>
            <Link href="/host/list" className="bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-400 transition-colors">
              List Your Car
            </Link>
          </div>
        </section>

        <p className="text-xs text-center text-gray-400">
          <Link href="/terms" className="hover:underline">Terms</Link>
          {' · '}
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          {' · '}
          <Link href="/help" className="hover:underline">Help Center</Link>
        </p>
      </main>
    </div>
  );
}
