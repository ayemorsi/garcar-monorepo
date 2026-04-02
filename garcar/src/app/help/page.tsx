import Link from 'next/link';
import { Car, ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'Who can use GarKar?',
    a: 'GarKar is exclusively for verified residents of partner apartment communities. After signing up, you\'ll complete a residency verification step before your first rental.',
  },
  {
    q: 'How do I book a car?',
    a: 'Browse available cars in your building, select your dates and times, and send a booking request. The host has 24 hours to accept. Once confirmed, you\'ll receive pick-up instructions.',
  },
  {
    q: 'What happens if I\'m late returning the car?',
    a: 'You\'ll be charged for each additional hour at the hourly rate. Repeated late returns may affect your renter rating and ability to book future trips.',
  },
  {
    q: 'What if the car has damage when I pick it up?',
    a: 'Document everything with check-in photos before driving. If you notice pre-existing damage, photograph it and message the host immediately. Check-in photos are your protection.',
  },
  {
    q: 'How does host payout work?',
    a: 'Hosts receive payouts 3–5 business days after a trip is completed. Earnings are summarized in your Host Dashboard.',
  },
  {
    q: 'Can I cancel a booking?',
    a: 'Yes. Cancellations more than 24 hours before the trip start receive a full refund. Within 24 hours, a cancellation fee equal to one hour of the rental rate applies.',
  },
  {
    q: 'Is my personal information safe?',
    a: 'Yes. All data is encrypted at rest and in transit. Verification documents are only accessible to authorized GarKar staff. See our Security page for full details.',
  },
  {
    q: 'How do I list my car?',
    a: 'Go to Host > List a Car. You\'ll enter your vehicle details (or decode them from your VIN), upload photos, set your pricing and schedule, and agree to host standards. The whole process takes about 5 minutes.',
  },
  {
    q: 'What if something goes wrong during a trip?',
    a: 'Contact the other party through the in-app messaging system first. If unresolved, reach out to GarKar support via the Contact page. For emergencies, call 911.',
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <Car className="w-6 h-6" />
            GarKar
          </Link>
          <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
        <p className="text-gray-500 mb-10">Frequently asked questions about GarKar.</p>

        <div className="space-y-3 mb-12">
          {FAQS.map((faq, i) => (
            <details key={i} className="bg-white rounded-xl border border-gray-200 group">
              <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none font-medium text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
                {faq.q}
                <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" />
              </summary>
              <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                {faq.a}
              </div>
            </details>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
          <h2 className="font-semibold text-gray-900 mb-1">Still have questions?</h2>
          <p className="text-sm text-gray-600 mb-4">Our support team usually responds within a few hours.</p>
          <Link
            href="/contact"
            className="inline-block bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </main>
    </div>
  );
}
