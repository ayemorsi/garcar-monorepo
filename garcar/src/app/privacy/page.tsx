import Link from 'next/link';
import { Car, Shield } from 'lucide-react';

export default function PrivacyPage() {
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
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-7 h-7 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
        </div>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 1, 2024</p>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
            <p className="mb-2">We collect information you provide when you create an account or use the platform:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account info:</strong> name, email address, password (hashed), building</li>
              <li><strong>Verification docs:</strong> lease agreements or utility bills for residency verification</li>
              <li><strong>Trip data:</strong> booking history, check-in/check-out photos, messages</li>
              <li><strong>Usage data:</strong> pages visited, features used, device information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Verify your residency and identity for community safety</li>
              <li>Facilitate bookings between Hosts and Guests</li>
              <li>Process payments and send receipts</li>
              <li>Send booking confirmations, reminders, and service updates</li>
              <li>Investigate disputes and enforce our Terms of Service</li>
              <li>Improve the platform through aggregated analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Verification Documents</h2>
            <p>Residency verification documents (lease agreements, utility bills) are:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Encrypted at rest using AES-256</li>
              <li>Accessible only to authorized GarKar staff for verification review</li>
              <li>Never sold or shared with third parties</li>
              <li>Retained only as long as your account is active</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Information Sharing</h2>
            <p>We share limited information between Hosts and Guests to facilitate bookings (e.g., first name, profile photo, car details). We do not sell personal data to advertisers or data brokers. We may share information with:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Payment processors to handle transactions</li>
              <li>Law enforcement if required by valid legal process</li>
              <li>Building management only to confirm residency status (with your consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. Upon account deletion, personal data is removed within 30 days, except where we are required to retain it for legal or financial compliance.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data at any time. Contact us at <Link href="/contact" className="text-blue-600 hover:underline">support</Link> or email privacy@garkar.com to submit a request.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Cookies</h2>
            <p>We use essential cookies to keep you logged in and maintain session security. We do not use third-party advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Contact</h2>
            <p>For privacy questions, contact privacy@garkar.com or visit our <Link href="/contact" className="text-blue-600 hover:underline">contact page</Link>.</p>
          </section>
        </div>

        <p className="text-xs text-center text-gray-400 mt-8">
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
          {' · '}
          <Link href="/security" className="hover:underline">Security</Link>
          {' · '}
          <Link href="/contact" className="hover:underline">Contact</Link>
        </p>
      </main>
    </div>
  );
}
