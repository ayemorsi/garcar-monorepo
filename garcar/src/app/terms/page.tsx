import Link from 'next/link';
import { Car } from 'lucide-react';

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 1, 2024</p>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>By creating an account or using GarKar, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use our platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Eligibility</h2>
            <p>GarKar is exclusively available to verified residents of partner apartment communities. You must be at least 18 years old and hold a valid driver&apos;s license to rent a vehicle. Hosts must be at least 21 years old.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Platform Role</h2>
            <p>GarKar is a peer-to-peer car-sharing marketplace. We connect vehicle owners (&quot;Hosts&quot;) with renters (&quot;Guests&quot;) within the same residential community. GarKar is not a rental car company and does not own any vehicles listed on the platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. User Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Guests must return vehicles in the same condition as received, on time, with the same fuel level.</li>
              <li>Hosts must ensure vehicles are safe, legally registered, and accurately described.</li>
              <li>All users must treat fellow community members with respect.</li>
              <li>You are responsible for any fines, tolls, or violations incurred during your rental period.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Payments & Fees</h2>
            <p>Rental prices are set by Hosts. GarKar charges a service fee on each transaction. All payments are processed securely through our payment provider. Hosts receive payouts within 3–5 business days after a completed trip.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Cancellations</h2>
            <p>Cancellations made more than 24 hours before the trip start receive a full refund. Cancellations within 24 hours are subject to a cancellation fee equal to one hour of the rental rate. No-shows forfeit the full booking amount.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Damage & Insurance</h2>
            <p>GarKar strongly recommends that Hosts verify their personal auto insurance covers peer-to-peer car sharing. Guests acknowledge liability for damage caused during the rental period. All trips require check-in and check-out photo documentation.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Prohibited Uses</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sub-renting or re-listing vehicles rented from other users.</li>
              <li>Using vehicles for commercial transportation (e.g., rideshare, delivery).</li>
              <li>Driving under the influence of alcohol or drugs.</li>
              <li>Taking vehicles outside the agreed service area without Host approval.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms, receive repeated negative reviews, or engage in fraudulent activity, without prior notice.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of GarKar after changes constitutes acceptance of the updated terms. We will notify users of material changes via email or in-app notification.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Contact</h2>
            <p>Questions about these terms? <Link href="/contact" className="text-blue-600 hover:underline">Contact us</Link> or email legal@garkar.com.</p>
          </section>
        </div>

        <p className="text-xs text-center text-gray-400 mt-8">
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          {' · '}
          <Link href="/security" className="hover:underline">Security</Link>
          {' · '}
          <Link href="/contact" className="hover:underline">Contact</Link>
        </p>
      </main>
    </div>
  );
}
