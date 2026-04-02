import Link from 'next/link';
import { Car, Shield, Lock, Eye, Server, Key } from 'lucide-react';

export default function SecurityPage() {
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
          <Lock className="w-7 h-7 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Security</h1>
        </div>
        <p className="text-gray-500 mb-10">How we protect your data and the GarKar community.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <Lock className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Encrypted at Rest</h3>
            <p className="text-sm text-gray-600">All sensitive data — including residency documents and personal information — is encrypted using AES-256 before storage.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Encrypted in Transit</h3>
            <p className="text-sm text-gray-600">All communication between your device and GarKar servers uses TLS 1.3. We enforce HTTPS on every endpoint with no plain-text fallback.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <Key className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Secure Authentication</h3>
            <p className="text-sm text-gray-600">Passwords are hashed using bcrypt with a cost factor of 10. We use short-lived JWT tokens (1 hour) with secure refresh token rotation (7 days).</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Minimal Data Access</h3>
            <p className="text-sm text-gray-600">Verification documents are accessible only to authorized staff for residency review. No third parties have access to your personal documents.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <Server className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Rate Limiting</h3>
            <p className="text-sm text-gray-600">Login and registration endpoints are rate-limited to protect against brute-force attacks. Repeated failures result in temporary lockouts.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Community Trust</h3>
            <p className="text-sm text-gray-600">Every user on GarKar is a verified resident of a partner building. This residency gate provides a layer of real-world accountability that public platforms lack.</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-2">Report a Vulnerability</h2>
          <p className="text-sm text-gray-700">If you discover a security issue, please disclose it responsibly by emailing <strong>security@garkar.com</strong>. Do not post security vulnerabilities publicly. We take all reports seriously and will respond within 48 hours.</p>
        </div>

        <p className="text-xs text-center text-gray-400 mt-8">
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          {' · '}
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
          {' · '}
          <Link href="/contact" className="hover:underline">Contact</Link>
        </p>
      </main>
    </div>
  );
}
